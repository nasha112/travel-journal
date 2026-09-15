"use client";

import ReactMarkdown from "react-markdown";

/** Markdown 游记正文渲染 */
export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="markdown-content text-gray-700 leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
