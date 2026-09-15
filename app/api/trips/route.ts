import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

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
    const { title, description, startDate, endDate, cover } = await request.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "旅行名称不能为空" }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        title: title.trim(),
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        cover: cover || null,
        userId,
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建旅行失败" }, { status: 500 });
  }
}
