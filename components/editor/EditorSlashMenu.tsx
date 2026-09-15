"use client";

export type SlashItem = {
  label: string;
  hint: string;
  action: () => void;
};

/** 输入 / 后弹出的插入菜单（固定选项，支持 ↑↓ Enter Esc） */
export default function EditorSlashMenu({
  x,
  y,
  items,
  activeIndex,
  onHover,
  onSelect,
  onClose,
}: {
  x: number;
  y: number;
  items: SlashItem[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        style={{ left: x, top: y }}
        className="absolute z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5"
      >
        <div className="px-3 py-1 text-[10px] text-gray-400 font-medium uppercase">插入内容</div>
        {items.map((it, i) => (
          <button
            key={it.label}
            type="button"
            onMouseEnter={() => onHover(i)}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-sm text-left transition-colors ${
              i === activeIndex ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>{it.label}</span>
            <span className={`text-xs ${i === activeIndex ? "text-blue-400" : "text-gray-400"}`}>
              {it.hint}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
