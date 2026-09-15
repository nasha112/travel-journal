"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { editorExtensions } from "./editor-extensions";
import EditorToolbar from "./EditorToolbar";
import EditorBubbleMenu from "./EditorBubbleMenu";
import EditorSlashMenu, { type SlashItem } from "./EditorSlashMenu";

export type TravelEditorHandle = {
  /** 把已有图片 URL 插入正文当前光标处（图集 → 正文） */
  insertImage: (url: string) => void;
};

export type TravelEditorProps = {
  /** 初始 Markdown 内容（旧游记直接加载） */
  initialContent: string;
  /** 编辑内容变化时回调（返回 Markdown） */
  onChange?: (markdown: string) => void;
  /** 编辑器内上传图片成功后的回调（用于同步图集） */
  onImageUploaded?: (url: string) => void;
};

/**
 * TravelEditor：游记正文编辑器（所见即所得）
 * - Markdown 负责持久化（blogs.content），Tiptap 只负责编辑体验
 * - Toolbar + Bubble Menu + Slash Menu + Image Node
 * - Slash 键盘导航走 ProseMirror 官方 handleKeyDown 钩子（可靠）
 */
const TravelEditor = forwardRef<TravelEditorHandle, TravelEditorProps>(function TravelEditor(
  { initialContent, onChange, onImageUploaded },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [slash, setSlash] = useState<{ x: number; y: number; index: number } | null>(null);

  // ref 同步最新值，供 handleKeyDown / checkSlash 闭包读取（避免 stale closure）
  const editorRef = useRef<Editor | null>(null);
  const slashRef = useRef(slash);
  slashRef.current = slash;

  const runSlash = useCallback((index: number) => {
    const ed = editorRef.current;
    if (!ed) return;
    const { from } = ed.state.selection;
    ed.chain().focus().deleteRange({ from: from - 1, to: from }).run();
    setSlash(null);
    runItemRef.current[index]?.action();
  }, []);

  // Slash 菜单项（组件内重建；runSlash 通过 runItemRef 取最新）
  const slashItems: SlashItem[] = [
    { label: "一级标题", hint: "H1", action: () => editorRef.current?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "二级标题", hint: "H2", action: () => editorRef.current?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "三级标题", hint: "H3", action: () => editorRef.current?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "图片", hint: "🖼", action: () => openImagePicker() },
    { label: "无序列表", hint: "•", action: () => editorRef.current?.chain().focus().toggleBulletList().run() },
    { label: "有序列表", hint: "1.", action: () => editorRef.current?.chain().focus().toggleOrderedList().run() },
    { label: "引用", hint: ">", action: () => editorRef.current?.chain().focus().toggleBlockquote().run() },
    {
      label: "链接",
      hint: "🔗",
      action: () => {
        const ed = editorRef.current;
        if (!ed) return;
        const href = window.prompt("输入链接地址：", "https://");
        if (href) ed.chain().focus().setLink({ href }).run();
      },
    },
    { label: "分割线", hint: "—", action: () => editorRef.current?.chain().focus().setHorizontalRule().run() },
    { label: "代码块", hint: "```", action: () => editorRef.current?.chain().focus().toggleCodeBlock().run() },
  ];
  const runItemRef = useRef(slashItems);
  runItemRef.current = slashItems;

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getMarkdown());
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        const s = slashRef.current;
        if (!s) return false;
        const count = slashItems.length;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlash((cur) => (cur ? { ...cur, index: (cur.index + 1) % count } : cur));
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlash((cur) =>
            cur ? { ...cur, index: (cur.index - 1 + count) % count } : cur
          );
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          runSlash(s.index);
          return true;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setSlash(null);
          return true;
        }
        return false;
      },
    },
  });
  editorRef.current = editor;

  useImperativeHandle(ref, () => ({
    insertImage(url) {
      if (!editor) return;
      editor.chain().focus().setImage({ src: url, alt: "旅行图片" }).run();
    },
  }));

  // ---- Slash 菜单：检测段落以 "/" 开头 ----
  const checkSlash = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const { from } = ed.state.selection;
    const $pos = ed.state.doc.resolve(from);
    const textBefore = $pos.parent.textBetween(0, $pos.parentOffset, undefined, "\n");
    if (textBefore === "/") {
      const coords = ed.view.coordsAtPos(from);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setSlash({ x: coords.left - rect.left, y: coords.top - rect.top + 26, index: 0 });
      }
    } else if (slashRef.current) {
      setSlash(null);
    }
  }, []);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const onUpdate = () => checkSlash();
    ed.on("update", onUpdate);
    ed.on("selectionUpdate", onUpdate);
    return () => {
      ed.off("update", onUpdate);
      ed.off("selectionUpdate", onUpdate);
    };
  }, [editor, checkSlash]);

  // ---- 图片上传（复用现有 /api/upload）----
  function openImagePicker() {
    fileRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const ed = editorRef.current;
    if (!ed) return;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          ed.chain().focus().setImage({ src: data.url, alt: "旅行图片" }).run();
          onImageUploaded?.(data.url);
        }
      } catch {
        /* 上传失败静默，可后续提示 */
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div
      ref={containerRef}
      className="relative border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
    >
      <EditorToolbar editor={editor} onImageUpload={openImagePicker} />
      <EditorBubbleMenu editor={editor} />
      {slash && (
        <EditorSlashMenu
          x={slash.x}
          y={slash.y}
          items={slashItems}
          activeIndex={slash.index}
          onHover={(i) => setSlash((s) => (s ? { ...s, index: i } : s))}
          onSelect={(i) => runSlash(i)}
          onClose={() => setSlash(null)}
        />
      )}
      <div className="px-4 py-3 min-h-[320px] prose-editor">
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
});

export default TravelEditor;
