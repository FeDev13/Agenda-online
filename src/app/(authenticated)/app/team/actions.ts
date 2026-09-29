"use server";

import {
  assignCaseMemberSchema,
  deactivateFirmMemberSchema,
  inviteFirmMemberSchema,
  removeCaseAssignmentSchema,
  updateFirmMemberRoleSchema
} from "@/features/team/validation";
import { toUserMessage } from "@/lib/server/errors";
import {
  assignCaseMember,
  deactivateFirmMember,
  inviteFirmMember,
  removeCaseAssignment,
  updateFirmMemberRole
} from "@/lib/server/team";

export type AssignCaseMemberFormState = {
  message: string | null;
  ok: boolean;
};

export type InviteFirmMemberFormState = {
  message: string | null;
  ok: boolean;
};

export async function inviteFirmMemberAction(
  _state: InviteFirmMemberFormState,
  formData: FormData
) {
  const parsed = inviteFirmMemberSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos de la invitación.",
      ok: false
    };
  }

  try {
    await inviteFirmMember(parsed.data);
    return { message: "Invitación registrada.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

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
      message: parsed.error.issues[0]?.message ?? "Revisá los datos de la asignación.",
      ok: false
    };
  }

  try {
    await assignCaseMember(parsed.data);
    return { message: "Acceso a la causa asignado.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

export async function removeCaseAssignmentAction(formData: FormData) {
  const parsed = removeCaseAssignmentSchema.safeParse({
    caseId: formData.get("caseId"),
    profileId: formData.get("profileId")
  });

  if (!parsed.success) {
    return;
  }

  await removeCaseAssignment(parsed.data);
}

export async function updateFirmMemberRoleAction(formData: FormData) {
  const parsed = updateFirmMemberRoleSchema.safeParse({
    profileId: formData.get("profileId"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return;
  }

  await updateFirmMemberRole(parsed.data);
}

export async function deactivateFirmMemberAction(formData: FormData) {
  const parsed = deactivateFirmMemberSchema.safeParse({
    profileId: formData.get("profileId")
  });

  if (!parsed.success) {
    return;
  }

  await deactivateFirmMember(parsed.data);
}
