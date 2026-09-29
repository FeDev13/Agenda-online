"use server";

import { redirect } from "next/navigation";

import { sanitizeProtectedNextPath } from "@/lib/routes";
import { requireUser } from "@/lib/server/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MfaVerifyState = {
  message: string | null;
};

export async function verifyMfaAction(_state: MfaVerifyState, formData: FormData) {
  await requireUser();

  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const next = sanitizeProtectedNextPath(String(formData.get("next") ?? "/app"));

  if (!factorId || !/^\d{6}$/.test(code)) {
    return { message: "Ingresá el código de 6 dígitos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  const isVerifiedFactor = (factors?.totp ?? []).some((factor) => factor.id === factorId);

  if (factorsError || !isVerifiedFactor) {
    return { message: "Seleccioná un segundo factor válido." };
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    code,
    factorId
  });

  if (error) {
    return { message: "No se pudo verificar el código." };
  }

  redirect(next);
}
