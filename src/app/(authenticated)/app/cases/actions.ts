"use server";

import { createCaseSchema } from "@/features/cases/validation";
import { createCase } from "@/lib/server/cases";
import { toUserMessage } from "@/lib/server/errors";

export type CaseFormState = {
  message: string | null;
  ok: boolean;
};

export async function createCaseAction(_state: CaseFormState, formData: FormData) {
  const parsed = createCaseSchema.safeParse({
    caseNumber: formData.get("caseNumber"),
    clientName: formData.get("clientName"),
    court: formData.get("court"),
    description: formData.get("description"),
    docketNumber: formData.get("docketNumber"),
    jurisdiction: formData.get("jurisdiction"),
    openedOn: formData.get("openedOn"),
    title: formData.get("title")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos de la causa.",
      ok: false
    };
  }

  try {
    await createCase(parsed.data);
    return { message: "Causa creada.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}
