import { TRIP_STATUS_LABELS } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-600 border-gray-200",
  ONGOING: "bg-blue-50 text-blue-600 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

/** 旅行状态徽标：计划中 / 进行中 / 已完成 */
export default function TripStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0 ${
        STATUS_STYLES[status] ?? STATUS_STYLES.PLANNED
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block"></span>
      {TRIP_STATUS_LABELS[status] ?? status}
    </span>
  );
}
