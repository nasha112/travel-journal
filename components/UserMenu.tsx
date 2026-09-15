"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({ name }: { name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 hidden sm:block">
        <span className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-1.5">
          {name.charAt(0).toUpperCase()}
        </span>
        {name}
      </span>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50 transition-colors"
      >
        {loading ? "退出中..." : "退出登录"}
      </button>
    </div>
  );
}
