import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DayForm from "@/components/DayForm";

export const dynamic = "force-dynamic";

export default async function EditDayPage({
  params,
}: {
  params: Promise<{ id: string; dayId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id, dayId } = await params;
  const day = await prisma.tripDay.findFirst({
    where: { id: Number(dayId), trip: { id: Number(id), userId: user.id } },
  });
  if (!day) redirect(`/trips/${id}`);

  return (
    <DayForm
      tripId={Number(id)}
      day={{
        id: day.id,
        title: day.title,
        date: day.date ? day.date.toISOString() : null,
        note: day.note,
      }}
    />
  );
}
