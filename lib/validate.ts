import { LOCATION_TYPES, EXPENSE_CATEGORIES, TRIP_STATUSES } from "@/lib/utils";

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

/** 简单日期解析：仅接受 YYYY-MM-DD 或完整 ISO 时间串 */
function parseDateInput(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d;
}

/** 旅行输入校验（创建/编辑共用） */
export function validateTripInput(body: Record<string, unknown>): ValidationResult {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { ok: false, error: "旅行名称不能为空" };
  if (title.length > 100) return { ok: false, error: "旅行名称不能超过 100 个字符" };

  const description = body.description as string | undefined;
  if (description && description.length > 2000)
    return { ok: false, error: "旅行简介不能超过 2000 个字符" };

  const start = body.startDate ? parseDateInput(body.startDate) : null;
  const end = body.endDate ? parseDateInput(body.endDate) : null;
  if (body.startDate && !start) return { ok: false, error: "开始日期格式不正确" };
  if (body.endDate && !end) return { ok: false, error: "结束日期格式不正确" };
  if (start && end && end.getTime() < start.getTime())
    return { ok: false, error: "结束日期不能早于开始日期" };

  const cover = body.cover as string | undefined;
  if (cover && typeof cover !== "string")
    return { ok: false, error: "封面地址格式不正确" };

  const status = body.status as string | undefined;
  if (status && !(TRIP_STATUSES as readonly string[]).includes(status))
    return { ok: false, error: "旅行状态不合法" };

  return { ok: true };
}

/** 旅行日输入校验 */
export function validateDayInput(body: Record<string, unknown>): ValidationResult {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { ok: false, error: "行程标题不能为空" };
  if (title.length > 200) return { ok: false, error: "行程标题不能超过 200 个字符" };

  const date = body.date ? parseDateInput(body.date) : null;
  if (!date) return { ok: false, error: "行程日期不能为空或格式不正确" };

  const note = body.note as string | undefined;
  if (note && note.length > 2000) return { ok: false, error: "行程备注不能超过 2000 个字符" };

  return { ok: true };
}

/** 地点输入校验 */
export function validateLocationInput(body: Record<string, unknown>): ValidationResult {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return { ok: false, error: "地点名称不能为空" };
  if (name.length > 200) return { ok: false, error: "地点名称不能超过 200 个字符" };

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (body.lat == null || body.lng == null || isNaN(lat) || isNaN(lng))
    return { ok: false, error: "请选择地点的经纬度" };
  if (lat < -90 || lat > 90) return { ok: false, error: "纬度必须在 -90 到 90 之间" };
  if (lng < -180 || lng > 180) return { ok: false, error: "经度必须在 -180 到 180 之间" };

  const type = body.type as string | undefined;
  if (type && !(LOCATION_TYPES as readonly string[]).includes(type))
    return { ok: false, error: "地点类型不合法" };

  for (const [key, max] of [
    ["country", 100],
    ["city", 100],
  ] as const) {
    const v = body[key] as string | undefined;
    if (v && v.length > max) return { ok: false, error: `${key === "country" ? "国家" : "城市"}不能超过 ${max} 个字符` };
  }

  const note = body.note as string | undefined;
  if (note && note.length > 2000) return { ok: false, error: "地点备注不能超过 2000 个字符" };

  return { ok: true };
}

/** 消费输入校验 */
export function validateExpenseInput(body: Record<string, unknown>): ValidationResult {
  const amount = Number(body.amount);
  if (body.amount == null || isNaN(amount)) return { ok: false, error: "金额不能为空" };
  if (amount <= 0) return { ok: false, error: "金额必须大于 0" };
  if (amount > 10_000_000) return { ok: false, error: "金额超出允许范围" };

  const category = body.category as string | undefined;
  if (!category || !(EXPENSE_CATEGORIES as readonly string[]).includes(category))
    return { ok: false, error: "消费分类不合法" };

  const date = body.date ? parseDateInput(body.date) : null;
  if (!date) return { ok: false, error: "消费时间不能为空或格式不正确" };

  const note = body.note as string | undefined;
  if (note && note.length > 500) return { ok: false, error: "备注不能超过 500 个字符" };

  return { ok: true };
}
