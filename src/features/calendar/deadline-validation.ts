import { z } from "zod";
import { dateOnlySchema } from "@/features/cases/validation";

export const createDeadlineSchema = z.object({
  caseId: z.uuid("Seleccioná una causa."),
  title: z.string().trim().min(1, "Ingresá el título.").max(220),
  dueOn: dateOnlySchema,
  ruleSource: z.string().trim().min(1, "Indicá la fuente de la fecha.").max(1000),
  confirmed: z.literal("on", { error: "Confirmá que revisaste la fecha y su fuente." })
});

export const updateDeadlineStatusSchema = z.object({
  deadlineId: z.uuid(),
  status: z.enum(["pending", "completed", "cancelled"]),
  expectedRevision: z
    .union([z.number(), z.string().regex(/^(0|[1-9]\d*)$/)])
    .transform(Number)
    .pipe(z.number().int().min(0).max(2147483647))
});
