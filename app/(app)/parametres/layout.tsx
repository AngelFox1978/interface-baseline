import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Page Paramètres réservée au rôle admin. Les autres utilisateurs sont
// renvoyés vers l'accueil (l'entrée est aussi masquée dans la sidebar,
// mais l'URL directe doit être bloquée côté serveur).
export default async function ParametresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/accueil");
  return <>{children}</>;
}
