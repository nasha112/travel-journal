import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** 校验游记归属（游记 → 地点 → 旅行日 → 旅行 → 用户） */
async function findOwnBlog(blogId: number, userId: number) {
  return prisma.blog.findFirst({
    where: { id: blogId, location: { tripDay: { trip: { userId } } } },
    include: { images: true },
  });
}

/** 更新单篇游记（图片全量替换） */
export async function PUT(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const blog = await findOwnBlog(Number(id), userId);
  if (!blog) return NextResponse.json({ error: "游记不存在" }, { status: 404 });

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

    const imageUrls: string[] = Array.isArray(images) ? images : [];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.blogImage.deleteMany({ where: { blogId: blog.id } });
      return tx.blog.update({
        where: { id: blog.id },
        data: {
          title: title.trim(),
          content: content || "",
          images: { create: imageUrls.map((url) => ({ url })) },
        },
        include: { images: true },
      });
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "保存游记失败" }, { status: 500 });
  }
}

/** 删除单篇游记 */
export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const blog = await findOwnBlog(Number(id), userId);
  if (!blog) return NextResponse.json({ error: "游记不存在" }, { status: 404 });

  await prisma.blog.delete({ where: { id: blog.id } });
  return NextResponse.json({ ok: true });
}
