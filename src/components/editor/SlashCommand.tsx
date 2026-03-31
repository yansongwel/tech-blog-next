"use client";

// Slash command extension for Tiptap 3.x
// Reference: Novel editor (github.com/steven-tey/novel) slash command pattern

import { useState, useRef, useLayoutEffect } from "react";
import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionOptions, type SuggestionProps } from "@tiptap/suggestion";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  ImageIcon,
  Table,
  CheckSquare,
  Type,
} from "lucide-react";
import type { Editor, Range } from "@tiptap/core";

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: Editor; range: Range }) => void;
}

const getSuggestionItems = (onImageUpload?: () => void): CommandItem[] => [
  {
    title: "正文",
    description: "普通段落文本",
    icon: <Type className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "标题 1",
    description: "大标题",
    icon: <Heading1 className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "标题 2",
    description: "中标题",
    icon: <Heading2 className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "标题 3",
    description: "小标题",
    icon: <Heading3 className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "无序列表",
    description: "创建无序列表",
    icon: <List className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "有序列表",
    description: "创建有序列表",
    icon: <ListOrdered className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "待办列表",
    description: "创建任务清单",
    icon: <CheckSquare className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "代码块",
    description: "插入代码片段",
    icon: <Code className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "引用",
    description: "插入引用块",
    icon: <Quote className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "分割线",
    description: "插入水平分割线",
    icon: <Minus className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "图片",
    description: "上传或插入图片",
    icon: <ImageIcon className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      if (onImageUpload) {
        onImageUpload();
      } else {
        const url = prompt("输入图片 URL:");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    title: "表格",
    description: "插入 3×3 表格",
    icon: <Table className="w-4 h-4" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
];

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

// Inner component receives a key that resets state when items change
function CommandListInner({
  items,
  command,
}: CommandListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampedIndex = items.length > 0 ? Math.min(selectedIndex, items.length - 1) : 0;

  // Keep selected item visible
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const selected = container.children[clampedIndex] as HTMLElement | undefined;
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [clampedIndex]);

  useLayoutEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        setSelectedIndex((current) => {
          const item = items[current];
          if (item) command(item);
          return current;
        });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [items, command]);

  if (items.length === 0) {
    return (
      <div className="glass rounded-xl border border-border p-3 shadow-2xl">
        <p className="text-sm text-muted">无匹配命令</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="glass rounded-xl border border-border shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto w-64"
    >
      {items.map((item, index) => (
        <button
          key={item.title}
          onClick={() => command(item)}
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer ${
            index === clampedIndex
              ? "bg-primary/15 text-foreground"
              : "text-foreground/80 hover:bg-white/5"
          }`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <p className="text-xs text-muted truncate">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// Wrapper that resets internal state via key when items change
function CommandList({ items, command }: CommandListProps) {
  const key = items.map((i) => i.title).join(",");
  return <CommandListInner key={key} items={items} command={command} />;
}

export function createSlashCommandExtension(onImageUpload?: () => void) {
  const items = getSuggestionItems(onImageUpload);

  return Extension.create({
    name: "slashCommand",
    addOptions() {
      return {
        suggestion: {
          char: "/",
          command: ({
            editor,
            range,
            props,
          }: {
            editor: Editor;
            range: Range;
            props: CommandItem;
          }) => {
            props.command({ editor, range });
          },
          items: ({ query }: { query: string }) => {
            return items.filter(
              (item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase()),
            );
          },
          render: () => {
            let component: ReactRenderer<unknown> | null = null;
            let popup: HTMLDivElement | null = null;

            return {
              onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(CommandList, {
                  props,
                  editor: props.editor,
                });

                popup = document.createElement("div");
                popup.style.position = "absolute";
                popup.style.zIndex = "50";
                popup.appendChild(component.element as Node);
                document.body.appendChild(popup);

                if (props.clientRect) {
                  const rect = props.clientRect();
                  if (rect) {
                    popup.style.left = `${rect.left}px`;
                    popup.style.top = `${rect.bottom + 8}px`;
                  }
                }
              },
              onUpdate: (props: SuggestionProps) => {
                component?.updateProps(props);

                if (popup && props.clientRect) {
                  const rect = props.clientRect();
                  if (rect) {
                    popup.style.left = `${rect.left}px`;
                    popup.style.top = `${rect.bottom + 8}px`;
                  }
                }
              },
              onKeyDown: (props: { event: KeyboardEvent }) => {
                if (props.event.key === "Escape") {
                  popup?.remove();
                  component?.destroy();
                  return true;
                }
                // Let the CommandList handle arrow keys and enter
                return false;
              },
              onExit: () => {
                popup?.remove();
                component?.destroy();
              },
            };
          },
        } satisfies Partial<SuggestionOptions>,
      };
    },
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ];
    },
  });
}
