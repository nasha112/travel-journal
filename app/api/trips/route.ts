import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { validateTripInput } from "@/lib/validate";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const trips = await prisma.trip.findMany({
    where: { userId },
    include: {
      days: {
        select: {
          id: true,
          dayNumber: true,
          title: true,
          date: true,
          _count: { select: { locations: true } },
        },
        orderBy: { dayNumber: "asc" },
      },
      expenses: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = trips.map((t) => {
    const locationCount = t.days.reduce((s, d) => s + d._count.locations, 0);
    const totalExpense = t.expenses.reduce((s, e) => s + Number(e.amount), 0);
    return {
      ...t,
      locationCount,
      totalExpense,
      dayCount: t.days.length,
    };
  });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await request.json();
    const check = validateTripInput(body);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const { title, description, startDate, endDate, cover } = body;

    const trip = await prisma.trip.create({
      data: {
        title: (title as string).trim(),
        description: description || null,
        startDate: startDate ? new Date(startDate as string) : null,
        endDate: endDate ? new Date(endDate as string) : null,
        cover: cover || null,
        userId,
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建旅行失败" }, { status: 500 });
  }
}
