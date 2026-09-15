"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LOCATION_TYPES, LOCATION_TYPE_LABELS } from "@/lib/utils";

// Leaflet 只能在浏览器端运行，SSR 时跳过
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

/** 添加打卡地点表单（含地图选点） */
export default function LocationForm({ dayId }: { dayId: number }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    country: "",
    city: "",
    type: "",
    note: "",
  });
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("请填写地点名称");
      return;
    }
    if (coords.lat == null || coords.lng == null) {
      setError("请在地图上点击选择地点坐标");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/days/${dayId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lat: coords.lat, lng: coords.lng }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "添加失败");
        return;
      }
      setForm({ name: "", country: "", city: "", type: "", note: "" });
      setCoords({ lat: null, lng: null });
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">📍 添加打卡地点</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地点名称 <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="例如：丽江古城"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地点类型</label>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
            >
              <option value="">选择类型</option>
              {LOCATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LOCATION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">国家</label>
            <input
              className={inputCls}
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="中国"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <input
              className={inputCls}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="丽江"
            />
          </div>
        </div>

        {/* 地图选点 */}
        <LocationPicker
          lat={coords.lat}
          lng={coords.lng}
          onPick={(lat, lng) => setCoords({ lat, lng })}
        />
        {coords.lat != null && coords.lng != null && (
          <p className="text-xs text-blue-600">
            已选坐标：{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <input
            className={inputCls}
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            placeholder="可选的补充说明"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          {loading ? "添加中..." : "添加地点"}
        </button>
      </form>
    </div>
  );
}
