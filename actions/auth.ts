"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import { isLocked, recordFailure, recordSuccess } from "@/lib/rate-limit";

export type LoginState = { error?: string } | null;

// Hash bcrypt factice (mot de passe aléatoire jeté) : quand l'email ne
// correspond pas à ADMIN_EMAIL, on compare quand même contre lui pour que le
// temps de réponse ne révèle pas si l'email existe (timing attack).
const DUMMY_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH || "";

  // Clé de rate limiting : email + IP (première valeur de x-forwarded-for,
  // sinon x-real-ip, sinon « local » en dev direct).
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  const rateKey = `${email}|${ip}`;

  // Verrou vérifié AVANT tout bcrypt.compare : une clé verrouillée ne coûte
  // rien en CPU et répond par un message dédié.
  if (isLocked(rateKey)) {
    return { error: "locked" };
  }

  // bcrypt.compare s'exécute dans tous les cas (hash réel ou factice) pour
  // un temps de réponse constant quel que soit l'email soumis.
  const emailMatches = !!adminEmail && !!hash && email === adminEmail;
  const passwordMatches = await bcrypt.compare(
    password,
    emailMatches ? hash : DUMMY_HASH
  );
  const ok = emailMatches && passwordMatches;

  if (!ok) {
    recordFailure(rateKey);
    return { error: isLocked(rateKey) ? "locked" : "invalid" };
  }

  recordSuccess(rateKey);

  const token = await signSession({ email, role: "admin" });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/accueil");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
