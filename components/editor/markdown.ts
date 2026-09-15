import type { Editor } from "@tiptap/react";

/**
 * Markdown 转换辅助：
 * - 加载旧文章：Markdown → 编辑器（contentType: 'markdown'）
 * - 保存：编辑器 → Markdown（getMarkdown）
 * 持久化始终是 blogs.content 的 Markdown，编辑器只是编辑体验层。
 */

/** 编辑器实例 → Markdown（保存时调用） */
export function editorToMarkdown(editor: Editor | null): string {
  if (!editor) return "";
  return editor.getMarkdown();
}

/** 用 Markdown 内容替换编辑器文档（加载旧文章时调用） */
export function setMarkdown(editor: Editor | null, markdown: string): void {
  if (!editor) return;
  editor.commands.setContent(markdown || "", { contentType: "markdown" });
}

/** 从 Markdown 中提取全部图片 URL（保存时用于同步 blog_images 图集） */
export function extractImageUrls(markdown: string): string[] {
  const urls: string[] = [];
  for (const m of markdown.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)\s*\)/g)) {
    urls.push(m[1].trim());
  }
  return urls;
}
