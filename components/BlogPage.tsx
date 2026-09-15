"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import MarkdownView from "@/components/MarkdownView";
import MarkdownEditor, { type MarkdownEditorHandle } from "@/components/MarkdownEditor";
import { locationTypeLabel } from "@/lib/utils";

export type BlogLocationData = {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
  type: string | null;
};

export type BlogItemData = {
  id: number;
  title: string;
  content: string;
  createdAt: Date | string;
  images: { url: string }[];
};

export type BlogInitialData = {
  location: BlogLocationData;
  tripTitle: string;
  tripId: number;
  dayNumber: number;
  blogs: BlogItemData[];
};

export default function BlogPage({ data }: { data: BlogInitialData }) {
  const router = useRouter();
  const { location, tripTitle, tripId, dayNumber } = data;

  // 游记列表（本地维护，操作后同步更新）
  const [blogs, setBlogs] = useState<BlogItemData[]>(data.blogs);
  // 模式：list 列表 / read 阅读 / edit 编辑（新建或修改）
  const [mode, setMode] = useState<"list" | "read" | "edit">("list");
  const [activeId, setActiveId] = useState<number | null>(null);
  // 编辑表单状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const activeBlog = blogs.find((b) => b.id === activeId) ?? null;
  const editorRef = useRef<MarkdownEditorHandle>(null);

  /** 进入编辑模式：新建或编辑某篇 */
  function startEdit(blog: BlogItemData | null) {
    setActiveId(blog?.id ?? null);
    setTitle(blog?.title ?? "");
    setContent(blog?.content ?? "");
    setImages(blog?.images.map((i) => i.url) ?? []);
    setError("");
    setMode("edit");
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) {
      setError("请填写游记标题");
      return;
    }
    setSaving(true);
    try {
      const isEdit = activeId != null;
      const url = isEdit ? `/api/blogs/${activeId}` : `/api/locations/${location.id}/blog`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, images }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "保存失败");
        return;
      }

      if (isEdit) {
        setBlogs((prev) => prev.map((b) => (b.id === result.id ? result : b)));
      } else {
        setBlogs((prev) => [result, ...prev]);
      }
      setMode("list");
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除这篇游记？删除后不可恢复。")) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        setMode("list");
        router.refresh();
      } else {
        alert("删除失败，请稍后重试");
      }
    } catch {
      /* ignore */
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* 面包屑 */}
      <div className="text-sm text-gray-400">
        <span>{tripTitle}</span>
        <span className="mx-1.5">/</span>
        <span>Day {dayNumber}</span>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600">{location.name}</span>
      </div>

      {/* 地点信息卡 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-40">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">{location.name}</h1>
            {location.type && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {locationTypeLabel(location.type)}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {[location.country, location.city].filter(Boolean).join(" · ") || "未填城市"}
          </div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </div>
        </div>
        <a
          href={`/trips/${tripId}/map`}
          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          🗺️ 在地图中查看
        </a>
      </div>

      {/* 游记列表 */}
      {mode === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              游记
              <span className="text-sm font-normal text-gray-400 ml-2">共 {blogs.length} 篇</span>
            </h2>
            <button
              onClick={() => startEdit(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors"
            >
              + 写游记
            </button>
          </div>

          {blogs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-400 text-sm mb-3">这个地点还没有游记</p>
              <button
                onClick={() => startEdit(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                写下第一篇 →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {blogs.map((blog) => (
                <li key={blog.id} className="px-5 py-4 flex items-start gap-4">
                  {blog.images.length > 0 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blog.images[0].url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => {
                        setActiveId(blog.id);
                        setMode("read");
                      }}
                      className="text-left font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {blog.title}
                    </button>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(blog.createdAt).toLocaleDateString("zh-CN")}
                      {blog.images.length > 0 && ` · ${blog.images.length} 张图片`}
                      {blog.content && ` · ${Math.max(1, Math.round(blog.content.length / 100))} 分钟阅读`}
                    </div>
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                      {blog.content
                        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
                        .replace(/[#>*`_\-\[\]()!]/g, "")
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 80) || "（暂无正文）"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveId(blog.id);
                        setMode("read");
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      阅读
                    </button>
                    <button
                      onClick={() => startEdit(blog)}
                      className="text-xs text-gray-500 hover:text-blue-600"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 阅读模式 */}
      {mode === "read" && activeBlog && (() => {
        // 已通过 Markdown 嵌入正文的图片不再重复展示在图集
        const embedded = new Set(
          [...activeBlog.content.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)\s*\)/g)].map((m) => m[1].trim())
        );
        const galleryImages = activeBlog.images.filter((img) => !embedded.has(img.url));
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{activeBlog.title}</h2>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(activeBlog.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => startEdit(activeBlog)}
                className="text-xs text-gray-500 hover:text-blue-600 border border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                编辑游记
              </button>
              <button
                onClick={() => setMode("list")}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ← 返回列表
              </button>
            </div>
          </div>

          {galleryImages.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {galleryImages.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.url}
                  alt={`游记图片 ${i + 1}`}
                  className="w-44 h-44 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          )}

          <div className="mt-5">
            <MarkdownView content={activeBlog.content} />
          </div>
        </div>
        );
      })()}

      {/* 编辑模式（新建 / 修改） */}
      {mode === "edit" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">{activeId == null ? "写游记" : "编辑游记"}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              游记标题 <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给这段旅程起个标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">游记正文（支持 Markdown，右侧实时预览）</label>
            <MarkdownEditor
              ref={editorRef}
              value={content}
              onChange={setContent}
              placeholder={"# 写下你的旅行故事\n\n用上方工具栏一键插入标题、加粗、列表等格式..."}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">游记图片</label>
            <ImageUploader
              images={images}
              onChange={setImages}
              onInsert={(url) => editorRef.current?.insertImage(url)}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              上传后把鼠标移到图片上点「插入正文」，图片会插入到编辑区光标处，并在右侧预览直接显示
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {saving ? "保存中..." : activeId == null ? "发布游记" : "保存修改"}
            </button>
            <button
              onClick={() => {
                setMode(activeId != null ? "read" : "list");
                setError("");
              }}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
