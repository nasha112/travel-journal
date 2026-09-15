"use client";

import { useEditorState, type Editor } from "@tiptap/react";

const btnCls = (active: boolean) =>
  `px-2 py-1 text-xs rounded transition-colors whitespace-nowrap font-medium ${
    active
      ? "bg-blue-100 text-blue-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;
const sep = "w-px h-4 bg-gray-200 mx-0.5";

/** 顶部格式工具栏：给新手使用的显式按钮 */
export default function EditorToolbar({
  editor,
  onImageUpload,
}: {
  editor: Editor | null;
  onImageUpload?: () => void;
}) {
  const s = useEditorState({
    editor,
    selector: (ctx) => ({
      h1: ctx.editor?.isActive("heading", { level: 1 }) ?? false,
      h2: ctx.editor?.isActive("heading", { level: 2 }) ?? false,
      h3: ctx.editor?.isActive("heading", { level: 3 }) ?? false,
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      strike: ctx.editor?.isActive("strike") ?? false,
      bullet: ctx.editor?.isActive("bulletList") ?? false,
      ordered: ctx.editor?.isActive("orderedList") ?? false,
      quote: ctx.editor?.isActive("blockquote") ?? false,
      link: ctx.editor?.isActive("link") ?? false,
      code: ctx.editor?.isActive("codeBlock") ?? false,
    }),
  }) ?? {
    h1: false,
    h2: false,
    h3: false,
    bold: false,
    italic: false,
    strike: false,
    bullet: false,
    ordered: false,
    quote: false,
    link: false,
    code: false,
  };

  if (!editor) return null;

  function toggleLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const href = window.prompt("输入链接地址：", "https://");
    if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
      <button className={btnCls(s.h1)} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
      <button className={btnCls(s.h2)} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button className={btnCls(s.h3)} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
      <span className={sep} />
      <button className={btnCls(s.bold)} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
      <button className={btnCls(s.italic)} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
      <button className={btnCls(s.strike)} onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
      <span className={sep} />
      <button className={btnCls(s.bullet)} onClick={() => editor.chain().focus().toggleBulletList().run()}>• 列表</button>
      <button className={btnCls(s.ordered)} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. 列表</button>
      <button className={btnCls(s.quote)} onClick={() => editor.chain().focus().toggleBlockquote().run()}>引用</button>
      <span className={sep} />
      <button className={btnCls(s.link)} onClick={toggleLink}>🔗 链接</button>
      <button className={btnCls(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>分割线</button>
      <button className={btnCls(s.code)} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>代码块</button>
      {onImageUpload && (
        <button
          className={btnCls(false)}
          onClick={() => {
            editor.chain().focus().run();
            onImageUpload();
          }}
        >
          🖼 图片
        </button>
      )}
      <span className="ml-auto hidden sm:inline text-[10px] text-gray-400">
        输入 / 打开插入菜单 · 选中文字出现浮动工具栏
      </span>
    </div>
  );
}
