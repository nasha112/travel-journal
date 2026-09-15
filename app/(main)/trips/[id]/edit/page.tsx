import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TripForm from "@/components/TripForm";

export const dynamic = "force-dynamic";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const trip = await prisma.trip.findFirst({
    where: { id: Number(id), userId: user.id },
  });
  if (!trip) redirect("/trips");

  return (
    <TripForm
      trip={{
        id: trip.id,
        title: trip.title,
        description: trip.description,
        startDate: trip.startDate ? trip.startDate.toISOString() : null,
        endDate: trip.endDate ? trip.endDate.toISOString() : null,
        cover: trip.cover,
        status: trip.status,
      }}
    />
  );
}
