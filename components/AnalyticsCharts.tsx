"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface YearStat {
  year: number;
  trips: number;
  days: number;
  expense: number;
}
export interface NameCount {
  country?: string;
  city?: string;
  count: number;
}
export interface CategoryStat {
  category: string;
  value: number;
}
export interface MonthStat {
  month: string;
  total: number;
}

interface Props {
  totalTrips: number;
  totalDays: number;
  totalLocations: number;
  totalBlogs: number;
  totalExpense: number;
  avgPerDay: number;
  avgPerTrip: number;
  yearData: YearStat[];
  countryData: NameCount[];
  cityData: NameCount[];
  categoryData: CategoryStat[];
  monthData: MonthStat[];
}

const CATEGORY_COLORS = [
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#f59e0b",
  "#fbbf24",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
];

const money = (v: number | string) =>
  `¥${Number(v).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;

const cardCls = "bg-white rounded-xl border border-gray-200 p-4";
const titleCls = "font-semibold text-gray-800";

export default function AnalyticsCharts({
  totalTrips,
  totalDays,
  totalLocations,
  totalBlogs,
  totalExpense,
  avgPerDay,
  avgPerTrip,
  yearData,
  countryData,
  cityData,
  categoryData,
  monthData,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">数据分析中心</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          从旅行、地点、消费三个维度汇总你的全部足迹
        </p>
      </div>

      {/* 汇总统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "总旅行次数", value: `${totalTrips} 次`, icon: "✈️" },
          { label: "总旅行天数", value: `${totalDays} 天`, icon: "📅" },
          { label: "总地点数量", value: `${totalLocations} 个`, icon: "📍" },
          { label: "总游记数量", value: `${totalBlogs} 篇`, icon: "📝" },
          { label: "累计消费", value: money(totalExpense), icon: "💰" },
        ].map((s) => (
          <div key={s.label} className={cardCls}>
            <div className="text-xs text-gray-400 mb-1">
              {s.icon} {s.label}
            </div>
            <div className="text-xl font-bold text-gray-800">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 年度统计 + 消费分类 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h2 className={`${titleCls} mb-4`}>年度旅行统计</h2>
          {yearData.length === 0 ? (
            <p className="text-sm text-gray-400">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="trips" name="旅行次数" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="days" name="旅行天数" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={cardCls}>
          <h2 className={`${titleCls} mb-4`}>消费分类占比</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry: { category?: string; percent?: number }) =>
                    `${entry.category ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((c, i) => (
                    <Cell key={c.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => money(v as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 国家 + 城市 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h2 className={`${titleCls} mb-4`}>国家/地区分布（按打卡地点）</h2>
          {countryData.length === 0 ? (
            <p className="text-sm text-gray-400">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="country" width={60} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="地点数" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={cardCls}>
          <h2 className={`${titleCls} mb-4`}>城市 TOP10（按打卡地点）</h2>
          {cityData.length === 0 ? (
            <p className="text-sm text-gray-400">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="city" width={60} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="地点数" fill="#60a5fa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 月度消费趋势 + 均值指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h2 className={`${titleCls} mb-4`}>月度消费趋势</h2>
          {monthData.length === 0 ? (
            <p className="text-sm text-gray-400">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: unknown) => money(v as number)} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="消费金额"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2563eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-rows-2 gap-4">
          <div className={`${cardCls} flex items-center justify-between`}>
            <div>
              <div className="text-xs text-gray-400 mb-1">🏦 平均每天消费</div>
              <div className="text-2xl font-bold text-gray-800">{money(avgPerDay)}</div>
            </div>
            <div className="text-right text-xs text-gray-400 leading-5">
              总消费 ÷ 旅行天数
              <br />
              <span className="text-gray-300">消费效率指标</span>
            </div>
          </div>
          <div className={`${cardCls} flex items-center justify-between`}>
            <div>
              <div className="text-xs text-gray-400 mb-1">🎒 单次旅行平均消费</div>
              <div className="text-2xl font-bold text-gray-800">{money(avgPerTrip)}</div>
            </div>
            <div className="text-right text-xs text-gray-400 leading-5">
              总消费 ÷ 旅行次数
              <br />
              <span className="text-gray-300">单趟预算参考</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
