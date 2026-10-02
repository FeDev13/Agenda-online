import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import type { BootstrapFirmInput } from "@/features/bootstrap/validation";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type FirmRow = {
  id: string;
  name: string;
};

type ProfileRow = {
  display_name: string | null;
  email: string;
  id: string;
};

export async function bootstrapFirm(input: BootstrapFirmInput) {
  verifyBootstrapToken(input.bootstrapToken);

  const admin = createBootstrapAdminClient();
  const existingProfile = await findProfileByEmail(input.adminEmail);

  if (existingProfile) {
    await ensureProfileIsNotMember(existingProfile.id);
  }

  const profileId = existingProfile?.id ?? (await inviteBootstrapAdmin(input));

  if (input.adminDisplayName && !existingProfile?.display_name) {
    await admin
      .from("profiles")
      .update({ display_name: input.adminDisplayName })
      .eq("id", profileId);
  }

  const { data: firm, error: firmError } = await admin
    .from("firms")
    .insert({
      default_timezone: input.defaultTimezone,
      name: input.firmName
    })
    .select("id,name")
    .single();

  if (firmError || !firm) {
    throw new UserFacingError("No se pudo crear el estudio.");
  }

  const { data: membership, error: membershipError } = await admin
    .from("firm_memberships")
    .insert({
      firm_id: firm.id,
      profile_id: profileId,
      role: "admin",
      status: "invited"
    })
    .select("id,firm_id,profile_id")
    .single();

  if (membershipError || !membership) {
    throw new UserFacingError("No se pudo registrar la invitación administradora.");
  }

  await appendBootstrapAuditLog(firm, "firm.bootstrapped", "firms", firm.id, {
    admin_profile_id: profileId,
    membership_id: membership.id
  });
  await appendBootstrapAuditLog(
    firm,
    "membership.bootstrap_invited",
    "firm_memberships",
    membership.id,
    {
      profile_id: profileId,
      role: "admin"
    }
  );
}

function createBootstrapAdminClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    throw new UserFacingError("Bootstrap no está configurado en el servidor.");
  }
}

function verifyBootstrapToken(inputToken: string) {
  const configuredToken = process.env.FIRM_BOOTSTRAP_TOKEN;

  if (!configuredToken) {
    throw new UserFacingError("Bootstrap no está configurado en el servidor.");
  }

  const inputDigest = createHash("sha256").update(inputToken).digest();
  const configuredDigest = createHash("sha256").update(configuredToken).digest();

  if (!timingSafeEqual(inputDigest, configuredDigest)) {
    throw new UserFacingError("No se pudo validar bootstrap.");
  }
}

async function findProfileByEmail(email: string) {
  const admin = createBootstrapAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,display_name,email")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new UserFacingError("No se pudo preparar bootstrap.");
  }

  return data as ProfileRow | null;
}

async function ensureProfileIsNotMember(profileId: string) {
  const admin = createBootstrapAdminClient();
  const { data, error } = await admin
    .from("firm_memberships")
    .select("id")
    .eq("profile_id", profileId)
    .in("status", ["active", "invited"])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new UserFacingError("No se pudo preparar bootstrap.");
  }

  if (data) {
    throw new UserFacingError("Ese email ya tiene una invitación o membresía activa.");
  }
}

async function inviteBootstrapAdmin(input: BootstrapFirmInput) {
  const admin = createBootstrapAdminClient();
  const redirectTo = getInviteRedirectUrl();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.adminEmail, {
    data: input.adminDisplayName ? { display_name: input.adminDisplayName } : undefined,
    ...(redirectTo ? { redirectTo } : {})
  });

  if (error || !data.user) {
    throw new UserFacingError("No se pudo enviar la invitación administradora.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      display_name: input.adminDisplayName,
      email: input.adminEmail,
      id: data.user.id
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new UserFacingError("No se pudo preparar el perfil administrador.");
  }

  return data.user.id;
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

async function appendBootstrapAuditLog(
  firm: FirmRow,
  action: string,
  targetTable: string,
  targetId: string,
  metadata: Record<string, Json>
) {
  const admin = createBootstrapAdminClient();
  const { error } = await admin.from("audit_log").insert({
    action,
    actor_profile_id: null,
    firm_id: firm.id,
    metadata: {
      ...metadata,
      firm_name: firm.name
    },
    target_id: targetId,
    target_table: targetTable
  });

  if (error) {
    throw new UserFacingError("No se pudo auditar bootstrap.");
  }
}
