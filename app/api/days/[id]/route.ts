import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { parseIdParam } from "@/lib/parse-id";
import { validateDayInput } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

/** 校验旅行日归属（通过所属旅行） */
async function findOwnDay(dayId: number, userId: number) {
  return prisma.tripDay.findFirst({
    where: { id: dayId, trip: { userId } },
    include: { trip: { select: { id: true, title: true } } },
  });
}

export async function PUT(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const parsedId = parseIdParam(id);
  if (!parsedId) return NextResponse.json({ error: "参数错误" }, { status: 400 });
  const day = await findOwnDay(parsedId, userId);
  if (!day) return NextResponse.json({ error: "旅行日不存在" }, { status: 404 });

  try {
    const body = await request.json();
    // 合并原值后整体校验（编辑允许部分字段）
    const merged = { ...body, title: body.title ?? day.title, date: body.date ?? day.date };
    const check = validateDayInput(merged);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const { title, date, note } = body;
    const updated = await prisma.tripDay.update({
      where: { id: day.id },
      data: {
        title: title ?? day.title,
        date: date ? new Date(date as string) : date === null ? null : day.date,
        note: note ?? day.note,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const parsedId = parseIdParam(id);
  if (!parsedId) return NextResponse.json({ error: "参数错误" }, { status: 400 });
  const day = await findOwnDay(parsedId, userId);
  if (!day) return NextResponse.json({ error: "旅行日不存在" }, { status: 404 });

  await prisma.tripDay.delete({ where: { id: day.id } });
  return NextResponse.json({ ok: true });
}
