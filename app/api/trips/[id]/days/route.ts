import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** 添加旅行日（dayNumber 自动取当前最大值 + 1） */
export async function POST(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const trip = await prisma.trip.findFirst({ where: { id: Number(id), userId } });
  if (!trip) return NextResponse.json({ error: "旅行不存在" }, { status: 404 });

  try {
    const { title, date, note } = await request.json();
    const last = await prisma.tripDay.findFirst({
      where: { tripId: trip.id },
      orderBy: { dayNumber: "desc" },
    });

    const day = await prisma.tripDay.create({
      data: {
        tripId: trip.id,
        dayNumber: (last?.dayNumber ?? 0) + 1,
        title: title || null,
        date: date ? new Date(date) : null,
        note: note || null,
      },
    });
    return NextResponse.json(day, { status: 201 });
  } catch {
    return NextResponse.json({ error: "添加旅行日失败" }, { status: 500 });
  }
}
