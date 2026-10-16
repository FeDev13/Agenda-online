"use server";

import {
  archiveCaseSchema,
  createCaseSchema,
  permanentlyDeleteCaseSchema
} from "@/features/cases/validation";
import { archiveCase, createCase, permanentlyDeleteCase } from "@/lib/server/cases";
import type { ActionResult } from "@/types/action-result";
import { validationFailure } from "@/lib/server/form-validation";
import { toUserMessage } from "@/lib/server/errors";

export type CaseFormState = ActionResult;

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
    return validationFailure(parsed.error);
  }

  try {
    await createCase(parsed.data);
    return { message: "Causa creada.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

export async function archiveCaseAction(formData: FormData) {
  const parsed = archiveCaseSchema.safeParse({
    caseId: formData.get("caseId")
  });

  if (!parsed.success) {
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await archiveCase(parsed.data);
    return { ok: true, message: "Causa archivada." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function permanentlyDeleteCaseAction(
  _state: CaseFormState,
  formData: FormData
) {
  const parsed = permanentlyDeleteCaseSchema.safeParse({
    caseId: formData.get("caseId"),
    caseNumber: formData.get("caseNumber"),
    confirmation: formData.get("confirmation")
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    await permanentlyDeleteCase(parsed.data);
    return { message: "Causa eliminada definitivamente.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}
