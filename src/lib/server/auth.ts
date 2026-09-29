import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActiveMembership } from "@/lib/domain/authorization";
import { isActiveMembership } from "@/lib/domain/authorization";
import { sanitizeProtectedNextPath } from "@/lib/routes";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AppUser = {
  id: string;
  displayName: string | null;
  email: string;
  membership: ActiveMembership | null;
  mfaRequired: boolean;
};

export type MfaStatus = {
  currentLevel: string | null;
  mfaRequired: boolean;
  needsEnrollment: boolean;
  needsVerification: boolean;
  verifiedTotpFactors: Array<{
    friendly_name?: string;
    id: string;
  }>;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,email,mfa_required")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("firm_memberships")
      .select("firm_id,profile_id,role,status")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .limit(1)
  ]);

  const membershipRow = memberships?.[0];
  const membership: ActiveMembership | null =
    membershipRow && isActiveMembership(membershipRow)
      ? {
          firmId: membershipRow.firm_id,
          profileId: membershipRow.profile_id,
          role: membershipRow.role,
          status: membershipRow.status
        }
      : null;

  return {
    id: user.id,
    displayName: profile?.display_name ?? null,
    email: profile?.email ?? user.email ?? "Usuario no identificado",
    membership,
    mfaRequired: profile?.mfa_required ?? true
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export async function requireActiveMembership() {
  const user = await requireUser();

  if (!user.membership) {
    throw new UserFacingError(
      "Tu cuenta no está vinculada a una invitación activa del estudio."
    );
  }

  return { membership: user.membership, user };
}

export async function getMfaStatus(
  user: Pick<AppUser, "mfaRequired">,
  supabase?: SupabaseClient<Database>
): Promise<MfaStatus> {
  if (!user.mfaRequired) {
    return {
      currentLevel: null,
      mfaRequired: false,
      needsEnrollment: false,
      needsVerification: false,
      verifiedTotpFactors: []
    };
  }

  const client = supabase ?? (await createSupabaseServerClient());
  const [assuranceResult, factorsResult] = await Promise.all([
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
    client.auth.mfa.listFactors()
  ]);

  if (assuranceResult.error || factorsResult.error) {
    throw new UserFacingError("No se pudo validar el segundo factor.");
  }

  const verifiedTotpFactors = (factorsResult.data?.totp ?? []).map((factor) => ({
    friendly_name: factor.friendly_name,
    id: factor.id
  }));
  const currentLevel = assuranceResult.data?.currentLevel ?? null;
  const needsEnrollment = verifiedTotpFactors.length === 0;
  const needsVerification = !needsEnrollment && currentLevel !== "aal2";

  return {
    currentLevel,
    mfaRequired: true,
    needsEnrollment,
    needsVerification,
    verifiedTotpFactors
  };
}

export function getMfaRedirectPath(status: MfaStatus, next: string) {
  if (!status.mfaRequired) {
    return null;
  }

  const safeNext = encodeURIComponent(sanitizeProtectedNextPath(next));

  if (status.needsEnrollment) {
    return `/mfa/enroll?next=${safeNext}`;
  }

  if (status.needsVerification) {
    return `/mfa/verify?next=${safeNext}`;
  }

  return null;
}

export async function requireMfaVerified(next = "/app") {
  const user = await requireUser();
  const status = await getMfaStatus(user);
  const redirectPath = getMfaRedirectPath(status, next);

  if (redirectPath) {
    redirect(redirectPath);
  }

  return user;
}
