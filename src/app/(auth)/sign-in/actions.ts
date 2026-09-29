"use server";

import { redirect } from "next/navigation";

import { sanitizeProtectedNextPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = {
  message: string | null;
};

export async function signInAction(_state: SignInState, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeProtectedNextPath(String(formData.get("next") ?? "/app"));

  if (!email || !password) {
    return { message: "Ingresá tu email y contraseña." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: "No se pudo ingresar. Revisá tu invitación y credenciales." };
  }

  const { error: inviteError } = await supabase.rpc("accept_pending_firm_invitations");

  if (inviteError) {
    await supabase.auth.signOut();
    return { message: "No se pudo validar tu invitación. Intentá nuevamente." };
  }

  redirect(next);
}
