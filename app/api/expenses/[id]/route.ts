import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { EXPENSE_CATEGORIES } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

/** 校验消费记录归属（消费 → 旅行 → 用户） */
async function findOwnExpense(expenseId: number, userId: number) {
  return prisma.expense.findFirst({ where: { id: expenseId, trip: { userId } } });
}

export async function PUT(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const expense = await findOwnExpense(Number(id), userId);
  if (!expense) return NextResponse.json({ error: "消费记录不存在" }, { status: 404 });

  try {
    const { category, amount, note, date, tripDayId, locationId } = await request.json();

    const data: Record<string, unknown> = {};
    if (category !== undefined) {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: "请选择有效的消费分类" }, { status: 400 });
      }
      data.category = category;
    }
    if (amount !== undefined) {
      const num = Number(amount);
      if (isNaN(num) || num <= 0) {
        return NextResponse.json({ error: "金额必须大于 0" }, { status: 400 });
      }
      data.amount = num;
    }
    if (note !== undefined) data.note = note || null;
    if (date !== undefined) data.date = date ? new Date(date) : null;
    if (tripDayId !== undefined) {
      if (tripDayId == null) {
        data.tripDayId = null;
      } else {
        const day = await prisma.tripDay.findFirst({
          where: { id: Number(tripDayId), tripId: expense.tripId },
        });
        if (!day) return NextResponse.json({ error: "旅行日不存在" }, { status: 400 });
        data.tripDayId = day.id;
      }
    }
    if (locationId !== undefined) {
      if (locationId == null) {
        data.locationId = null;
      } else {
        const loc = await prisma.location.findFirst({
          where: { id: Number(locationId), tripDay: { tripId: expense.tripId } },
        });
        if (!loc) return NextResponse.json({ error: "地点不存在或不属于该旅行" }, { status: 400 });
        data.locationId = loc.id;
      }
    }

    const updated = await prisma.expense.update({ where: { id: expense.id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const expense = await findOwnExpense(Number(id), userId);
  if (!expense) return NextResponse.json({ error: "消费记录不存在" }, { status: 404 });

  await prisma.expense.delete({ where: { id: expense.id } });
  return NextResponse.json({ ok: true });
}
