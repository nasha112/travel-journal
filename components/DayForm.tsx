"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type DayFormData = {
  id?: number;
  title: string | null;
  date: string | null;
  note: string | null;
};

/** 旅行日表单（新建 / 编辑共用） */
export default function DayForm({ tripId, day }: { tripId: number; day?: DayFormData }) {
  const router = useRouter();
  const isEdit = !!day?.id;

  const [form, setForm] = useState({
    title: day?.title ?? "",
    date: day?.date ? String(day.date).slice(0, 10) : "",
    note: day?.note ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = isEdit ? `/api/days/${day!.id}` : `/api/trips/${tripId}/days`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date || null,
          note: form.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      router.push(`/trips/${tripId}/days/${data.id}`);
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
        <h1 className="text-xl font-bold text-gray-800 mb-1">{isEdit ? "编辑旅行日" : "添加旅行日"}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {isEdit ? "修改这一天的行程安排" : "记录一天的行程安排，之后可以添加打卡地点"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当日行程标题</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="例如：抵达丽江，古城漫步"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">行程备注</label>
            <textarea
              className={`${inputCls} min-h-24 resize-y`}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="记录当天的安排、天气、感受..."
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
              {loading ? "保存中..." : isEdit ? "保存修改" : "保存旅行日"}
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
