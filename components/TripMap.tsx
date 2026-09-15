"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";
import Link from "next/link";

export type MapPoint = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  city?: string | null;
  hasBlog: boolean;
  /** 游玩顺序序号（1,2,3...），有值时图标显示数字 */
  order?: number;
};

/** 自定义标记：蓝色=有游记，橙色=无游记；带序号时显示数字 */
function makeIcon(hasBlog: boolean, order?: number) {
  const bg = hasBlog ? "#2563eb" : "#f59e0b";
  const size = order != null ? 24 : 16;
  const anchor = size / 2;
  const html = order != null
    ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;line-height:1;font-family:inherit">${order}</div>`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`;
  return L.divIcon({
    className: "",
    html,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor - 4],
  });
}

/** 路径方向箭头层 */
function ArrowLayer({ lines }: { lines: [number, number][][] }) {
  const map = useMap();

  useEffect(() => {
    const decorators = lines.map((line) => {
      // leaflet-polylinedecorator 的类型签名与运行时接受的数据不一致，这里做宽松转换
      const deco = (L as unknown as {
        polylineDecorator: (
          paths: unknown,
          options: unknown
        ) => { addTo: (map: unknown) => unknown; remove: () => void };
      }).polylineDecorator(line, {
        patterns: [
          {
            offset: "18%",
            repeat: "90px",
            symbol: (L.Symbol as unknown as {
              arrowHead: (opts: Record<string, unknown>) => unknown;
            }).arrowHead({
              pixelSize: 10,
              polygon: false,
              pathOptions: { stroke: true, color: "#2563eb", weight: 2, opacity: 0.85 },
            }),
          },
        ],
      });
      deco.addTo(map);
      return deco;
    });

    return () => {
      decorators.forEach((d) => d.remove());
    };
  }, [map, lines]);

  return null;
}

export default function TripMap({
  points,
  lines = [],
  height = "100%",
}: {
  points: MapPoint[];
  /** 路线连线：每趟旅行一条线，由经纬度数组组成 */
  lines?: [number, number][][];
  height?: string;
}) {
  // 防止 SSR 时 window 未定义（调用方已用 dynamic 包裹，此处双保险）
  if (typeof window === "undefined") return <div className="w-full h-full bg-gray-100" />;

  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : [34.5, 108.9]; // 默认中国中部

  return (
    <div style={{ height }}>
      <MapContainer
        center={center}
        zoom={points.length > 1 ? 4 : 12}
        className="w-full h-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* 路径底：虚线 */}
        {lines.map((line, i) => (
          <Polyline
            key={`line-${i}`}
            positions={line}
            pathOptions={{ color: "#2563eb", weight: 2.5, dashArray: "8 6", opacity: 0.55 }}
          />
        ))}
        {/* 方向箭头 */}
        <ArrowLayer lines={lines} />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={makeIcon(p.hasBlog, p.order)}>
            <Popup>
              <div className="text-sm min-w-32">
                <div className="font-semibold text-gray-800">
                  {p.order != null && <span className="text-blue-600 mr-1">{p.order}.</span>}
                  {p.name}
                </div>
                {p.city && <div className="text-gray-500 text-xs mt-0.5">📍 {p.city}</div>}
                <Link
                  href={`/locations/${p.id}/blog`}
                  className={`inline-block mt-1.5 text-xs underline ${p.hasBlog ? "text-blue-600" : "text-amber-600"}`}
                >
                  {p.hasBlog ? "查看游记" : "写游记"}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
