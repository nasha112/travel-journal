import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { validateExpenseInput } from "@/lib/validate";

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
    const body = await request.json();
    // 编辑时按提交字段做校验（部分字段可省略）
    const partial = { ...body };
    if (partial.amount !== undefined) partial.amount = Number(partial.amount);
    if (partial.date === "") delete partial.date; // 允许清空日期（置 null）
    const check = validateExpenseInput(partial);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const { category, amount, note, date, tripDayId, locationId } = body;

    const data: Record<string, unknown> = {};
    if (category !== undefined) data.category = category;
    if (amount !== undefined) data.amount = Number(amount);
    if (note !== undefined) data.note = note || null;
    if (date !== undefined) data.date = date ? new Date(date as string) : null;
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
