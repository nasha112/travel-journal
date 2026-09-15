import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TripStatusBadge from "@/components/TripStatusBadge";
import TripMap from "@/components/ClientTripMap";
import type { MapPoint } from "@/components/TripMap";
import { expenseCategoryLabel, formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** 消费分类色板（与消费统计页一致） */
const CATEGORY_COLORS: Record<string, string> = {
  TRANSPORT: "#3b82f6",
  ACCOMMODATION: "#8b5cf6",
  FOOD: "#f59e0b",
  TICKET: "#10b981",
  SHOPPING: "#ec4899",
  OTHER: "#6b7280",
};

export default async function TripReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const trip = await prisma.trip.findFirst({
    where: { id: Number(id), userId: user.id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          locations: {
            include: { blogs: { include: { images: true } } },
          },
          expenses: { select: { amount: true } },
        },
      },
      expenses: {
        include: {
          tripDay: { select: { dayNumber: true } },
          location: { select: { name: true } },
        },
      },
    },
  });
  if (!trip) redirect("/trips");

  // ===== 汇总统计 =====
  const dayCount = trip.days.length;
  const locationCount = trip.days.reduce((s, d) => s + d.locations.length, 0);
  let blogCount = 0;
  let photoCount = 0;
  for (const d of trip.days) {
    for (const l of d.locations) {
      blogCount += l.blogs.length;
      for (const b of l.blogs) photoCount += b.images.length;
    }
  }
  const totalExpense = trip.expenses.reduce((s, e) => s + Number(e.amount), 0);

  // ===== 足迹地图：按天连线，全局顺序编号 =====
  const points: MapPoint[] = [];
  const lines: [number, number][][] = [];
  let order = 1;
  for (const day of trip.days) {
    const dayLine: [number, number][] = [];
    for (const loc of day.locations) {
      points.push({
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        city: loc.city,
        hasBlog: loc.blogs.length > 0,
        order,
      });
      dayLine.push([loc.lat, loc.lng]);
      order++;
    }
    if (dayLine.length >= 2) lines.push(dayLine);
  }

  // ===== 消费分类聚合 =====
  const catAgg = new Map<string, number>();
  for (const e of trip.expenses) {
    catAgg.set(e.category, (catAgg.get(e.category) ?? 0) + Number(e.amount));
  }
  const catData = [...catAgg.entries()]
    .map(([name, value]) => ({ name, value, pct: totalExpense ? (value / totalExpense) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  // ===== 照片墙 =====
  const photos: { url: string; title: string; loc: string; locationId: number }[] = [];
  for (const d of trip.days) {
    for (const l of d.locations) {
      for (const b of l.blogs) {
        for (const img of b.images) {
          photos.push({ url: img.url, title: b.title, loc: l.name, locationId: l.id });
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 返回链接 */}
      <Link
        href={`/trips/${trip.id}`}
        className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        ← 返回旅行详情
      </Link>

      {/* 英雄区 */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold">{trip.title}</h1>
          <TripStatusBadge status={trip.status} />
        </div>
        <p className="text-sm text-blue-100 mt-1.5">
          {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
          {trip.description && <span className="hidden sm:inline"> · {trip.description}</span>}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
            <div className="text-xs text-blue-100">旅行天数</div>
            <div className="text-xl font-bold mt-0.5">{dayCount} 天</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
            <div className="text-xs text-blue-100">打卡地点</div>
            <div className="text-xl font-bold mt-0.5">{locationCount} 个</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
            <div className="text-xs text-blue-100">游记</div>
            <div className="text-xl font-bold mt-0.5">{blogCount} 篇</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
            <div className="text-xs text-blue-100">照片</div>
            <div className="text-xl font-bold mt-0.5">{photoCount} 张</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur col-span-2 sm:col-span-1">
            <div className="text-xs text-blue-100">总消费</div>
            <div className="text-xl font-bold mt-0.5">{formatMoney(totalExpense)}</div>
          </div>
        </div>
      </div>

      {/* 足迹地图 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">🗺️ 旅行足迹</h2>
          <span className="text-xs text-gray-400">按游玩顺序编号，箭头表示行进方向</span>
        </div>
        <div className="h-[420px]">
          <TripMap points={points} lines={lines} height="100%" />
        </div>
      </div>

      {/* 每日回顾 */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-4">📅 每日回顾</h2>
        {trip.days.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-500 text-sm">这趟旅行还没有安排行程</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-blue-200" />
            {trip.days.map((day) => {
              const dayExpense = day.expenses.reduce((s, e) => s + Number(e.amount), 0);
              const dayPhotos = day.locations.reduce(
                (s, l) => s + l.blogs.reduce((s2, b) => s2 + b.images.length, 0),
                0
              );
              const dayBlogs = day.locations.reduce((s, l) => s + l.blogs.length, 0);
              return (
                <div
                  key={day.id}
                  className="relative bg-white rounded-xl border border-gray-200 p-4"
                >
                  <span className="absolute -left-[21px] top-5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow" />
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                        Day {day.dayNumber}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {day.title || `第 ${day.dayNumber} 天`}
                      </span>
                      {day.date && <span className="text-xs text-gray-400">{formatDate(day.date)}</span>}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-3 shrink-0">
                      <span>📷 {dayPhotos} 张</span>
                      <span>📝 {dayBlogs} 篇</span>
                      <span className="font-medium text-gray-700">💰 {formatMoney(dayExpense)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {day.locations.length === 0 ? (
                      <span className="text-xs text-gray-400">无打卡地点</span>
                    ) : (
                      day.locations.map((loc) => (
                        <span
                          key={loc.id}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-gray-600"
                        >
                          {loc.name}
                          {loc.blogs.length > 0 && (
                            <span className="text-blue-500 ml-1">📝{loc.blogs.length}</span>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                  {day.note && <p className="text-sm text-gray-500 mt-2">{day.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 消费分析 */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-4">📊 消费分析</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {catData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无消费记录</p>
          ) : (
            <div className="space-y-3">
              <div className="flex h-3 rounded-full overflow-hidden">
                {catData.map((c) => (
                  <div
                    key={c.name}
                    style={{ width: `${c.pct}%`, background: CATEGORY_COLORS[c.name] ?? "#6b7280" }}
                    title={expenseCategoryLabel(c.name)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {catData.map((c) => (
                  <span key={c.name} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ background: CATEGORY_COLORS[c.name] ?? "#6b7280" }}
                    />
                    {expenseCategoryLabel(c.name)} {formatMoney(c.value)}
                    <span className="text-gray-400">({c.pct.toFixed(1)}%)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 照片墙 */}
      {photos.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">📷 旅行照片墙（{photos.length} 张）</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <Link
                key={`${p.locationId}-${i}`}
                href={`/locations/${p.locationId}/blog`}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-xs text-white truncate">{p.title}</div>
                  <div className="text-[10px] text-white/70 truncate">{p.loc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
