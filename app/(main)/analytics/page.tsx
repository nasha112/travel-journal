import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AnalyticsCharts from "@/components/AnalyticsCharts";

export const dynamic = "force-dynamic";

function daysBetween(start: Date | null, end: Date | null): number {
  if (!start || !end) return 1;
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    include: {
      days: {
        include: {
          locations: { include: { blogs: { select: { id: true } } } },
        },
      },
      expenses: true,
    },
    orderBy: { startDate: "asc" },
  });

  // 汇总统计
  const totalTrips = trips.length;
  const totalDays = trips.reduce((s, t) => s + daysBetween(t.startDate, t.endDate), 0);
  const totalLocations = trips.reduce(
    (s, t) => s + t.days.reduce((x, d) => x + d.locations.length, 0),
    0
  );
  const totalBlogs = trips.reduce(
    (s, t) => s + t.days.reduce((x, d) => x + d.locations.reduce((y, l) => y + l.blogs.length, 0), 0),
    0
  );
  const totalExpense = trips.reduce(
    (s, t) => s + t.expenses.reduce((x, e) => x + Number(e.amount), 0),
    0
  );
  const avgPerDay = totalDays > 0 ? totalExpense / totalDays : 0;
  const avgPerTrip = totalTrips > 0 ? totalExpense / totalTrips : 0;

  // 年度统计（旅行次数 / 天数 / 消费）
  const yearMap = new Map<number, { year: number; trips: number; days: number; expense: number }>();
  for (const t of trips) {
    const y = t.startDate?.getFullYear() ?? 0;
    if (!yearMap.has(y)) yearMap.set(y, { year: y, trips: 0, days: 0, expense: 0 });
    const rec = yearMap.get(y)!;
    rec.trips += 1;
    rec.days += daysBetween(t.startDate, t.endDate);
    rec.expense += t.expenses.reduce((x, e) => x + Number(e.amount), 0);
  }
  const yearData = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  // 国家分布
  const countryMap = new Map<string, number>();
  // 城市分布
  const cityMap = new Map<string, number>();
  for (const t of trips) {
    for (const d of t.days) {
      for (const l of d.locations) {
        if (l.country) countryMap.set(l.country, (countryMap.get(l.country) ?? 0) + 1);
        if (l.city) cityMap.set(l.city, (cityMap.get(l.city) ?? 0) + 1);
      }
    }
  }
  const countryData = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
  const cityData = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 消费分类
  const categoryMap = new Map<string, number>();
  for (const t of trips) {
    for (const e of t.expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + Number(e.amount));
    }
  }
  const categoryData = Array.from(categoryMap.entries())
    .map(([category, value]) => ({ category, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // 月度消费趋势
  const monthMap = new Map<string, number>();
  for (const t of trips) {
    for (const e of t.expenses) {
      if (!e.date) continue;
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + Number(e.amount));
    }
  }
  const monthData = Array.from(monthMap.entries())
    .map(([month, total]) => ({ month, total: Math.round(total) }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  return (
    <AnalyticsCharts
      totalTrips={totalTrips}
      totalDays={totalDays}
      totalLocations={totalLocations}
      totalBlogs={totalBlogs}
      totalExpense={totalExpense}
      avgPerDay={avgPerDay}
      avgPerTrip={avgPerTrip}
      yearData={yearData}
      countryData={countryData}
      cityData={cityData}
      categoryData={categoryData}
      monthData={monthData}
    />
  );
}
