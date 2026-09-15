import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUserId } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/** 图片上传接口：保存到 public/uploads，返回访问 URL */
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "未选择文件" }, { status: 400 });

    const ext = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return NextResponse.json({ error: "仅支持 jpg/png/gif/webp 图片" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "图片不能超过 5MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
