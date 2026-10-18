"use server";

import { saveFeeEstimate } from "@/lib/server/honorarios";
import { toUserMessage } from "@/lib/server/errors";
import type { ActionResult } from "@/types/action-result";

export async function saveFeeEstimateAction(formData: FormData): Promise<ActionResult> {
  try {
    await saveFeeEstimate({
      caseId: formData.get("caseId"),
      currency: formData.get("currency"),
      amount: formData.get("amount"),
      expectedRevision: formData.get("expectedRevision")
    });
    return { ok: true, message: "Honorario guardado." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
