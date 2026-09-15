"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** 旅行列表筛选栏：关键词搜索 + 年份（URL query 驱动） */
export default function TripFilter({ years }: { years: number[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function apply(nextQ: string, nextYear: string) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextYear) params.set("year", nextYear);
    const qs = params.toString();
    router.push(qs ? `/trips?${qs}` : "/trips");
  }

  const selectCls =
    "px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex items-center gap-2">
      <input
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        placeholder="搜索标题 / 目的地..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") apply(q, sp.get("year") ?? "");
        }}
      />
      <select
        className={selectCls}
        value={sp.get("year") ?? ""}
        onChange={(e) => apply(q, e.target.value)}
      >
        <option value="">全部年份</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>
      {(sp.get("q") || sp.get("year")) && (
        <button
          onClick={() => {
            setQ("");
            router.push("/trips");
          }}
          className="text-blue-600 hover:underline text-sm"
        >
          清除
        </button>
      )}
    </div>
  );
}
