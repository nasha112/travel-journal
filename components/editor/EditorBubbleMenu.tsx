"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";

const item = (active: boolean) =>
  `px-2 py-1 text-xs rounded transition-colors ${
    active ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
  }`;

/** 选中文字后的浮动工具栏 */
export default function EditorBubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={120}
      shouldShow={({ state }) => {
        // 仅当有选中文本（且非空）时显示
        const { from, to, empty } = state.selection;
        return !empty && from !== to;
      }}
    >      <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-1">
        <button className={item(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </button>
        <button className={item(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </button>
        <button className={item(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </button>
        <span className="w-px h-4 bg-gray-200 mx-0.5" />
        <button className={item(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </button>
        <button className={item(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <span className="w-px h-4 bg-gray-200 mx-0.5" />
        <button className={item(editor.isActive("link"))} onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            const href = window.prompt("输入链接地址：", "https://");
            if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
          }
        }}>
          🔗
        </button>
        <button className={item(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </button>
      </div>
    </BubbleMenu>
  );
}
