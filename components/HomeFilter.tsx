"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LOCATION_TYPES, LOCATION_TYPE_LABELS } from "@/lib/utils";

/** 首页足迹地图筛选栏：年份 + 地点类型（URL query 驱动） */
export default function HomeFilter({ years }: { years: number[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const year = sp.get("year") ?? "";
  const type = sp.get("type") ?? "";

  function apply(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/?${params.toString()}`);
  }

  const selectCls =
    "px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="text-gray-400">筛选：</span>
      <select className={selectCls} value={year} onChange={(e) => apply("year", e.target.value)}>
        <option value="">全部年份</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>
      <select className={selectCls} value={type} onChange={(e) => apply("type", e.target.value)}>
        <option value="">全部类型</option>
        {LOCATION_TYPES.map((t) => (
          <option key={t} value={t}>
            {LOCATION_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      {(year || type) && (
        <button
          onClick={() => {
            const params = new URLSearchParams();
            router.push(`/?${params.toString()}`);
          }}
          className="text-blue-600 hover:underline"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
