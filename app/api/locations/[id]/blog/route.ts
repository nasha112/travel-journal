import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** 校验地点归属 */
async function findOwnLocation(locationId: number, userId: number) {
  return prisma.location.findFirst({
    where: { id: locationId, tripDay: { trip: { userId } } },
  });
}

/** 读取地点下的全部游记（含图片） */
export async function GET(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const loc = await findOwnLocation(Number(id), userId);
  if (!loc) return NextResponse.json({ error: "地点不存在" }, { status: 404 });

  const blogs = await prisma.blog.findMany({
    where: { locationId: loc.id },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(blogs);
}

/** 创建新游记（一个地点可有多篇） */
export async function POST(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const loc = await findOwnLocation(Number(id), userId);
  if (!loc) return NextResponse.json({ error: "地点不存在" }, { status: 404 });

  try {
    const { title, content, images } = await request.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "游记标题不能为空" }, { status: 400 });
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: "游记标题不能超过 200 个字符" }, { status: 400 });
    }
    if (typeof content !== "string" || content.length > 100_000) {
      return NextResponse.json({ error: "游记内容不合法或超出长度限制" }, { status: 400 });
    }

    const blog = await prisma.blog.create({
      data: {
        locationId: loc.id,
        title: title.trim(),
        content: content || "",
        images: {
          create: (Array.isArray(images) ? images : []).map((url: string) => ({ url })),
        },
      },
      include: { images: true },
    });
    return NextResponse.json(blog, { status: 201 });
  } catch {
    return NextResponse.json({ error: "保存游记失败" }, { status: 500 });
  }
}
