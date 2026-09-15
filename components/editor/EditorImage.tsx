"use client";

import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

/**
 * 图片节点视图：
 * 正文内直接渲染图片（所见即所得），hover 显示删除按钮。
 * 选中状态下可拖动调整宽度。
 */
export default function ImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const [width, setWidth] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);

  return (
    <NodeViewWrapper
      className="relative my-3 group"
      data-drag-handle
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        title={node.attrs.title ?? ""}
        style={{ width: width ? `${width}px` : "100%" }}
        className={`rounded-xl border max-h-[480px] w-full object-contain bg-gray-50 ${
          selected ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
        }`}
      />
      {showTip && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <input
            type="number"
            min={80}
            max={1200}
            value={width ?? ""}
            placeholder="宽度"
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              setWidth(v);
              updateAttributes({ width: v ?? undefined });
            }}
            className="w-20 px-2 py-1 text-xs rounded-md border border-gray-300 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => deleteNode()}
            className="px-2.5 py-1 text-xs rounded-md bg-red-600 text-white shadow hover:bg-red-700 transition-colors"
          >
            删除
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
