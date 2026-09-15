"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, expenseCategoryLabel, formatDateTime, formatMoney } from "@/lib/utils";

export type ExpenseItem = {
  id: number;
  category: string;
  amount: { toString: () => string };
  note: string | null;
  date: Date | string | null;
  tripDayId: number | null;
  tripDay: { dayNumber: number; title: string | null } | null;
  locationId: number | null;
  location: { id: number; name: string } | null;
};

export type ExpenseDayOption = { id: number; dayNumber: number; title: string | null };
export type ExpenseLocationGroup = { dayId: number; dayNumber: number; list: { id: number; name: string }[] };

const CATEGORY_COLORS: Record<string, string> = {
  TRANSPORT: "#3b82f6",
  ACCOMMODATION: "#8b5cf6",
  FOOD: "#f59e0b",
  TICKET: "#10b981",
  SHOPPING: "#ec4899",
  OTHER: "#6b7280",
};

export default function ExpensePage({
  tripId,
  tripTitle,
  initialExpenses,
  days,
  locationsByDay = [],
}: {
  tripId: number;
  tripTitle: string;
  initialExpenses: ExpenseItem[];
  days: ExpenseDayOption[];
  locationsByDay?: ExpenseLocationGroup[];
}) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);

  const [form, setForm] = useState({
    category: "TRANSPORT",
    amount: "",
    date: "",
    tripDayId: "",
    locationId: "",
    note: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // 正在编辑的消费 id；null 表示添加模式
  const [editingId, setEditingId] = useState<number | null>(null);

  // 所选旅行日下的地点选项（联动）
  const locationOptions = useMemo(() => {
    const group = locationsByDay.find((g) => g.dayId === Number(form.tripDayId));
    return group?.list ?? [];
  }, [locationsByDay, form.tripDayId]);

  /** 把日期转换为 datetime-local 输入框所需格式（本地时间） */
  function toDatetimeLocal(d: Date | string | null | undefined): string {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    const p = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(
      date.getHours()
    )}:${p(date.getMinutes())}`;
  }

  /** 进入编辑模式：回填表单 */
  function startEdit(e: ExpenseItem) {
    setEditingId(e.id);
    setForm({
      category: e.category,
      amount: String(Number(e.amount)),
      date: toDatetimeLocal(e.date),
      tripDayId: e.tripDayId ? String(e.tripDayId) : "",
      locationId: e.locationId ? String(e.locationId) : "",
      note: e.note ?? "",
    });
    setError("");
  }

  /** 退出编辑模式，回到添加 */
  function cancelEdit() {
    setEditingId(null);
    setForm((f) => ({ ...f, amount: "", date: "", tripDayId: "", locationId: "", note: "" }));
    setError("");
  }

  // 汇总统计
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const byCategory = EXPENSE_CATEGORIES.map((c) => ({
      name: EXPENSE_CATEGORY_LABELS[c],
      value: expenses.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0),
    })).filter((c) => c.value > 0);
    return { total, count: expenses.length, byCategory };
  }, [expenses]);

  const maxCategory = useMemo(() => {
    if (stats.byCategory.length === 0) return null;
    return stats.byCategory.reduce((a, b) => (b.value > a.value ? b : a));
  }, [stats]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("请填写有效金额");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        amount,
        date: form.date || null,
        tripDayId: form.tripDayId ? Number(form.tripDayId) : null,
        locationId: form.locationId ? Number(form.locationId) : null,
        note: form.note,
      };

      if (editingId != null) {
        // 编辑：更新单笔
        const res = await fetch(`/api/expenses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "保存失败");
          return;
        }
        // 保留原有的旅行日 / 地点嵌套信息，仅更新字段
        setExpenses((prev) => prev.map((x) => (x.id === editingId ? { ...x, ...data } : x)));
        cancelEdit();
      } else {
        // 添加：新建一笔
        const res = await fetch(`/api/trips/${tripId}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "添加失败");
          return;
        }
        setExpenses((prev) => [...prev, data]);
        setForm((f) => ({ ...f, amount: "", date: "", tripDayId: "", locationId: "", note: "" }));
      }
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除这笔消费记录？")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      /* ignore */
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{tripTitle} · 消费统计</h1>
          <p className="text-sm text-gray-500 mt-0.5">记录每一笔旅行开销，自动按分类汇总</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-400 mb-1">💰 总消费</div>
          <div className="text-xl font-bold text-gray-800">{formatMoney(stats.total)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-400 mb-1">🧾 消费笔数</div>
          <div className="text-xl font-bold text-gray-800">{stats.count} 笔</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-400 mb-1">📊 最大开销</div>
          <div className="text-xl font-bold text-gray-800 truncate">
            {maxCategory ? `${maxCategory.name} · ${formatMoney(maxCategory.value)}` : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 图表 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-2">消费分类占比</h2>
          {stats.byCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              暂无消费数据
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name} ${formatMoney(Number(entry.value))}`}
                    fontSize={11}
                  >
                    {stats.byCategory.map((c) => (
                      <Cell key={c.name} fill={CATEGORY_COLORS[c.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 添加 / 编辑表单 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">
            {editingId != null ? "编辑消费" : "添加消费"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {EXPENSE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  金额（元） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={inputCls}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期时间</label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所属旅行日</label>
                <select
                  className={inputCls}
                  value={form.tripDayId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tripDayId: e.target.value, locationId: "" }))
                  }
                >
                  <option value="">不限</option>
                  {days.map((d) => (
                    <option key={d.id} value={d.id}>
                      Day {d.dayNumber}
                      {d.title ? ` · ${d.title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所属地点</label>
                <select
                  className={inputCls}
                  value={form.locationId}
                  onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                  disabled={!form.tripDayId}
                >
                  <option value="">{form.tripDayId ? "不限（仅选旅行日）" : "请先选择旅行日"}</option>
                  {locationOptions.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <input
                className={inputCls}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="例如：高铁票、民宿、晚餐..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                {saving ? "保存中..." : editingId != null ? "保存修改" : "添加消费"}
              </button>
              {editingId != null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2"
                >
                  取消
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 消费明细 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">
          消费明细
          <span className="text-sm font-normal text-gray-400 ml-2">共 {expenses.length} 笔</span>
        </div>
        {expenses.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">还没有消费记录</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {expenses.map((e) => (
              <li key={e.id} className="px-4 py-3 flex items-center gap-4">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: CATEGORY_COLORS[e.category] ?? "#6b7280" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">
                    {expenseCategoryLabel(e.category)}
                    {e.location && (
                      <span className="text-gray-400 font-normal"> · {e.location.name}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {e.note || "—"}
                    {e.tripDay ? ` · Day ${e.tripDay.dayNumber}` : ""}
                    {e.date ? ` · ${formatDateTime(e.date)}` : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatMoney(Number(e.amount))}
                </div>
                <button
                  onClick={() => startEdit(e)}
                  className="text-xs text-gray-500 hover:text-blue-600 shrink-0"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
