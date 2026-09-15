import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "travel-journal-dev-secret-2026"
);

/** 签发 JWT 登录令牌 */
export async function signToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/** 验证 JWT，成功返回 userId，失败返回 null */
export async function verifyToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.userId as number) ?? null;
  } catch {
    return null;
  }
}

/** 从 cookie 中读取当前登录用户 id */
export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** 获取当前登录用户（不含密码），未登录返回 null */
export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true },
  });
}

/** 校验 API 请求中当前用户，未登录返回 null */
export async function requireUserId(): Promise<number | null> {
  return getSessionUserId();
}
