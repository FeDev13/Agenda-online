import "server-only";

import type { ZodError } from "zod";
import type { ActionResult } from "@/types/action-result";

export function validationFailure(error: ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field])
      fieldErrors[field] = issue.message;
  }
  return {
    ok: false,
    message: Object.keys(fieldErrors).length
      ? "Revisá los campos indicados."
      : (error.issues[0]?.message ?? "Revisá los datos."),
    fieldErrors
  };
}
