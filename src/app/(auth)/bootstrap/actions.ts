"use server";

import { bootstrapFirmSchema } from "@/features/bootstrap/validation";
import { bootstrapFirm } from "@/lib/server/bootstrap";
import { toUserMessage } from "@/lib/server/errors";

export type BootstrapFirmFormState = {
  message: string | null;
  ok: boolean;
};

export async function bootstrapFirmAction(
  _state: BootstrapFirmFormState,
  formData: FormData
) {
  const parsed = bootstrapFirmSchema.safeParse({
    adminDisplayName: formData.get("adminDisplayName"),
    adminEmail: formData.get("adminEmail"),
    bootstrapToken: formData.get("bootstrapToken"),
    defaultTimezone: formData.get("defaultTimezone"),
    firmName: formData.get("firmName")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos de bootstrap.",
      ok: false
    };
  }

  try {
    await bootstrapFirm(parsed.data);
    return {
      message: "Estudio creado. La invitación administradora fue registrada.",
      ok: true
    };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}
