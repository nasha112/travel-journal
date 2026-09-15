"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TripFormData = {
  id?: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  cover: string | null;
};

export default function TripForm({ trip }: { trip?: TripFormData }) {
  const router = useRouter();
  const isEdit = !!trip?.id;

  const [form, setForm] = useState({
    title: trip?.title ?? "",
    description: trip?.description ?? "",
    startDate: trip?.startDate ? trip.startDate.slice(0, 10) : "",
    endDate: trip?.endDate ? trip.endDate.slice(0, 10) : "",
    cover: trip?.cover ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("请填写旅行名称");
      return;
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setError("开始日期不能晚于结束日期");
      return;
    }
    setLoading(true);
    try {
      const url = isEdit ? `/api/trips/${trip!.id}` : "/api/trips";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          cover: form.cover || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      router.push(`/trips/${data.id}`);
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-1">{isEdit ? "编辑旅行" : "新建旅行"}</h1>
        <p className="text-sm text-gray-500 mb-6">填写基本信息，之后可以随时补充行程和地点</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              旅行名称 <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="例如：2024 年云南七日游"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">旅行简介</label>
            <textarea
              className={`${inputCls} min-h-20 resize-y`}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="简单描述这趟旅行..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                className={inputCls}
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图片地址（可选）</label>
            <input
              className={inputCls}
              value={form.cover}
              onChange={(e) => update("cover", e.target.value)}
              placeholder="https://... 或 /uploads/xxx.jpg"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? "保存中..." : isEdit ? "保存修改" : "创建旅行"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
