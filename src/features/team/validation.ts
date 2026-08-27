import { z } from "zod";

export const assignCaseMemberSchema = z.object({
  caseId: z.string().uuid("Select a case."),
  profileId: z.string().uuid("Select a team member."),
  role: z
    .string()
    .trim()
    .min(1, "Assignment role is required.")
    .max(80, "Assignment role is too long.")
});

export type AssignCaseMemberInput = z.infer<typeof assignCaseMemberSchema>;
