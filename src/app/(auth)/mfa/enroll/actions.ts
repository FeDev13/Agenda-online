"use server";

import { redirect } from "next/navigation";

import { sanitizeProtectedNextPath } from "@/lib/routes";
import { requireUser } from "@/lib/server/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MfaEnrollState = {
  enrollment: {
    factorId: string;
    qrCodeDataUrl: string;
    secret: string;
  } | null;
  message: string | null;
};

export type MfaVerifyEnrollmentState = {
  message: string | null;
};

export async function startMfaEnrollmentAction(): Promise<MfaEnrollState> {
  await requireUser();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Agenda Legal"
  });

  if (error) {
    return {
      enrollment: null,
      message: "No se pudo generar el segundo factor."
    };
  }

  return {
    enrollment: {
      factorId: data.id,
      qrCodeDataUrl: toSvgDataUrl(data.totp.qr_code),
      secret: data.totp.secret
    },
    message: null
  };
}

function toSvgDataUrl(qrCode: string) {
  if (qrCode.startsWith("data:")) {
    return qrCode;
  }

  return `data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`;
}

export async function verifyMfaEnrollmentAction(
  _state: MfaVerifyEnrollmentState,
  formData: FormData
) {
  await requireUser();

  const factorId = String(formData.get("factorId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const next = sanitizeProtectedNextPath(String(formData.get("next") ?? "/app"));

  if (!factorId || !/^\d{6}$/.test(code)) {
    return { message: "Ingresá el código de 6 dígitos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    code,
    factorId
  });

  if (error) {
    return { message: "No se pudo verificar el código." };
  }

  redirect(next);
}
