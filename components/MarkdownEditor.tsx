"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import MarkdownView from "@/components/MarkdownView";

export type MarkdownEditorHandle = {
  /** 在光标处插入 Markdown 图片语法（供外部图片上传组件调用） */
  insertImage: (url: string) => void;
  focus: () => void;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

const btnCls =
  "px-2 py-1 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors whitespace-nowrap font-medium";
const sepCls = "w-px h-4 bg-gray-200 mx-0.5";

/**
 * 分屏 Markdown 编辑器：
 * - 顶部格式工具栏（对新手友好，无需记忆语法）
 * - 左侧源码编辑，右侧实时预览（图片直接渲染）
 */
const MarkdownEditor = forwardRef<MarkdownEditorHandle, Props>(function MarkdownEditor(
  { value, onChange, placeholder },
  ref
) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    insertImage(url) {
      insertAtCursor(`![图片]( ${url} )`, { block: true });
    },
    focus() {
      taRef.current?.focus();
    },
  }));

  /** 在光标处插入文本；block=true 时确保前后换行 */
  function insertAtCursor(text: string, opts: { block?: boolean } = {}) {
    const ta = taRef.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    let prefix = "";
    let suffix = "";
    if (opts.block) {
      if (before !== "" && !before.endsWith("\n")) prefix = "\n\n";
      if (after !== "" && !after.startsWith("\n")) suffix = "\n\n";
    }
    const next = before + prefix + text + suffix + after;
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  /** 包裹选中文本（如 **加粗**）；无选中时插入占位符 */
  function wrapSelection(before: string, after: string, placeholder: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const s = start + before.length;
      ta.setSelectionRange(s, s + selected.length);
    });
  }

  /** 在当前行首加前缀（标题 / 引用 / 列表） */
  function prefixLine(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const tools: { label: string; title: string; action: () => void }[][] = [
    [
      { label: "H1", title: "一级标题", action: () => prefixLine("# ") },
      { label: "H2", title: "二级标题", action: () => prefixLine("## ") },
      { label: "H3", title: "三级标题", action: () => prefixLine("### ") },
    ],
    [
      { label: "B", title: "加粗", action: () => wrapSelection("**", "**", "加粗文字") },
      { label: "I", title: "斜体", action: () => wrapSelection("*", "*", "斜体文字") },
      { label: "引用", title: "引用块", action: () => prefixLine("> ") },
    ],
    [
      { label: "• 列表", title: "无序列表", action: () => prefixLine("- ") },
      { label: "1. 列表", title: "有序列表", action: () => prefixLine("1. ") },
      { label: "链接", title: "插入链接", action: () => wrapSelection("[", "](https://)", "链接文字") },
    ],
    [
      { label: "分割线", title: "分割线", action: () => insertAtCursor("---", { block: true }) },
      { label: "代码块", title: "代码块", action: () => insertAtCursor("```\n代码\n```", { block: true }) },
    ],
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {tools.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {group.map((t) => (
              <button
                key={t.label}
                type="button"
                title={t.title}
                onClick={t.action}
                className={btnCls}
              >
                {t.label}
              </button>
            ))}
            {gi < tools.length - 1 && <span className={sepCls} />}
          </div>
        ))}
        <span className="ml-auto text-[10px] text-gray-400 hidden sm:inline">
          选中文字后点按钮可包裹格式
        </span>
      </div>

      {/* 分屏：左编辑 / 右预览 */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[320px] p-3 text-sm font-mono resize-y focus:outline-none bg-white border-r border-gray-200"
        />
        <div className="min-h-[320px] p-3 bg-gray-50/50 overflow-auto max-h-[600px]">
          {value.trim() ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-xs text-gray-400">预览区：输入内容后这里会实时显示效果，图片直接渲染</p>
          )}
        </div>
      </div>
    </div>
  );
});

export default MarkdownEditor;
