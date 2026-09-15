import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { validateTripInput } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

/** 查询当前用户的一趟旅行（带完整关联），无权限返回 null */
async function findOwnTrip(tripId: number, userId: number) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          locations: {
            orderBy: { id: "asc" },
            include: { blogs: { include: { images: true } } },
          },
          _count: { select: { expenses: true } },
        },
      },
      expenses: { orderBy: { date: "asc" } },
      _count: { select: { days: true } },
    },
  });
}

export async function GET(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const trip = await findOwnTrip(Number(id), userId);
  if (!trip) return NextResponse.json({ error: "旅行不存在" }, { status: 404 });

  const locationCount = trip.days.reduce((s, d) => s + d.locations.length, 0);
  const totalExpense = trip.expenses.reduce((s, e) => s + Number(e.amount), 0);

  return NextResponse.json({ ...trip, locationCount, totalExpense });
}

export async function PUT(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.trip.findFirst({ where: { id: Number(id), userId } });
  if (!existing) return NextResponse.json({ error: "旅行不存在" }, { status: 404 });

  try {
    const body = await request.json();
    const check = validateTripInput(body);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const { title, description, startDate, endDate, cover } = body;
    const trip = await prisma.trip.update({
      where: { id: Number(id) },
      data: {
        title: (title as string).trim(),
        description: description ?? existing.description,
        startDate: startDate ? new Date(startDate as string) : null,
        endDate: endDate ? new Date(endDate as string) : null,
        cover: cover ?? existing.cover,
      },
    });
    return NextResponse.json(trip);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.trip.findFirst({ where: { id: Number(id), userId } });
  if (!existing) return NextResponse.json({ error: "旅行不存在" }, { status: 404 });

  await prisma.trip.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
