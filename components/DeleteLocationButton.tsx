"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteLocationButton({ locationId }: { locationId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/locations/${locationId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        setConfirming(false);
        alert("删除失败");
      }
    } catch {
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
        confirming
          ? "bg-red-600 text-white border-red-600"
          : "text-red-500 border-red-200 hover:bg-red-50"
      }`}
    >
      {loading ? "删除中..." : confirming ? "确认？" : "删除"}
    </button>
  );
}
