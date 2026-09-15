import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** 在指定旅行日下添加打卡地点 */
export async function POST(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const day = await prisma.tripDay.findFirst({
    where: { id: Number(id), trip: { userId } },
  });
  if (!day) return NextResponse.json({ error: "旅行日不存在" }, { status: 404 });

  try {
    const { name, country, city, lat, lng, type, note } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "地点名称不能为空" }, { status: 400 });
    }
    if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return NextResponse.json({ error: "请选择地点的经纬度" }, { status: 400 });
    }

    const location = await prisma.location.create({
      data: {
        tripDayId: day.id,
        name: name.trim(),
        country: country || null,
        city: city || null,
        lat: Number(lat),
        lng: Number(lng),
        type: type || null,
        note: note || null,
      },
    });
    return NextResponse.json(location, { status: 201 });
  } catch {
    return NextResponse.json({ error: "添加地点失败" }, { status: 500 });
  }
}
