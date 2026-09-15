/**
 * 格式化日期为 YYYY-MM-DD。
 * Prisma 对 MySQL DATETIME 写入时转成 UTC 字面、读取时按 UTC 解析，
 * 因此用本地时区取值可还原原始时刻（+8 时区下日期一致）。
 */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/** 格式化日期时间（24 小时制）；时间为 00:00 时只显示日期 */
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const dateStr = formatDate(date);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  if (h === "00" && m === "00") return dateStr;
  return `${dateStr} ${h}:${m}`;
}

/** 金额格式化 */
export function formatMoney(n: number): string {
  return `¥${n.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

/** 消费分类中文名 */
export const EXPENSE_CATEGORIES = ["交通", "住宿", "餐饮", "门票", "购物", "其他"] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
