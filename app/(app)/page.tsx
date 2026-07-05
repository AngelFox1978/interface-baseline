import { redirect } from "next/navigation";

// La console démarre sur le Radar : la racine y redirige.
export default function Home() {
  redirect("/radar");
}
