import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ConsoleProvider } from "@/components/console/console-provider";

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
          <ConsoleProvider>{children}</ConsoleProvider>
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
