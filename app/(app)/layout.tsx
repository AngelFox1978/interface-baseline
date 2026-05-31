import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const name = session.email.split("@")[0] || "Admin";

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto flex max-w-[1400px] gap-6">
        <Sidebar userEmail={session.email} />
        <main className="flex-1 space-y-6">
          <Topbar name={name} />
          {children}
        </main>
      </div>
    </div>
  );
}
