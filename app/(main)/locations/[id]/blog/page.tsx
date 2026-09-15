import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import BlogPage from "@/components/BlogPage";

export const dynamic = "force-dynamic";

export default async function LocationBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const location = await prisma.location.findFirst({
    where: { id: Number(id), tripDay: { trip: { userId: user.id } } },
    include: {
      blogs: { include: { images: true }, orderBy: { createdAt: "desc" } },
      tripDay: {
        include: { trip: { select: { id: true, title: true } } },
      },
    },
  });
  if (!location) redirect("/trips");

  return (
    <BlogPage
      data={{
        location: {
          id: location.id,
          name: location.name,
          city: location.city,
          country: location.country,
          lat: location.lat,
          lng: location.lng,
          type: location.type,
        },
        tripTitle: location.tripDay.trip.title,
        tripId: location.tripDay.trip.id,
        dayNumber: location.tripDay.dayNumber,
        blogs: location.blogs,
      }}
    />
  );
}
