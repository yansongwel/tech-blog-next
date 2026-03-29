/**
 * Smart document importer for rich HTML files (e.g. generated guides, documentation pages).
 *
 * Handles:
 * - Extracting main content from <main>, <article>, or <body>
 * - Inlining critical styles from <style> blocks into the HTML elements
 * - Extracting title from <title>, <h1>, or <meta>
 * - Extracting description from <meta description>
 * - Cleaning up nav, footer, script, and other non-content elements
 * - Converting relative URLs if a base URL is available
 */

interface ImportResult {
  title: string;
  excerpt: string;
  content: string;
}

/**
 * Parse and extract clean content from an HTML document string.
 */
export function importHtmlDocument(rawHtml: string): ImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // 1. Extract title
  const title = extractTitle(doc);

  // 2. Extract excerpt/description
  const excerpt = extractExcerpt(doc);

  // 3. Inline styles from <style> blocks before removing them
  inlineStyles(doc);

  // 4. Remove non-content elements
  const removeSelectors = [
    "script", "noscript", "style", "link[rel=stylesheet]",
    "nav", "footer", "header:not(article header)",
    ".sidebar", ".navigation", ".menu", ".toc", ".table-of-contents",
    "[role=navigation]", "[role=banner]", "[role=contentinfo]",
    "iframe", "object", "embed",
  ];
  removeSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // 5. Find main content container (priority order)
  const contentEl =
    doc.querySelector("main") ||
    doc.querySelector("article") ||
    doc.querySelector('[role="main"]') ||
    doc.querySelector(".content") ||
    doc.querySelector(".post-content") ||
    doc.querySelector(".article-content") ||
    doc.querySelector(".entry-content") ||
    doc.body;

  // 6. Clean up the content
  let content = contentEl.innerHTML;
  content = cleanContent(content);

  return { title, excerpt, content };
}

/**
 * Import a Markdown file, extracting title and converting to HTML.
 */
export function importMarkdownDocument(text: string, markedParse: (input: string) => string): ImportResult {
  // Extract H1 title
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Remove the H1 from content
  const body = text.replace(/^#\s+.+$/m, "").trim();

  // Extract first paragraph as excerpt
  const excerptMatch = body.match(/^([^\n#>*-].{20,})/m);
  const excerpt = excerptMatch ? excerptMatch[1].slice(0, 200) : "";

  const content = markedParse(body);
  return { title, excerpt, content };
}

function extractTitle(doc: Document): string {
  // Try <h1> first (most reliable for article title)
  const h1 = doc.querySelector("h1");
  if (h1?.textContent?.trim()) return h1.textContent.trim();

  // Try <title>
  const titleEl = doc.querySelector("title");
  if (titleEl?.textContent?.trim()) {
    // Often title has " - Site Name" suffix, strip it
    return titleEl.textContent.split(/\s*[-|—]\s*/)[0].trim();
  }

  // Try meta og:title
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle?.getAttribute("content")) return ogTitle.getAttribute("content")!.trim();

  return "";
}

function extractExcerpt(doc: Document): string {
  // Try meta description
  const metaDesc = doc.querySelector('meta[name="description"]');
  if (metaDesc?.getAttribute("content")) return metaDesc.getAttribute("content")!.trim();

  // Try og:description
  const ogDesc = doc.querySelector('meta[property="og:description"]');
  if (ogDesc?.getAttribute("content")) return ogDesc.getAttribute("content")!.trim();

  // Fallback: first paragraph text
  const firstP = doc.querySelector("main p, article p, body p");
  if (firstP?.textContent?.trim()) {
    const text = firstP.textContent.trim();
    return text.length > 200 ? text.slice(0, 200) + "..." : text;
  }

  return "";
}

/**
 * Attempt to inline key styles from <style> blocks into elements.
 * This ensures code blocks, tables, etc. retain their formatting
 * when the style blocks are removed.
 */
function inlineStyles(doc: Document) {
  const styleEls = doc.querySelectorAll("style");
  if (styleEls.length === 0) return;

  // Collect all CSS text
  let cssText = "";
  styleEls.forEach((s) => { cssText += s.textContent || ""; });

  // Parse simple CSS rules (class selectors and element selectors)
  const rules: { selector: string; properties: string }[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const properties = match[2].trim();
    // Only process simple selectors (skip @media, @keyframes, etc.)
    if (!selector.startsWith("@") && properties) {
      rules.push({ selector, properties });
    }
  }

  // Apply critical styles inline (background, color, border for code/pre/table)
  const criticalProperties = [
    "background-color", "background", "color", "border",
    "border-radius", "padding", "white-space", "overflow",
    "font-family", "font-size",
  ];

  for (const rule of rules) {
    try {
      // Split comma-separated selectors
      const selectors = rule.selector.split(",").map((s) => s.trim());
      for (const sel of selectors) {
        if (!sel || sel.includes("::") || sel.includes(":root") || sel === "*") continue;
        const elements = doc.querySelectorAll(sel);
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          // Only inline critical properties
          const props = rule.properties.split(";").filter(Boolean);
          for (const prop of props) {
            const [name] = prop.split(":").map((p) => p.trim());
            if (criticalProperties.some((cp) => name.startsWith(cp))) {
              htmlEl.style.cssText += prop.trim() + ";";
            }
          }
        });
      }
    } catch {
      // Invalid selector, skip
    }
  }
}

/**
 * Clean up HTML content for the Tiptap editor.
 */
function cleanContent(html: string): string {
  // Remove empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/gi, "");

  // Remove excessive whitespace between tags
  html = html.replace(/>\s{2,}</g, "> <");

  // Remove inline styles on non-code elements (keep code/pre styles for formatting)
  html = html.replace(/<(?!pre|code|span)([\w-]+)([^>]*)\sstyle="[^"]*"([^>]*)>/gi, "<$1$2$3>");

  // Remove class attributes that reference external CSS (keep hljs-* and language-* classes)
  html = html.replace(/\sclass="(?!hljs|language-)[^"]*"/gi, "");

  // Clean data attributes
  html = html.replace(/\sdata-[\w-]+="[^"]*"/gi, "");

  // Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // Normalize code blocks - ensure they have language class if possible
  html = html.replace(/<pre><code>/g, '<pre><code class="language-plaintext">');

  return html.trim();
}
