"use server";

import {
  assignCaseMemberSchema,
  deactivateFirmMemberSchema,
  inviteFirmMemberSchema,
  removeCaseAssignmentSchema,
  resetFirmMemberMfaSchema,
  updateFirmMemberRoleSchema
} from "@/features/team/validation";
import type { ActionResult } from "@/types/action-result";
import { validationFailure } from "@/lib/server/form-validation";
import { toUserMessage } from "@/lib/server/errors";
import {
  assignCaseMember,
  deactivateFirmMember,
  inviteFirmMember,
  removeCaseAssignment,
  resetFirmMemberMfa,
  updateFirmMemberRole
} from "@/lib/server/team";

export type AssignCaseMemberFormState = ActionResult;

export type InviteFirmMemberFormState = ActionResult;

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
    return validationFailure(parsed.error);
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
    return validationFailure(parsed.error);
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
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await removeCaseAssignment(parsed.data);
    return { ok: true, message: "Acceso a causa removido." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateFirmMemberRoleAction(formData: FormData) {
  const parsed = updateFirmMemberRoleSchema.safeParse({
    profileId: formData.get("profileId"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await updateFirmMemberRole(parsed.data);
    return { ok: true, message: "Rol actualizado." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function deactivateFirmMemberAction(formData: FormData) {
  const parsed = deactivateFirmMemberSchema.safeParse({
    profileId: formData.get("profileId")
  });

  if (!parsed.success) {
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await deactivateFirmMember(parsed.data);
    return { ok: true, message: "Integrante desactivado." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function resetFirmMemberMfaAction(formData: FormData) {
  const parsed = resetFirmMemberMfaSchema.safeParse({
    profileId: formData.get("profileId")
  });

  if (!parsed.success) {
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await resetFirmMemberMfa(parsed.data);
    return { ok: true, message: "MFA restablecido." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
