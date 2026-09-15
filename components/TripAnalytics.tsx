"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { expenseCategoryLabel, locationTypeLabel, formatMoney } from "@/lib/utils";

/** 消费分类色板（与消费统计页一致） */
const CATEGORY_COLORS: Record<string, string> = {
  TRANSPORT: "#3b82f6",
  ACCOMMODATION: "#8b5cf6",
  FOOD: "#f59e0b",
  TICKET: "#10b981",
  SHOPPING: "#ec4899",
  OTHER: "#6b7280",
};

const TYPE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#6b7280",
];

export type TripAnalyticsData = {
  tripDays: number;
  locationCount: number;
  blogCount: number;
  totalExpense: number;
  avgDaily: number;
  categoryData: { name: string; value: number }[];
  dailyExpense: { day: number; total: number }[];
  locationTypeData: { name: string; count: number }[];
  blogByDay: { day: number; count: number }[];
  topDay: { day: number; total: number } | null;
  topLocation: { name: string; total: number } | null;
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-xl font-bold text-gray-800 mt-1 truncate">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/** 图表卡片容器 */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-sm font-medium text-gray-700 mb-3">{title}</div>
      {children}
    </div>
  );
}

export default function TripAnalytics({ data }: { data: TripAnalyticsData }) {
  const categoryTotal = data.categoryData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-4">
      {/* 核心指标 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="旅行天数" value={`${data.tripDays} 天`} />
        <MetricCard label="打卡地点" value={`${data.locationCount} 个`} />
        <MetricCard label="游记数量" value={`${data.blogCount} 篇`} />
        <MetricCard label="总消费" value={formatMoney(data.totalExpense)} />
        <MetricCard label="日均消费" value={formatMoney(data.avgDaily)} />
        <MetricCard label="单次均消" value={formatMoney(data.totalExpense)} />
      </div>

      {/* 展示指标：消费最高日 / 最高地点 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
          <div className="text-xs text-blue-100">消费最高的一天</div>
          <div className="text-2xl font-bold mt-1">
            {data.topDay ? `Day ${data.topDay.day}` : "—"}
          </div>
          <div className="text-sm text-blue-100 mt-0.5">{formatMoney(data.topDay?.total ?? 0)}</div>
        </div>
        <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-xs text-violet-100">消费最高的地点</div>
          <div className="text-2xl font-bold mt-1 truncate">{data.topLocation?.name ?? "—"}</div>
          <div className="text-sm text-violet-100 mt-0.5">
            {formatMoney(data.topLocation?.total ?? 0)}
          </div>
        </div>
      </div>

      {/* 消费分类饼图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="消费分类占比">
          {categoryTotal === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              暂无消费数据
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.categoryData.map((c) => (
                      <Cell key={c.name} fill={CATEGORY_COLORS[c.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      formatMoney(Number(value)),
                      expenseCategoryLabel(String(name)),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {data.categoryData.map((c) => (
                  <span key={c.name} className="text-xs text-gray-500 flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ background: CATEGORY_COLORS[c.name] ?? "#6b7280" }}
                    />
                    {expenseCategoryLabel(c.name)} {formatMoney(c.value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* 每日消费柱状图 */}
        <ChartCard title="每日消费">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyExpense} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d: number) => `Day ${d}`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatMoney(Number(value)), "消费"]}
                  labelFormatter={(d) => `Day ${d}`}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 地点类型柱状图 */}
        <ChartCard title="地点类型分布">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.locationTypeData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickFormatter={(n: string) => locationTypeLabel(n)}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} 个`, "数量"]}
                  labelFormatter={(n) => locationTypeLabel(String(n))}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {data.locationTypeData.map((t, i) => (
                    <Cell key={t.name} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 游记分布柱状图 */}
        <ChartCard title="每日游记分布">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.blogByDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d: number) => `Day ${d}`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} 篇`, "游记"]}
                  labelFormatter={(d) => `Day ${d}`}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
