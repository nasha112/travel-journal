import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TripActions from "@/components/TripActions";
import DeleteDayButton from "@/components/DeleteDayButton";
import TripStatusBadge from "@/components/TripStatusBadge";
import TripAnalytics, { type TripAnalyticsData } from "@/components/TripAnalytics";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
            include: { blogs: { select: { id: true } } },
          },
          _count: { select: { expenses: true } },
        },
      },
      expenses: {
        select: { amount: true, category: true, tripDayId: true, locationId: true },
      },
    },
  });
  if (!trip) redirect("/trips");

  const locationCount = trip.days.reduce((s, d) => s + d.locations.length, 0);
  const totalExpense = trip.expenses.reduce((s, e) => s + Number(e.amount), 0);

  // ===== 单次旅行分析：基于已有 7 张表聚合，不新增表 =====
  const dayNumberById = new Map<number, number>();
  const locationNameById = new Map<number, string>();
  for (const d of trip.days) {
    dayNumberById.set(d.id, d.dayNumber);
    for (const l of d.locations) locationNameById.set(l.id, l.name);
  }

  const categoryAgg = new Map<string, number>();
  const dayExpenseAgg = new Map<number, number>();
  const locExpenseAgg = new Map<number, number>();
  for (const e of trip.expenses) {
    const amount = Number(e.amount);
    categoryAgg.set(e.category, (categoryAgg.get(e.category) ?? 0) + amount);
    if (e.tripDayId) dayExpenseAgg.set(e.tripDayId, (dayExpenseAgg.get(e.tripDayId) ?? 0) + amount);
    if (e.locationId) locExpenseAgg.set(e.locationId, (locExpenseAgg.get(e.locationId) ?? 0) + amount);
  }

  const typeAgg = new Map<string, number>();
  const blogByDayAgg = new Map<number, number>();
  let blogCount = 0;
  for (const d of trip.days) {
    for (const l of d.locations) {
      typeAgg.set(l.type ?? "OTHER", (typeAgg.get(l.type ?? "OTHER") ?? 0) + 1);
      if (l.blogs.length > 0) {
        blogCount += l.blogs.length;
        blogByDayAgg.set(d.dayNumber, (blogByDayAgg.get(d.dayNumber) ?? 0) + l.blogs.length);
      }
    }
  }

  let topDay: { day: number; total: number } | null = null;
  for (const [dayId, total] of dayExpenseAgg) {
    const dayNo = dayNumberById.get(dayId);
    if (dayNo == null) continue;
    if (!topDay || total > topDay.total) topDay = { day: dayNo, total };
  }

  let topLocation: { name: string; total: number } | null = null;
  for (const [locId, total] of locExpenseAgg) {
    const name = locationNameById.get(locId);
    if (!name) continue;
    if (!topLocation || total > topLocation.total) topLocation = { name, total };
  }

  const analytics: TripAnalyticsData = {
    tripDays: trip.days.length,
    locationCount,
    blogCount,
    totalExpense,
    avgDaily: trip.days.length > 0 ? totalExpense / trip.days.length : 0,
    categoryData: [...categoryAgg.entries()].map(([name, value]) => ({ name, value })),
    dailyExpense: trip.days.map((d) => ({
      day: d.dayNumber,
      total: dayExpenseAgg.get(d.id) ?? 0,
    })),
    locationTypeData: [...typeAgg.entries()].map(([name, count]) => ({ name, count })),
    blogByDay: trip.days.map((d) => ({
      day: d.dayNumber,
      count: blogByDayAgg.get(d.dayNumber) ?? 0,
    })),
    topDay,
    topLocation,
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{trip.title}</h1>
              <TripStatusBadge status={trip.status} />
              <Link
                href={`/trips/${trip.id}/map`}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
              >
                🗺️ 查看地图
              </Link>
              <Link
                href={`/trips/${trip.id}/expenses`}
                className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
              >
                💰 消费统计
              </Link>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              📅 {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
              <span className="mx-2 text-gray-300">|</span>
              📍 {locationCount} 个地点
              <span className="mx-2 text-gray-300">|</span>
              💰 {formatMoney(totalExpense)}
            </div>
            {trip.description && (
              <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{trip.description}</p>
            )}
          </div>
          <TripActions tripId={trip.id} />
        </div>
      </div>

      {/* 旅行数据分析 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">旅行数据分析</h2>
          <Link
            href={`/trips/${trip.id}/review`}
            className="text-sm text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            📖 打开旅行回顾 →
          </Link>
        </div>
        <TripAnalytics data={analytics} />
      </div>

      {/* 时间轴 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">行程时间轴</h2>
          <Link
            href={`/trips/${trip.id}/days/new`}
            className="text-sm text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            + 添加旅行日
          </Link>
        </div>

        {trip.days.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <div className="text-4xl mb-2">🗓️</div>
            <p className="text-gray-500 text-sm mb-3">还没有行程安排</p>
            <Link href={`/trips/${trip.id}/days/new`} className="text-sm text-blue-600 hover:underline">
              添加第一天行程 →
            </Link>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4">
            {/* 时间轴竖线 */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-blue-200" />
            {trip.days.map((day) => (
              <div
                key={day.id}
                className="relative block bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all p-4 group"
              >
                {/* 时间轴节点 */}
                <span className="absolute -left-[21px] top-5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/trips/${trip.id}/days/${day.id}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shrink-0">
                      Day {day.dayNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {day.title || `第 ${day.dayNumber} 天`}
                      </div>
                      {day.date && (
                        <div className="text-xs text-gray-400">{formatDate(day.date)}</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>📍 {day.locations.length} 个地点</span>
                      {day._count.expenses > 0 && <span>💰 {day._count.expenses} 笔</span>}
                    </div>
                    <Link
                      href={`/trips/${trip.id}/days/${day.id}/edit`}
                      className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 transition-colors"
                    >
                      编辑
                    </Link>
                    <DeleteDayButton dayId={day.id} tripId={trip.id} />
                  </div>
                </div>
                {day.note && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{day.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
