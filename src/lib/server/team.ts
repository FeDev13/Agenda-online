import "server-only";

import { revalidatePath } from "next/cache";

import type {
  AssignCaseMemberInput,
  DeactivateFirmMemberInput,
  InviteFirmMemberInput,
  RemoveCaseAssignmentInput,
  UpdateFirmMemberRoleInput
} from "@/features/team/validation";
import {
  canManageCaseAssignments,
  canManageFirmMemberships
} from "@/lib/domain/authorization";
import { requireActiveMembership } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FirmRole, Json, MembershipStatus } from "@/types/database";

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

export type AuditEntrySummary = {
  action: string;
  actorEmail: string;
  actorName: string | null;
  createdAt: string;
  id: string;
  metadata: Json;
  targetId: string | null;
  targetTable: string;
};

type MembershipRow = {
  firm_id?: string;
  id: string;
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

type AuditLogRow = {
  action: string;
  actor_profile_id: string | null;
  created_at: string;
  id: string;
  metadata: Json;
  target_id: string | null;
  target_table: string;
};

export async function listFirmMembers(): Promise<FirmMemberSummary[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();
  const canReadInactiveMembers = canManageFirmMemberships(membership.role);

  const [{ data: memberships, error }, { data: assignments, error: assignmentsError }] =
    await Promise.all([
      supabase
        .from("firm_memberships")
        .select("id,profile_id,role,status")
        .eq("firm_id", membership.firmId)
        .in(
          "status",
          canReadInactiveMembers ? ["active", "disabled", "invited"] : ["active"]
        )
        .order("status", { ascending: true })
        .order("role", { ascending: true }),
      supabase.from("case_members").select("profile_id").eq("firm_id", membership.firmId)
    ]);

  if (error || assignmentsError) {
    throw new UserFacingError("No se pudieron cargar los integrantes del equipo.");
  }

  const rows = (memberships ?? []) as MembershipRow[];
  const profileIds = rows.map((row) => row.profile_id);

  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase.from("profiles").select("id,display_name,email").in("id", profileIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new UserFacingError("No se pudieron cargar los integrantes del equipo.");
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
      email: profile?.email ?? "Correo no disponible",
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
    throw new UserFacingError("No se pudieron cargar las asignaciones de causas.");
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
    throw new UserFacingError("No se pudieron cargar las asignaciones de causas.");
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
      caseNumber: caseItem?.case_number ?? "Causa",
      caseTitle: caseItem?.title ?? "Causa restringida",
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? "Correo no disponible",
      profileId: row.profile_id,
      role: row.role
    };
  });
}

export async function listRecentAuditEntries(limit = 20): Promise<AuditEntrySummary[]> {
  const { membership } = await requireActiveMembership();

  if (!canManageCaseAssignments(membership.role)) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id,actor_profile_id,action,target_table,target_id,metadata,created_at")
    .eq("firm_id", membership.firmId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new UserFacingError("No se pudo cargar el registro de auditoría.");
  }

  const rows = (data ?? []) as AuditLogRow[];
  const actorIds = rows
    .map((row) => row.actor_profile_id)
    .filter((actorId): actorId is string => Boolean(actorId));
  const profilesById = await getProfilesById(actorIds);

  return rows.map((row) => {
    const actor = row.actor_profile_id ? profilesById.get(row.actor_profile_id) : null;

    return {
      action: row.action,
      actorEmail: actor?.email ?? "Usuario no identificado",
      actorName: actor?.display_name ?? null,
      createdAt: row.created_at,
      id: row.id,
      metadata: row.metadata,
      targetId: row.target_id,
      targetTable: row.target_table
    };
  });
}

export async function inviteFirmMember(input: InviteFirmMemberInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageFirmMemberships(membership.role)) {
    throw new UserFacingError("Solo administración puede invitar integrantes.");
  }

  const admin = createInviteAdminClient();
  const existingProfile = await findProfileByEmail(input.email);
  const profileId = existingProfile?.id ?? (await inviteAuthUser(input));

  if (input.displayName && !existingProfile?.display_name) {
    await admin
      .from("profiles")
      .update({ display_name: input.displayName })
      .eq("id", profileId);
  }

  const { data: existingMembership, error: membershipLookupError } = await admin
    .from("firm_memberships")
    .select("id,profile_id,role,status")
    .eq("firm_id", membership.firmId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (membershipLookupError) {
    throw new UserFacingError("No se pudo preparar la invitación.");
  }

  if (existingMembership?.status === "active" || existingMembership?.status === "invited") {
    throw new UserFacingError("Ese email ya tiene una invitación o membresía en el estudio.");
  }

  const targetMembership = existingMembership
    ? await reinviteDisabledMember(existingMembership.id, input.role, user.id)
    : await createInvitedMembership(membership.firmId, profileId, input.role, user.id);

  await appendAuditLog(
    membership.firmId,
    user.id,
    existingMembership ? "membership.reinvited" : "membership.invited",
    "firm_memberships",
    targetMembership.id,
    {
      new_role: input.role,
      previous_role: existingMembership?.role ?? null,
      profile_id: profileId
    }
  );
  revalidateTeamSurfaces();
}

export async function assignCaseMember(input: AssignCaseMemberInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseAssignments(membership.role)) {
    throw new UserFacingError(
      "Solo administración y abogados pueden asignar acceso a causas."
    );
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: targetMembership }, { data: targetCase }, { data: existingAssignment }] =
    await Promise.all([
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
        .maybeSingle(),
      supabase
        .from("case_members")
        .select("id,role")
        .eq("firm_id", membership.firmId)
        .eq("case_id", input.caseId)
        .eq("profile_id", input.profileId)
        .maybeSingle()
    ]);

  if (!targetMembership || !targetCase) {
    throw new UserFacingError("Seleccioná un integrante activo y una causa abierta.");
  }

  const { data: assignment, error } = await supabase
    .from("case_members")
    .upsert(
      {
        assigned_by: user.id,
        case_id: input.caseId,
        firm_id: membership.firmId,
        profile_id: input.profileId,
        role: input.role
      },
      { onConflict: "firm_id,case_id,profile_id" }
    )
    .select("id")
    .single();

  if (error || !assignment) {
    throw new UserFacingError("No se pudo asignar el acceso a la causa.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "case_member.assigned",
    "case_members",
    assignment.id,
    {
      case_id: input.caseId,
      new_role: input.role,
      previous_role: existingAssignment?.role ?? null,
      profile_id: input.profileId
    }
  );
  revalidatePath("/app/team");
  revalidatePath("/app/cases");
  revalidatePath("/app/calendar");
}

export async function removeCaseAssignment(input: RemoveCaseAssignmentInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseAssignments(membership.role)) {
    throw new UserFacingError(
      "Solo administración y abogados pueden remover acceso a causas."
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: assignment, error: assignmentError } = await supabase
    .from("case_members")
    .select("id,role")
    .eq("firm_id", membership.firmId)
    .eq("case_id", input.caseId)
    .eq("profile_id", input.profileId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    throw new UserFacingError("Seleccioná una asignación existente.");
  }

  const { error } = await supabase
    .from("case_members")
    .delete()
    .eq("firm_id", membership.firmId)
    .eq("case_id", input.caseId)
    .eq("profile_id", input.profileId);

  if (error) {
    throw new UserFacingError("No se pudo remover el acceso a la causa.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "case_member.removed",
    "case_members",
    assignment.id,
    {
      case_id: input.caseId,
      previous_role: assignment.role,
      profile_id: input.profileId
    }
  );
  revalidateTeamSurfaces();
}

export async function updateFirmMemberRole(input: UpdateFirmMemberRoleInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageFirmMemberships(membership.role)) {
    throw new UserFacingError("Solo administración puede cambiar roles del equipo.");
  }

  if (input.profileId === user.id) {
    throw new UserFacingError("No podés cambiar tu propio rol.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: targetMembership, error: targetError } = await supabase
    .from("firm_memberships")
    .select("id,profile_id,role,status")
    .eq("firm_id", membership.firmId)
    .eq("profile_id", input.profileId)
    .maybeSingle();

  if (targetError || !targetMembership || targetMembership.status !== "active") {
    throw new UserFacingError("Seleccioná un integrante activo.");
  }

  if (targetMembership.role === "admin" && input.role !== "admin") {
    await ensureAnotherActiveAdmin(membership.firmId, input.profileId);
  }

  const { error } = await supabase
    .from("firm_memberships")
    .update({ role: input.role })
    .eq("firm_id", membership.firmId)
    .eq("profile_id", input.profileId);

  if (error) {
    throw new UserFacingError("No se pudo actualizar el rol del integrante.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "membership.role_updated",
    "firm_memberships",
    targetMembership.id,
    {
      new_role: input.role,
      previous_role: targetMembership.role,
      profile_id: input.profileId
    }
  );
  revalidateTeamSurfaces();
}

export async function deactivateFirmMember(input: DeactivateFirmMemberInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageFirmMemberships(membership.role)) {
    throw new UserFacingError("Solo administración puede desactivar integrantes.");
  }

  if (input.profileId === user.id) {
    throw new UserFacingError("No podés desactivar tu propia cuenta.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: targetMembership, error: targetError } = await supabase
    .from("firm_memberships")
    .select("id,profile_id,role,status")
    .eq("firm_id", membership.firmId)
    .eq("profile_id", input.profileId)
    .maybeSingle();

  if (targetError || !targetMembership || targetMembership.status !== "active") {
    throw new UserFacingError("Seleccioná un integrante activo.");
  }

  if (targetMembership.role === "admin") {
    await ensureAnotherActiveAdmin(membership.firmId, input.profileId);
  }

  const { data: removableAssignments, error: removableAssignmentsError } = await supabase
    .from("case_members")
    .select("id,case_id,role")
    .eq("firm_id", membership.firmId)
    .eq("profile_id", input.profileId);

  if (removableAssignmentsError) {
    throw new UserFacingError("No se pudieron cargar las asignaciones del integrante.");
  }

  const { error } = await supabase
    .from("firm_memberships")
    .update({ status: "disabled" })
    .eq("firm_id", membership.firmId)
    .eq("profile_id", input.profileId);

  if (error) {
    throw new UserFacingError("No se pudo desactivar el integrante.");
  }

  const { error: assignmentsError } = await supabase
    .from("case_members")
    .delete()
    .eq("firm_id", membership.firmId)
    .eq("profile_id", input.profileId);

  if (assignmentsError) {
    throw new UserFacingError("No se pudieron remover las asignaciones del integrante.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "membership.disabled",
    "firm_memberships",
    targetMembership.id,
    {
      previous_role: targetMembership.role,
      profile_id: input.profileId,
      removed_assignment_count: removableAssignments?.length ?? 0
    }
  );
  revalidateTeamSurfaces();
}

function createInviteAdminClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    throw new UserFacingError(
      "Las invitaciones no están configuradas en el servidor."
    );
  }
}

async function findProfileByEmail(email: string) {
  const admin = createInviteAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,display_name,email")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new UserFacingError("No se pudo preparar la invitación.");
  }

  return data as ProfileRow | null;
}

async function inviteAuthUser(input: InviteFirmMemberInput) {
  const admin = createInviteAdminClient();
  const redirectTo = getInviteRedirectUrl();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: input.displayName ? { display_name: input.displayName } : undefined,
    ...(redirectTo ? { redirectTo } : {})
  });

  if (error || !data.user) {
    throw new UserFacingError("No se pudo enviar la invitación.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      display_name: input.displayName,
      email: input.email,
      id: data.user.id
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new UserFacingError("No se pudo preparar el perfil invitado.");
  }

  return data.user.id;
}

async function createInvitedMembership(
  firmId: string,
  profileId: string,
  role: FirmRole,
  invitedBy: string
) {
  const admin = createInviteAdminClient();
  const { data, error } = await admin
    .from("firm_memberships")
    .insert({
      firm_id: firmId,
      invited_by: invitedBy,
      profile_id: profileId,
      role,
      status: "invited"
    })
    .select("id,profile_id,role,status")
    .single();

  if (error || !data) {
    throw new UserFacingError("No se pudo registrar la invitación.");
  }

  return data as MembershipRow;
}

async function reinviteDisabledMember(
  membershipId: string,
  role: FirmRole,
  invitedBy: string
) {
  const admin = createInviteAdminClient();
  const { data, error } = await admin
    .from("firm_memberships")
    .update({
      accepted_at: null,
      invited_by: invitedBy,
      role,
      status: "invited"
    })
    .eq("id", membershipId)
    .eq("status", "disabled")
    .select("id,profile_id,role,status")
    .single();

  if (error || !data) {
    throw new UserFacingError("No se pudo reactivar la invitación.");
  }

  return data as MembershipRow;
}

function getInviteRedirectUrl() {
  if (!process.env.APP_BASE_URL) {
    return undefined;
  }

  try {
    return new URL("/app", process.env.APP_BASE_URL).toString();
  } catch {
    return undefined;
  }
}

async function ensureAnotherActiveAdmin(firmId: string, excludedProfileId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("firm_memberships")
    .select("profile_id", { count: "exact", head: true })
    .eq("firm_id", firmId)
    .eq("role", "admin")
    .eq("status", "active")
    .neq("profile_id", excludedProfileId);

  if (error || !count) {
    throw new UserFacingError(
      "El estudio debe conservar al menos una cuenta administradora activa."
    );
  }
}

async function getProfilesById(profileIds: string[]) {
  const uniqueProfileIds = [...new Set(profileIds)];

  if (!uniqueProfileIds.length) {
    return new Map<string, ProfileRow>();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,email")
    .in("id", uniqueProfileIds);

  if (error) {
    throw new UserFacingError("No se pudieron cargar los integrantes del equipo.");
  }

  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
}

async function appendAuditLog(
  firmId: string,
  actorProfileId: string,
  action: string,
  targetTable: string,
  targetId: string,
  metadata: Json = {}
) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("audit_log").insert({
    action,
    actor_profile_id: actorProfileId,
    firm_id: firmId,
    metadata,
    target_id: targetId,
    target_table: targetTable
  });
}

function revalidateTeamSurfaces() {
  revalidatePath("/app");
  revalidatePath("/app/team");
  revalidatePath("/app/cases");
  revalidatePath("/app/calendar");
}
