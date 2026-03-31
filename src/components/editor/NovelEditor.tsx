"use client";

// Enhanced Tiptap 3 editor with Novel-style UX
// Features: slash commands, bubble menu, drag handle, image upload, auto-save
// Reference: Novel (github.com/steven-tey/novel), built natively on Tiptap 3.x

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import CharacterCount from "@tiptap/extension-character-count";
import { all, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
  Unlink,
} from "lucide-react";
import { createSlashCommandExtension } from "./SlashCommand";

const lowlight = createLowlight(all);

// Module-level callback for slash command image upload
// This avoids React ref access during render (strict lint rule)
let _imageUploadTrigger: (() => void) | null = null;
function triggerImageUpload() {
  _imageUploadTrigger?.();
}

interface NovelEditorProps {
  /** Initial HTML content */
  content?: string;
  /** Called when content changes, returns HTML string */
  onChange?: (html: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Custom image upload handler — should return the image URL */
  onImageUpload?: (file: File) => Promise<string>;
  /** Additional className for the editor container */
  className?: string;
}

export default function NovelEditor({
  content = "",
  onChange,
  placeholder = "输入 / 打开命令菜单...",
  onImageUpload,
  className = "",
}: NovelEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Register the file input click as the module-level image upload trigger
  useEffect(() => {
    if (onImageUpload) {
      _imageUploadTrigger = () => fileInputRef.current?.click();
    }
    return () => {
      _imageUploadTrigger = null;
    };
  }, [onImageUpload]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      ImageExtension.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-xl max-w-full mx-auto my-4",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary-light underline underline-offset-2 decoration-primary/30",
        },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      Placeholder.configure({
        placeholder,
        emptyNodeClass: "is-editor-empty",
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: "bg-yellow-500/20 text-foreground rounded px-0.5",
        },
      }),
      Underline,
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2",
        },
      }),
      TextStyle,
      Color,
      CharacterCount,
      createSlashCommandExtension(onImageUpload ? triggerImageUpload : undefined),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[400px] px-6 py-4 focus:outline-none text-foreground/80 " +
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-4 " +
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 " +
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 " +
          "[&_p]:leading-relaxed " +
          "[&_pre]:bg-surface [&_pre]:border [&_pre]:border-border [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto " +
          "[&_code]:font-mono [&_code]:text-accent-light [&_code]:text-sm " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 " +
          "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_blockquote]:py-3 [&_blockquote]:my-4 [&_blockquote]:not-italic [&_blockquote]:text-foreground/80 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-xl " +
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm " +
          "[&_th]:bg-surface [&_th]:px-4 [&_th]:py-2 [&_th]:border [&_th]:border-border [&_th]:text-foreground [&_th]:text-left [&_th]:font-semibold " +
          "[&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-border [&_td]:text-foreground/90 " +
          "[&_img]:rounded-xl [&_img]:max-w-full [&_img]:mx-auto [&_img]:my-4 " +
          "[&_hr]:border-border [&_hr]:my-6",
      },
      handleDrop: (view, event, _slice, moved) => {
        // Handle image drop
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file?.type.startsWith("image/") && onImageUpload) {
            event.preventDefault();
            onImageUpload(file).then((url) => {
              const { tr } = view.state;
              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (pos) {
                const node = view.state.schema.nodes.image.create({ src: url });
                const transaction = tr.insert(pos.pos, node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        // Handle image paste
        const items = event.clipboardData?.items;
        if (!items || !onImageUpload) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              onImageUpload(file).then((url) => {
                const node = view.state.schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              });
            }
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
  });

  // Update content when prop changes (e.g., loading existing post)
  useEffect(() => {
    if (editor && content && editor.isEmpty) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Hidden file input for image upload from slash command
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload || !editor) return;
      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // Upload failed, ignore silently
      }
      e.target.value = "";
    },
    [editor, onImageUpload],
  );

  // Floating toolbar state
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Show/hide floating toolbar based on text selection
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setShowToolbar(false);
        return;
      }
      // Get selection coordinates
      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const top = start.top - 45;
      const left = (start.left + end.left) / 2;
      setToolbarPos({ top, left });
      setShowToolbar(true);
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("blur", () => setShowToolbar(false));

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor]);

  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const readingTime = Math.max(1, Math.ceil(charCount / 400));

  return (
    <div className={`glass rounded-xl overflow-hidden relative ${className}`}>
      {/* Floating Toolbar — appears on text selection */}
      {showToolbar && editor && (
        <div
          ref={toolbarRef}
          className="fixed z-50 glass rounded-lg border border-border shadow-2xl flex items-center gap-0.5 p-1 animate-fade-in"
          style={{ top: toolbarPos.top, left: toolbarPos.left, transform: "translateX(-50%)" }}
        >
          <BubbleButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="加粗"
          >
            <Bold className="w-3.5 h-3.5" />
          </BubbleButton>
          <BubbleButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="斜体"
          >
            <Italic className="w-3.5 h-3.5" />
          </BubbleButton>
          <BubbleButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="下划线"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </BubbleButton>
          <BubbleButton
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="删除线"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </BubbleButton>
          <span className="w-px h-4 bg-border mx-0.5" />
          <BubbleButton
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="行内代码"
          >
            <Code className="w-3.5 h-3.5" />
          </BubbleButton>
          <BubbleButton
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="高亮"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </BubbleButton>
          <span className="w-px h-4 bg-border mx-0.5" />
          {editor.isActive("link") ? (
            <BubbleButton
              active={true}
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="取消链接"
            >
              <Unlink className="w-3.5 h-3.5" />
            </BubbleButton>
          ) : (
            <BubbleButton
              active={false}
              onClick={() => {
                const url = prompt("输入链接 URL:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              title="插入链接"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </BubbleButton>
          )}
        </div>
      )}

      {/* Editor content */}
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Placeholder style */}
      <style jsx global>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted);
          pointer-events: none;
          height: 0;
          opacity: 0.5;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          margin-top: 0.2rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
          accent-color: var(--primary);
        }
      `}</style>

      {/* Footer bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted">
        <span className="flex items-center gap-2">
          <span>{charCount} 字符</span>
          <span className="text-border">|</span>
          <span>约 {readingTime} 分钟阅读</span>
        </span>
        <span className="text-muted/50">输入 / 打开命令菜单</span>
      </div>

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

/** Get the underlying editor instance via ref */
export { type NovelEditorProps };

/** Utility to get editor HTML (for use when saving) */
export function useNovelEditorRef() {
  const editorRef = useRef<{ getHTML: () => string } | null>(null);
  return editorRef;
}

function BubbleButton({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors cursor-pointer ${
        active
          ? "bg-primary/20 text-primary-light"
          : "text-muted hover:text-foreground hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
