"use server";

import { assignCaseMemberSchema } from "@/features/team/validation";
import { toUserMessage } from "@/lib/server/errors";
import { assignCaseMember } from "@/lib/server/team";

export type AssignCaseMemberFormState = {
  message: string | null;
  ok: boolean;
};

export async function assignCaseMemberAction(
  _state: AssignCaseMemberFormState,
  formData: FormData
) {
  const parsed = assignCaseMemberSchema.safeParse({
    caseId: formData.get("caseId"),
    profileId: formData.get("profileId"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Check the assignment fields.",
      ok: false
    };
  }

  try {
    await assignCaseMember(parsed.data);
    return { message: "Case access assigned.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}
