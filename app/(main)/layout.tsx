import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🧭</span>
              <span className="font-bold text-gray-800 text-lg tracking-tight">旅行足迹</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                足迹地图
              </Link>
              <Link href="/trips" className="text-gray-600 hover:text-blue-600 transition-colors">
                我的旅行
              </Link>
            </nav>
          </div>
          <UserMenu name={user.name} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
