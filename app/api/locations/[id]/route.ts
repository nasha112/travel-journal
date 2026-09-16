import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { parseIdParam } from "@/lib/parse-id";
import { validateLocationInput } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

/** 校验地点归属（地点 → 旅行日 → 旅行 → 用户） */
async function findOwnLocation(locationId: number, userId: number) {
  return prisma.location.findFirst({
    where: { id: locationId, tripDay: { trip: { userId } } },
  });
}

export async function PUT(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const parsedId = parseIdParam(id);
  if (!parsedId) return NextResponse.json({ error: "参数错误" }, { status: 400 });
  const loc = await findOwnLocation(parsedId, userId);
  if (!loc) return NextResponse.json({ error: "地点不存在" }, { status: 404 });

  try {
    const body = await request.json();
    // 编辑时以提交值 + 原值合并后校验
    const merged = {
      ...body,
      lat: body.lat != null ? Number(body.lat) : loc.lat,
      lng: body.lng != null ? Number(body.lng) : loc.lng,
    };
    const check = validateLocationInput(merged);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const { name, country, city, lat, lng, type, note } = body;
    const updated = await prisma.location.update({
      where: { id: loc.id },
      data: {
        name: (name as string).trim(),
        country: country ?? loc.country,
        city: city ?? loc.city,
        lat: lat != null ? Number(lat) : loc.lat,
        lng: lng != null ? Number(lng) : loc.lng,
        type: type ?? loc.type,
        note: note ?? loc.note,
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
  const loc = await findOwnLocation(parsedId, userId);
  if (!loc) return NextResponse.json({ error: "地点不存在" }, { status: 404 });

  await prisma.location.delete({ where: { id: loc.id } });
  return NextResponse.json({ ok: true });
}
