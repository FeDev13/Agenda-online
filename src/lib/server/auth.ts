import "server-only";

import { redirect } from "next/navigation";

import type { ActiveMembership } from "@/lib/domain/authorization";
import { isActiveMembership } from "@/lib/domain/authorization";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  displayName: string | null;
  email: string;
  membership: ActiveMembership | null;
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
      .select("display_name,email")
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
    email: profile?.email ?? user.email ?? "Unknown user",
    membership
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
    throw new UserFacingError("Your account is not attached to an active firm invite.");
  }

  return { membership: user.membership, user };
}
