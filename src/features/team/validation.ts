import { z } from "zod";

const firmRoleSchema = z.enum(["admin", "lawyer", "paralegal", "read_only"], {
  message: "Seleccioná un rol válido."
});

export const assignCaseMemberSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa."),
  profileId: z.string().uuid("Seleccioná un integrante del equipo."),
  role: z
    .string()
    .trim()
    .min(1, "El rol de asignación es obligatorio.")
    .max(80, "El rol de asignación es demasiado largo.")
});

export const removeCaseAssignmentSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa."),
  profileId: z.string().uuid("Seleccioná un integrante del equipo.")
});

export const updateFirmMemberRoleSchema = z.object({
  profileId: z.string().uuid("Seleccioná un integrante del equipo."),
  role: firmRoleSchema
});

export const deactivateFirmMemberSchema = z.object({
  profileId: z.string().uuid("Seleccioná un integrante del equipo.")
});

export const inviteFirmMemberSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(120, "El nombre visible es demasiado largo.")
    .optional()
    .transform((value) => (value ? value : null)),
  email: z.email("Ingresá un email válido.").trim().toLowerCase(),
  role: firmRoleSchema
});

export type AssignCaseMemberInput = z.infer<typeof assignCaseMemberSchema>;
export type DeactivateFirmMemberInput = z.infer<typeof deactivateFirmMemberSchema>;
export type InviteFirmMemberInput = z.infer<typeof inviteFirmMemberSchema>;
export type RemoveCaseAssignmentInput = z.infer<typeof removeCaseAssignmentSchema>;
export type UpdateFirmMemberRoleInput = z.infer<typeof updateFirmMemberRoleSchema>;
