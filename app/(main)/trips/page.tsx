import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TripFilter from "@/components/TripFilter";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const year = sp.year ? Number(sp.year) : null;

  // 全部旅行（用于年份下拉）
  const allTrips = await prisma.trip.findMany({
    where: { userId: user.id },
    select: { startDate: true },
  });
  const years = Array.from(
    new Set(allTrips.map((t) => t.startDate?.getFullYear()).filter((y): y is number => !!y))
  ).sort((a, b) => b - a);

  const trips = await prisma.trip.findMany({
    where: {
      userId: user.id,
      ...(year
        ? {
            startDate: {
              gte: new Date(`${year}-01-01T00:00:00`),
              lt: new Date(`${year + 1}-01-01T00:00:00`),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              {
                days: {
                  some: {
                    locations: {
                      some: {
                        OR: [{ city: { contains: q } }, { name: { contains: q } }],
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      days: { select: { _count: { select: { locations: true } } } },
      expenses: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的旅行</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {trips.length} 趟旅行</p>
        </div>
        <div className="flex items-center gap-3">
          <TripFilter years={years} />
          <Link
            href="/trips/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            + 新建旅行
          </Link>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-5xl mb-3">🧳</div>
          <p className="text-gray-500 mb-4">
            {q || year ? "没有符合条件的旅行" : "还没有旅行记录"}
          </p>
          {!q && !year && (
            <Link href="/trips/new" className="text-blue-600 hover:underline text-sm">
              创建你的第一趟旅行 →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => {
            const locCount = trip.days.reduce((s, d) => s + d._count.locations, 0);
            const exp = trip.expenses.reduce((s, e) => s + Number(e.amount), 0);
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group"
              >
                <div className="h-36 bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100 flex items-center justify-center text-4xl">
                  {trip.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trip.cover} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    "🏔️"
                  )}
                </div>
                <div className="p-4">
                  <div className="font-semibold text-gray-800 truncate">{trip.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                  </div>
                  {trip.description && (
                    <div className="text-sm text-gray-500 mt-2 line-clamp-2">{trip.description}</div>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>📅 {trip.days.length} 天</span>
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
  );
}
