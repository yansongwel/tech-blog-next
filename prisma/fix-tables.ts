/**
 * Fix markdown tables in seeded articles — convert raw markdown to HTML tables.
 * Run: DATABASE_URL="..." bun prisma/fix-tables.ts
 */

import pg from "pg";
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function mdTableToHtml(md: string): string {
  const lines = md.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return md;

  const parseRow = (line: string) =>
    line.split("|").map((c) => c.trim()).filter(Boolean);

  const headers = parseRow(lines[0]);
  // lines[1] is the separator (|---|---|)
  const rows = lines.slice(2).map(parseRow);

  let html = "<table><thead><tr>";
  for (const h of headers) html += `<th>${h}</th>`;
  html += "</tr></thead><tbody>";
  for (const row of rows) {
    html += "<tr>";
    for (const cell of row) {
      // Convert inline code backticks to <code> tags
      const cellHtml = cell.replace(/`([^`]+)`/g, "<code>$1</code>");
      html += `<td>${cellHtml}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}

// Find all published posts with markdown tables
const posts = await prisma.post.findMany({
  where: { content: { contains: "|------" } },
  select: { id: true, slug: true, content: true },
});

console.log(`Found ${posts.length} posts with markdown tables`);

for (const post of posts) {
  // Match markdown table blocks (lines starting with |)
  const tableRegex = /(\|[^\n]+\|\n\|[-| :]+\|\n(?:\|[^\n]+\|\n?)+)/g;
  let newContent = post.content;
  const matches = newContent.match(tableRegex);

  if (matches) {
    for (const match of matches) {
      const htmlTable = mdTableToHtml(match);
      newContent = newContent.replace(match, htmlTable);
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { content: newContent },
    });
    console.log(`  Fixed: ${post.slug} (${matches.length} table(s))`);
  }
}

console.log("Done!");
await pool.end();
process.exit(0);
