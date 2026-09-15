/**
 * 格式化日期为 YYYY-MM-DD。
 * Prisma 对 MySQL DATETIME 写入时转成 UTC 字面、读取时按 UTC 解析，
 * 因此用本地时区取值可还原原始时刻（+8 时区下日期一致）。
 */

// 地点类型（与 prisma/schema.prisma 中 LocationType 枚举对应）
export const LOCATION_TYPES = [
  "ATTRACTION",
  "RESTAURANT",
  "HOTEL",
  "SHOPPING",
  "STATION",
  "AIRPORT",
  "PARK",
  "MUSEUM",
  "OTHER",
] as const;

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  ATTRACTION: "景点",
  RESTAURANT: "美食",
  HOTEL: "住宿",
  SHOPPING: "购物",
  STATION: "车站",
  AIRPORT: "机场",
  PARK: "公园",
  MUSEUM: "博物馆",
  OTHER: "其他",
};

/** 地点类型枚举 → 中文标签 */
export function locationTypeLabel(t: string | null | undefined): string {
  return t ? LOCATION_TYPE_LABELS[t] ?? t : "";
}

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

// 消费分类（与 prisma/schema.prisma 中 ExpenseCategory 枚举对应）
export const EXPENSE_CATEGORIES = [
  "TRANSPORT",
  "ACCOMMODATION",
  "FOOD",
  "TICKET",
  "SHOPPING",
  "OTHER",
] as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  TRANSPORT: "交通",
  ACCOMMODATION: "住宿",
  FOOD: "餐饮",
  TICKET: "门票",
  SHOPPING: "购物",
  OTHER: "其他",
};

/** 消费分类枚举 → 中文标签 */
export function expenseCategoryLabel(c: string | null | undefined): string {
  return c ? EXPENSE_CATEGORY_LABELS[c] ?? c : "";
}

// 旅行状态（与 prisma/schema.prisma 中 TripStatus 枚举对应）
export const TRIP_STATUSES = ["PLANNED", "ONGOING", "COMPLETED"] as const;

export const TRIP_STATUS_LABELS: Record<string, string> = {
  PLANNED: "计划中",
  ONGOING: "进行中",
  COMPLETED: "已完成",
};

/** 旅行状态枚举 → 中文标签 */
export function tripStatusLabel(s: string | null | undefined): string {
  return s ? TRIP_STATUS_LABELS[s] ?? s : "";
}

/** 根据起止日期推断旅行状态（供表单默认值 / seed 使用） */
export function inferTripStatus(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  now = new Date()
): "PLANNED" | "ONGOING" | "COMPLETED" {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end && end.getTime() < now.getTime()) return "COMPLETED";
  if (start && end && start.getTime() <= now.getTime() && now.getTime() <= end.getTime())
    return "ONGOING";
  return "PLANNED";
}
