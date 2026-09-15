import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { validateExpenseInput } from "@/lib/validate";
import type { ExpenseCategory } from "@prisma/client";

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
    const body = await request.json();
    const check = validateExpenseInput(body);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const { category, amount, note, date, tripDayId, locationId } = body;

    // 校验旅行日归属
    if (tripDayId != null) {
      const day = await prisma.tripDay.findFirst({
        where: { id: Number(tripDayId), tripId: trip.id },
      });
      if (!day) return NextResponse.json({ error: "旅行日不存在" }, { status: 400 });
    }

    // 跨层级关联一致性校验：
    // 地点必须属于该趟旅行的某个旅行日；若同时指定旅行日，地点必须属于该旅行日；
    // 若未指定旅行日，则自动继承地点的所属旅行日，杜绝交叉归属（trip/tripDay/location 互相矛盾）。
    let effectiveDayId = tripDayId != null ? Number(tripDayId) : null;
    if (locationId != null) {
      const loc = await prisma.location.findFirst({
        where: { id: Number(locationId), tripDay: { tripId: trip.id } },
      });
      if (!loc) return NextResponse.json({ error: "地点不存在或不属于该旅行" }, { status: 400 });
      if (effectiveDayId != null && loc.tripDayId !== effectiveDayId) {
        return NextResponse.json({ error: "所选地点不属于该旅行日" }, { status: 400 });
      }
      if (effectiveDayId == null) effectiveDayId = loc.tripDayId;
    }

    const expense = await prisma.expense.create({
      data: {
        tripId: trip.id,
        tripDayId: effectiveDayId,
        locationId: locationId != null ? Number(locationId) : null,
        category: category as ExpenseCategory,
        amount: Number(amount),
        note: note || null,
        date: new Date(date as string),
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
