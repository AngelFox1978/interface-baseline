"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, SESSION_COOKIE } from "@/lib/auth";

export type LoginState = { error?: string } | null;

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

  const ok =
    !!adminEmail &&
    !!hash &&
    email === adminEmail &&
    (await bcrypt.compare(password, hash));

  if (!ok) {
    return { error: "invalid" };
  }

  const token = await signSession({ email, role: "admin" });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
