import DayForm from "@/components/DayForm";

export default function NewDayPage({ params }: { params: Promise<{ id: string }> }) {
  return <DayFormWrapper params={params} />;
}

async function DayFormWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DayForm tripId={Number(id)} />;
}
