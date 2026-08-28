import { z } from "zod";

export const assignCaseMemberSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa."),
  profileId: z.string().uuid("Seleccioná un integrante del equipo."),
  role: z
    .string()
    .trim()
    .min(1, "El rol de asignación es obligatorio.")
    .max(80, "El rol de asignación es demasiado largo.")
});

export type AssignCaseMemberInput = z.infer<typeof assignCaseMemberSchema>;
