"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = {
  message: string | null;
};

export async function signInAction(_state: SignInState, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!email || !password) {
    return { message: "Ingresá tu email y contraseña." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: "No se pudo ingresar. Revisá tu invitación y credenciales." };
  }

  redirect(next.startsWith("/app") ? next : "/app");
}
