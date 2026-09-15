"use client";

import { useRef, useState } from "react";

/** 游记图片上传组件（多图），受控维护图片 URL 数组；onInsert 用于把图片嵌入正文 */
export default function ImageUploader({
  images,
  onChange,
  onInsert,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  onInsert?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "上传失败");
          continue;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
      }
    } catch {
      setError("上传出错，请稍后重试");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    onChange(images.filter((u) => u !== url));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`游记图片 ${i + 1}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200" />
            {onInsert && (
              <button
                type="button"
                onClick={() => onInsert(url)}
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
              >
                ⤵ 插入正文
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <span className="text-lg">⏳</span>
              <span className="text-xs">上传中...</span>
            </>
          ) : (
            <>
              <span className="text-lg">📷</span>
              <span className="text-xs">添加图片</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      <p className="text-xs text-gray-400 mt-1.5">支持 jpg/png/gif/webp，单张不超过 5MB</p>
    </div>
  );
}
