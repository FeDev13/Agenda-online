"use server";

import { headers } from "next/headers";

import { passwordResetRequestSchema } from "@/features/auth/password-recovery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordResetRequestState = {
  message: string | null;
  ok: boolean;
};

const genericRecoveryMessage =
  "Si el email corresponde a una cuenta invitada, vas a recibir un enlace para recuperar el acceso.";

export async function requestPasswordResetAction(
  _state: PasswordResetRequestState,
  formData: FormData
) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Ingresá un email válido.",
      ok: false
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: await getRecoveryRedirectUrl()
    });
  } catch {
    // Keep the client response generic so recovery cannot enumerate accounts.
  }

  return {
    message: genericRecoveryMessage,
    ok: true
  };
}

async function getRecoveryRedirectUrl() {
  const requestHeaders = await headers();
  const baseUrl = process.env.APP_BASE_URL ?? requestHeaders.get("origin");

  if (!baseUrl) {
    return undefined;
  }

  try {
    return new URL("/auth/callback/reset-password", baseUrl).toString();
  } catch {
    return undefined;
  }
}
