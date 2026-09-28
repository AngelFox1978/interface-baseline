import { redirect } from "next/navigation";
import { Toaster } from "sonner";
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
        <Sidebar
          userEmail={session.email}
          isAdmin={session.role === "admin"}
        />
        {/* min-w-0 : sans lui, un flex-item refuse de rétrécir sous la largeur
            intrinsèque de son contenu et toute la page déborde en mobile. */}
        <main className="min-w-0 flex-1 space-y-6">
          <Topbar name={name} />
          {children}
        </main>
      </div>
      {/* Toasts globaux (sonner). Stylés via les tokens : suivent le thème .dark. */}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "!rounded-xl !border !bg-card !text-foreground !shadow-sm",
            description: "!text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
