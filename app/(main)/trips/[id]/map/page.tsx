import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TripMap from "@/components/ClientTripMap";
import type { MapPoint } from "@/components/TripMap";

export const dynamic = "force-dynamic";

export default async function TripMapPage({ params }: { params: Promise<{ id: string }> }) {
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
            orderBy: { id: "asc" },
            include: { blogs: { select: { id: true } } },
          },
        },
      },
    },
  });
  if (!trip) redirect("/trips");

  // 按旅行日顺序生成点位和路线（编号 1,2,3... 表示游玩顺序）
  const points: MapPoint[] = [];
  const lines: [number, number][][] = [];
  const tripLine: [number, number][] = [];
  let order = 1;
  for (const day of trip.days) {
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
      tripLine.push([loc.lat, loc.lng]);
      order++;
    }
  }
  if (tripLine.length >= 2) lines.push(tripLine);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{trip.title} · 足迹地图</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {points.length} 个打卡地点，按行程顺序连线
          </p>
        </div>
        <Link
          href={`/trips/${trip.id}`}
          className="text-sm text-gray-500 hover:text-blue-600 border border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          ← 返回行程
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-800">地图视图</span>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> 有游记
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 无游记
            </span>
          </div>
        </div>
        <div className="h-[520px]">
          {points.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm">这趟旅行还没有打卡地点</p>
              <Link href={`/trips/${trip.id}`} className="mt-3 text-sm text-blue-600 hover:underline">
                先去行程时间轴添加地点 →
              </Link>
            </div>
          ) : (
            <TripMap points={points} lines={lines} height="520px" />
          )}
        </div>
      </div>

      {/* 地点清单 */}
      {points.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800">地点清单</div>
          <div className="divide-y divide-gray-100">
            {trip.days.map((day) => (
              <div key={day.id} className="px-4 py-3">
                <div className="text-xs font-medium text-blue-600 mb-2">
                  Day {day.dayNumber}
                  {day.title ? ` · ${day.title}` : ""}
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.locations.length === 0 && (
                    <span className="text-xs text-gray-400">无地点</span>
                  )}
                  {day.locations.map((loc) => (
                    <Link
                      key={loc.id}
                      href={`/locations/${loc.id}/blog`}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        loc.blogs.length > 0
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      📍 {loc.name}
                      {loc.blogs.length > 0 ? " · 已写游记" : " · 待写游记"}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
