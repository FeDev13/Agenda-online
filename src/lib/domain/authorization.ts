import type { FirmRole, MembershipStatus } from "@/types/database";

export type ActiveMembership = {
  firmId: string;
  profileId: string;
  role: FirmRole;
  status: MembershipStatus;
};

export function isActiveMembership(membership: Pick<ActiveMembership, "status">) {
  return membership.status === "active";
}

export function canManageCases(role: FirmRole) {
  return role === "admin" || role === "lawyer";
}

export function canManageScheduling(role: FirmRole) {
  return role === "admin" || role === "lawyer" || role === "paralegal";
}

export function canManageCaseAssignments(role: FirmRole) {
  return role === "admin" || role === "lawyer";
}

export function canManageCaseWork(role: FirmRole) {
  return role === "admin" || role === "lawyer" || role === "paralegal";
}

export function canAccessCase(
  membership: Pick<ActiveMembership, "role" | "status"> | null,
  isAssignedToCase: boolean
) {
  if (!membership || !isActiveMembership(membership)) {
    return false;
  }

  if (membership.role === "admin" || membership.role === "lawyer") {
    return true;
  }

  return isAssignedToCase;
}

export function isSameFirm(
  membership: Pick<ActiveMembership, "firmId" | "status"> | null,
  resourceFirmId: string
) {
  return Boolean(
    membership && isActiveMembership(membership) && membership.firmId === resourceFirmId
  );
}
