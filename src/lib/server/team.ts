import "server-only";

import { revalidatePath } from "next/cache";

import type { AssignCaseMemberInput } from "@/features/team/validation";
import { canManageCaseAssignments } from "@/lib/domain/authorization";
import { requireActiveMembership } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FirmRole, MembershipStatus } from "@/types/database";

export type FirmMemberSummary = {
  assignmentCount: number;
  displayName: string | null;
  email: string;
  profileId: string;
  role: FirmRole;
  status: MembershipStatus;
};

export type CaseAssignmentSummary = {
  assignedAt: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  displayName: string | null;
  email: string;
  profileId: string;
  role: string;
};

type MembershipRow = {
  profile_id: string;
  role: FirmRole;
  status: MembershipStatus;
};

type ProfileRow = {
  display_name: string | null;
  email: string;
  id: string;
};

type CaseMemberRow = {
  assigned_at: string;
  case_id: string;
  profile_id: string;
  role: string;
};

type CaseRow = {
  case_number: string;
  id: string;
  title: string;
};

export async function listFirmMembers(): Promise<FirmMemberSummary[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const [{ data: memberships, error }, { data: assignments, error: assignmentsError }] =
    await Promise.all([
      supabase
        .from("firm_memberships")
        .select("profile_id,role,status")
        .eq("firm_id", membership.firmId)
        .eq("status", "active")
        .order("role", { ascending: true }),
      supabase.from("case_members").select("profile_id").eq("firm_id", membership.firmId)
    ]);

  if (error || assignmentsError) {
    throw new UserFacingError("Team members could not be loaded.");
  }

  const rows = (memberships ?? []) as MembershipRow[];
  const profileIds = rows.map((row) => row.profile_id);

  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase.from("profiles").select("id,display_name,email").in("id", profileIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new UserFacingError("Team members could not be loaded.");
  }

  const profilesById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  );
  const assignmentCounts = new Map<string, number>();

  for (const assignment of (assignments ?? []) as Pick<CaseMemberRow, "profile_id">[]) {
    assignmentCounts.set(
      assignment.profile_id,
      (assignmentCounts.get(assignment.profile_id) ?? 0) + 1
    );
  }

  return rows.map((row) => {
    const profile = profilesById.get(row.profile_id);

    return {
      assignmentCount: assignmentCounts.get(row.profile_id) ?? 0,
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? "Unknown email",
      profileId: row.profile_id,
      role: row.role,
      status: row.status
    };
  });
}

export async function listCaseAssignments(): Promise<CaseAssignmentSummary[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data: assignments, error } = await supabase
    .from("case_members")
    .select("case_id,profile_id,role,assigned_at")
    .eq("firm_id", membership.firmId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new UserFacingError("Case assignments could not be loaded.");
  }

  const rows = (assignments ?? []) as CaseMemberRow[];
  const caseIds = [...new Set(rows.map((row) => row.case_id))];
  const profileIds = [...new Set(rows.map((row) => row.profile_id))];

  const [{ data: cases, error: casesError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      caseIds.length
        ? supabase
            .from("cases")
            .select("id,case_number,title")
            .eq("firm_id", membership.firmId)
            .in("id", caseIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length
        ? supabase.from("profiles").select("id,display_name,email").in("id", profileIds)
        : Promise.resolve({ data: [], error: null })
    ]);

  if (casesError || profilesError) {
    throw new UserFacingError("Case assignments could not be loaded.");
  }

  const casesById = new Map(
    ((cases ?? []) as CaseRow[]).map((caseItem) => [caseItem.id, caseItem])
  );
  const profilesById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  );

  return rows.map((row) => {
    const caseItem = casesById.get(row.case_id);
    const profile = profilesById.get(row.profile_id);

    return {
      assignedAt: row.assigned_at,
      caseId: row.case_id,
      caseNumber: caseItem?.case_number ?? "Case",
      caseTitle: caseItem?.title ?? "Restricted case",
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? "Unknown email",
      profileId: row.profile_id,
      role: row.role
    };
  });
}

export async function assignCaseMember(input: AssignCaseMemberInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseAssignments(membership.role)) {
    throw new UserFacingError("Only admins and lawyers can assign case access.");
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: targetMembership }, { data: targetCase }] = await Promise.all([
    supabase
      .from("firm_memberships")
      .select("profile_id")
      .eq("firm_id", membership.firmId)
      .eq("profile_id", input.profileId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("cases")
      .select("id")
      .eq("firm_id", membership.firmId)
      .eq("id", input.caseId)
      .eq("status", "open")
      .maybeSingle()
  ]);

  if (!targetMembership || !targetCase) {
    throw new UserFacingError("Select an active firm member and open case.");
  }

  const { error } = await supabase.from("case_members").upsert(
    {
      assigned_by: user.id,
      case_id: input.caseId,
      firm_id: membership.firmId,
      profile_id: input.profileId,
      role: input.role
    },
    { onConflict: "firm_id,case_id,profile_id" }
  );

  if (error) {
    throw new UserFacingError("Case access could not be assigned.");
  }

  revalidatePath("/app/team");
  revalidatePath("/app/cases");
  revalidatePath("/app/calendar");
}
