import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { EXPENSE_CATEGORIES } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const trip = await prisma.trip.findFirst({ where: { id: Number(id), userId } });
  if (!trip) return NextResponse.json({ error: "旅行不存在" }, { status: 404 });

  const expenses = await prisma.expense.findMany({
    where: { tripId: trip.id },
    include: {
      tripDay: { select: { dayNumber: true, title: true } },
      location: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });

  return NextResponse.json(expenses);
}

export async function POST(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const trip = await prisma.trip.findFirst({ where: { id: Number(id), userId } });
  if (!trip) return NextResponse.json({ error: "旅行不存在" }, { status: 404 });

  try {
    const { category, amount, note, date, tripDayId, locationId } = await request.json();

    if (!category || !EXPENSE_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "请选择有效的消费分类" }, { status: 400 });
    }
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      return NextResponse.json({ error: "金额必须大于 0" }, { status: 400 });
    }

    // 校验旅行日归属
    if (tripDayId != null) {
      const day = await prisma.tripDay.findFirst({
        where: { id: Number(tripDayId), tripId: trip.id },
      });
      if (!day) return NextResponse.json({ error: "旅行日不存在" }, { status: 400 });
    }

    // 校验地点归属：必须属于该趟旅行的某个旅行日
    if (locationId != null) {
      const loc = await prisma.location.findFirst({
        where: {
          id: Number(locationId),
          tripDay: { tripId: trip.id },
        },
      });
      if (!loc) return NextResponse.json({ error: "地点不存在或不属于该旅行" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        tripId: trip.id,
        tripDayId: tripDayId ? Number(tripDayId) : null,
        locationId: locationId ? Number(locationId) : null,
        category,
        amount: num,
        note: note || null,
        date: date ? new Date(date) : null,
      },
      include: {
        tripDay: { select: { dayNumber: true, title: true } },
        location: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "添加消费失败" }, { status: 500 });
  }
}
