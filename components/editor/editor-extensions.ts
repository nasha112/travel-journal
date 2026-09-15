/**
 * Tiptap 编辑器统一扩展配置。
 * 原则：所有编辑器实例使用同一套 extensions，
 * 解析/序列化 Markdown 时缺扩展会导致内容丢失。
 */
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageNodeView from "./EditorImage";

// v3 的 StarterKit 已内置 Link，为避免重复显式关闭后单独配置
const TravelImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

export const editorExtensions = [
  StarterKit.configure({
    link: false,
    heading: { levels: [1, 2, 3] },
  }),
  Markdown,
  TravelImage,
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: { class: "text-blue-600 underline" },
  }),
];
