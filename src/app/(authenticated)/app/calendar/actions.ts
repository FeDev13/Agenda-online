"use server";

import {
  createDeadlineSchema,
  updateDeadlineStatusSchema
} from "@/features/calendar/deadline-validation";
import { createDeadline, updateDeadlineStatus } from "@/lib/server/agenda";
import { createEventSchema } from "@/features/cases/validation";
import type { ActionResult } from "@/types/action-result";
import { validationFailure } from "@/lib/server/form-validation";
import { toUserMessage } from "@/lib/server/errors";
import { createEvent } from "@/lib/server/scheduling";

export type ScheduleFormState = ActionResult;

export async function createEventAction(_state: ScheduleFormState, formData: FormData) {
  const parsed = createEventSchema.safeParse({
    caseId: formData.get("caseId"),
    description: formData.get("description"),
    endsAtLocal: formData.get("endsAtLocal"),
    location: formData.get("location"),
    startsAtLocal: formData.get("startsAtLocal"),
    timezone: formData.get("timezone"),
    title: formData.get("title")
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    await createEvent(parsed.data);
    return { message: "Evento creado.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

export async function createDeadlineAction(
  _state: ScheduleFormState,
  formData: FormData
) {
  const parsed = createDeadlineSchema.safeParse({
    caseId: formData.get("caseId"),
    title: formData.get("title"),
    dueOn: formData.get("dueOn"),
    ruleSource: formData.get("ruleSource"),
    confirmed: formData.get("confirmed")
  });
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    await createDeadline(parsed.data);
    return { ok: true, message: "Vencimiento creado con fecha confirmada." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateDeadlineStatusAction(formData: FormData) {
  const parsed = updateDeadlineStatusSchema.safeParse({
    deadlineId: formData.get("deadlineId"),
    status: formData.get("status"),
    expectedRevision: formData.get("expectedRevision")
  });
  if (!parsed.success) return { ok: false, message: "Revisá los datos del vencimiento." };
  try {
    await updateDeadlineStatus(parsed.data);
    return { ok: true, message: "Estado del vencimiento actualizado." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
