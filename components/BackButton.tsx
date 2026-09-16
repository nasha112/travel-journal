"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * 全局返回键：显示在 (main) 布局内容区左上角。
 * - 首页不显示
 * - 页面自身已有返回链接时隐藏（如旅行回顾、行程地图），避免重复
 * - 点击返回上一页（等价浏览器后退）；无历史记录时回退到首页
 */
const HIDE_ON_PATTERNS = [/^\/trips\/\d+\/review$/, /^\/trips\/\d+\/map$/];

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // 首页不需要返回；已有页面级返回链接的页面不重复显示
  if (pathname === "/" || HIDE_ON_PATTERNS.some((p) => p.test(pathname))) return null;

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      onClick={goBack}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4 group"
      aria-label="返回上一页"
    >
      <svg
        className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
          clipRule="evenodd"
        />
      </svg>
      返回
    </button>
  );
}
