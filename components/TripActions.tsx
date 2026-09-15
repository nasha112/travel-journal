"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TripActions({ tripId, onDeleted }: { tripId: number; onDeleted?: () => void }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/trips");
        router.refresh();
      } else {
        setConfirming(false);
        alert("删除失败，请稍后重试");
      }
    } catch {
      setConfirming(false);
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/trips/${tripId}/edit`}
        className="text-sm text-gray-600 hover:text-blue-600 border border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
      >
        编辑
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
          confirming
            ? "bg-red-600 text-white border-red-600"
            : "text-red-600 border-red-200 hover:bg-red-50"
        }`}
      >
        {deleting ? "删除中..." : confirming ? "确认删除？" : "删除"}
      </button>
    </div>
  );
}
