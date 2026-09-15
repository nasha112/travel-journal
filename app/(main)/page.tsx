import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TripMap from "@/components/ClientTripMap";
import HomeFilter from "@/components/HomeFilter";
import TripStatusBadge from "@/components/TripStatusBadge";
import type { MapPoint } from "@/components/TripMap";
import type { LocationType } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const year = sp.year ? Number(sp.year) : null;
  const type = (sp.type as LocationType) || null;

  // 全部旅行（仅取开始日期，用于年份下拉）
  const allTrips = await prisma.trip.findMany({
    where: { userId: user.id },
    select: { startDate: true },
  });
  const years = Array.from(
    new Set(allTrips.map((t) => t.startDate?.getFullYear()).filter((y): y is number => !!y))
  ).sort((a, b) => b - a);

  // 筛选条件（年份 + 地点类型）
  const baseWhere = {
    userId: user.id,
    ...(year
      ? {
          startDate: {
            gte: new Date(`${year}-01-01T00:00:00`),
            lt: new Date(`${year + 1}-01-01T00:00:00`),
          },
        }
      : {}),
    ...(type ? { days: { some: { locations: { some: { type } } } } } : {}),
  } as const;

  // 查询优化：拆分为「地图+统计」与「旅行列表」两个定向查询，并行执行。
  // 只取所需字段（博客只计数、消费只取金额），避免全量联表传输。
  const [mapTrips, listTrips] = await Promise.all([
    prisma.trip.findMany({
      where: baseWhere,
      select: {
        id: true,
        title: true,
        cover: true,
        description: true,
        startDate: true,
        endDate: true,
        days: {
          orderBy: { dayNumber: "asc" },
          select: {
            locations: {
              select: {
                id: true,
                name: true,
                lat: true,
                lng: true,
                city: true,
                type: true,
                _count: { select: { blogs: true } },
              },
            },
          },
        },
        expenses: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trip.findMany({
      where: baseWhere,
      select: {
        id: true,
        title: true,
        cover: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        days: { select: { _count: { select: { locations: true } } } },
        expenses: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  // 汇总统计（基于地图查询结果）
  const totalLocations = mapTrips.reduce(
    (sum, t) => sum + t.days.reduce((s, d) => s + d.locations.length, 0),
    0
  );
  const totalBlogs = mapTrips.reduce(
    (sum, t) =>
      sum + t.days.reduce((s, d) => s + d.locations.filter((l) => l._count.blogs > 0).length, 0),
    0
  );
  const totalExpense = mapTrips.reduce(
    (sum, t) => sum + t.expenses.reduce((s, e) => s + Number(e.amount), 0),
    0
  );

  // 地图点位与路线
  const points: MapPoint[] = [];
  const lines: [number, number][][] = [];
  for (const trip of mapTrips) {
    const tripLine: [number, number][] = [];
    let order = 1; // 每趟旅行内按行程顺序编号
    for (const day of trip.days) {
      for (const loc of day.locations) {
        // 类型筛选时只展示匹配类型的地点
        if (type && loc.type !== type) continue;
        points.push({
          id: loc.id,
          name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          city: loc.city,
          hasBlog: loc._count.blogs > 0,
          order,
        });
        tripLine.push([loc.lat, loc.lng]);
        order++;
      }
    }
    if (tripLine.length >= 2) lines.push(tripLine);
  }

  return (
    <div className="space-y-6">
      {/* 顶部欢迎区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">你好，{user.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">这里是你的全部旅行足迹</p>
        </div>
        <Link
          href="/trips/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          + 新建旅行
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "旅行次数", value: mapTrips.length, icon: "✈️" },
          { label: "打卡地点", value: totalLocations, icon: "📍" },
          { label: "游记数量", value: totalBlogs, icon: "📝" },
          { label: "累计消费", value: `¥${totalExpense.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`, icon: "💰" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-400 mb-1">{s.icon} {s.label}</div>
            <div className="text-xl font-bold text-gray-800">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 足迹地图 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-gray-800">全部旅行足迹</h2>
          <div className="flex items-center gap-4">
            <HomeFilter years={years} />
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> 有游记
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 无游记
              </span>
            </div>
          </div>
        </div>
        <div className="h-[480px]">
          {points.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm">还没有旅行足迹，先创建一趟旅行吧</p>
              <Link href="/trips/new" className="mt-3 text-sm text-blue-600 hover:underline">
                立即创建 →
              </Link>
            </div>
          ) : (
            <TripMap points={points} lines={lines} height="480px" />
          )}
        </div>
      </div>

      {/* 旅行列表（独立轻量查询，仅取前 6 条） */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">我的旅行</h2>
          <Link href="/trips" className="text-sm text-blue-600 hover:underline">
            查看全部
          </Link>
        </div>
        {listTrips.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
            暂无旅行记录
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listTrips.map((trip) => {
              const locCount = trip.days.reduce((s, d) => s + d._count.locations, 0);
              const exp = trip.expenses.reduce((s, e) => s + Number(e.amount), 0);
              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100 flex items-center justify-center text-3xl">
                    {trip.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={trip.cover} alt={trip.title} className="w-full h-full object-cover" />
                    ) : (
                      "🏔️"
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-800 truncate">{trip.title}</div>
                      <TripStatusBadge status={trip.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>📍 {locCount} 个地点</span>
                      <span>💰 ¥{exp.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
