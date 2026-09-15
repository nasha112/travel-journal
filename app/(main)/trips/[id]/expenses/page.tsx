import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ExpensePage from "@/components/ExpensePage";

export const dynamic = "force-dynamic";

export default async function TripExpensesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const trip = await prisma.trip.findFirst({
    where: { id: Number(id), userId: user.id },
    include: {
      days: {
        select: { id: true, dayNumber: true, title: true },
        orderBy: { dayNumber: "asc" },
      },
      expenses: {
        include: {
          tripDay: { select: { dayNumber: true, title: true } },
          location: { select: { id: true, name: true } },
        },
        orderBy: [{ date: "asc" }, { id: "asc" }],
      },
    },
  });
  if (!trip) redirect("/trips");

  // 按旅行日分组的地点（供表单联动选择）
  const daysWithLocations = await prisma.tripDay.findMany({
    where: { tripId: trip.id },
    include: { locations: { select: { id: true, name: true }, orderBy: { id: "asc" } } },
    orderBy: { dayNumber: "asc" },
  });

  const locations = daysWithLocations.map((d) => ({
    dayId: d.id,
    dayNumber: d.dayNumber,
    list: d.locations,
  }));

  return (
    <ExpensePage
      tripId={trip.id}
      tripTitle={trip.title}
      initialExpenses={trip.expenses}
      days={trip.days}
      locationsByDay={locations}
    />
  );
}
