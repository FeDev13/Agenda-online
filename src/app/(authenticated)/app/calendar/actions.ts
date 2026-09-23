"use server";

import { createEventSchema } from "@/features/cases/validation";
import { toUserMessage } from "@/lib/server/errors";
import { createEvent } from "@/lib/server/scheduling";

export type ScheduleFormState = {
  message: string | null;
  ok: boolean;
};

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
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos del evento.",
      ok: false
    };
  }

  try {
    await createEvent(parsed.data);
    return { message: "Evento creado.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}
