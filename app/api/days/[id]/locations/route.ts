import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { parseIdParam } from "@/lib/parse-id";
import { validateLocationInput } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

/** 在指定旅行日下添加打卡地点 */
export async function POST(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const parsedId = parseIdParam(id);
  if (!parsedId) return NextResponse.json({ error: "参数错误" }, { status: 400 });
  const day = await prisma.tripDay.findFirst({
    where: { id: parsedId, trip: { userId } },
  });
  if (!day) return NextResponse.json({ error: "旅行日不存在" }, { status: 404 });

  try {
    const body = await request.json();
    const check = validateLocationInput(body);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const { name, country, city, lat, lng, type, note } = body;

    const location = await prisma.location.create({
      data: {
        tripDayId: day.id,
        name: (name as string).trim(),
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
