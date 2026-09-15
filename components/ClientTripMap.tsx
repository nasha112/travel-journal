"use client";

import dynamic from "next/dynamic";

// Leaflet 只能在浏览器端运行：该包装组件确保地图模块只在客户端加载
export default dynamic(() => import("@/components/TripMap"), { ssr: false });
