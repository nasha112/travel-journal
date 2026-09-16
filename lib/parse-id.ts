/**
 * 解析并校验 URL 路径参数中的正整数 ID。
 * 非法输入（非数字/非整数/≤0）返回 null，调用方应返回 400。
 * 避免 Number("abc") → NaN 传入 Prisma 查询导致 500。
 */
export function parseIdParam(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}
