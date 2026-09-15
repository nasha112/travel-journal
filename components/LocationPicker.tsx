"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";

const pickIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** 地图内部组件：监听点击并回调坐标 */
function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * 地图选点组件：点击地图选择经纬度
 * 用于添加打卡地点时定位坐标
 */
export default function LocationPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const [local] = useState<[number, number] | null>(
    lat != null && lng != null ? [lat, lng] : null
  );

  const center: [number, number] = local ?? [34.5, 108.9];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 border-b border-gray-200">
        🗺️ 点击地图标记地点坐标
      </div>
      <div className="h-56 relative">
        <MapContainer center={center} zoom={local ? 8 : 4} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={onPick} />
          {local && <Marker position={local} icon={pickIcon} />}
        </MapContainer>
      </div>
    </div>
  );
}
