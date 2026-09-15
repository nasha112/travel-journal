import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LocationForm from "@/components/LocationForm";
import DeleteLocationButton from "@/components/DeleteLocationButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ id: string; dayId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id, dayId } = await params;
  const day = await prisma.tripDay.findFirst({
    where: { id: Number(dayId), trip: { id: Number(id), userId: user.id } },
    include: {
      trip: { select: { id: true, title: true } },
      locations: {
        orderBy: { id: "asc" },
        include: { blogs: { select: { id: true, title: true } } },
      },
    },
  });
  if (!day) redirect(`/trips/${id}`);

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm text-gray-400 mb-2">
          <Link href="/trips" className="hover:text-blue-600">我的旅行</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/trips/${day.trip.id}`} className="hover:text-blue-600">
            {day.trip.title}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-600">Day {day.dayNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white text-sm font-bold px-2 py-0.5 rounded-md">
            Day {day.dayNumber}
          </span>
          <h1 className="text-xl font-bold text-gray-800">{day.title || `第 ${day.dayNumber} 天`}</h1>
        </div>
        {day.date && <div className="text-sm text-gray-500 mt-1">📅 {formatDate(day.date)}</div>}
        {day.note && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{day.note}</p>}
      </div>

      {/* 地点列表 */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">
          打卡地点
          <span className="text-sm font-normal text-gray-400 ml-2">共 {day.locations.length} 个</span>
        </h2>

        {day.locations.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm mb-6">
            还没有打卡地点，用右侧表单添加第一个吧
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {day.locations.map((loc) => (
              <div key={loc.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{loc.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {[loc.country, loc.city].filter(Boolean).join(" · ") || "未填城市"}
                    </div>
                  </div>
                  {loc.type && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                      {loc.type}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400 font-mono">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </div>

                {loc.note && <p className="text-sm text-gray-500 line-clamp-2">{loc.note}</p>}

                <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100">
                  {loc.blogs.length > 0 ? (
                    <Link
                      href={`/locations/${loc.id}/blog`}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      📝 查看游记（{loc.blogs.length}）
                    </Link>
                  ) : (
                    <Link
                      href={`/locations/${loc.id}/blog`}
                      className="text-xs text-amber-600 hover:underline font-medium"
                    >
                      ✍️ 写游记
                    </Link>
                  )}
                  <DeleteLocationButton locationId={loc.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加地点 */}
      <LocationForm dayId={day.id} />
    </div>
  );
}
