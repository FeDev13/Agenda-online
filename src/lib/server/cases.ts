import "server-only";

import { revalidatePath } from "next/cache";

import { type CaseListFilters, filterCaseSummaries } from "@/features/cases/filters";
import {
  toCreateCaseErrorMessage,
  toPermanentDeleteCaseErrorMessage
} from "@/features/cases/error-messages";
import type {
  ArchiveCaseInput,
  CreateCaseInput,
  PermanentlyDeleteCaseInput
} from "@/features/cases/validation";
import {
  canArchiveCases,
  canManageCases,
  canPermanentlyDeleteCases
} from "@/lib/domain/authorization";
import { requireActiveMembership } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OpenCaseSummary = {
  caseNumber: string;
  clientName: string;
  court: string | null;
  docketNumber: string | null;
  id: string;
  openedOn: string;
  title: string;
};

export type ArchivedCaseSummary = OpenCaseSummary & {
  archivedAt: string;
};

type OpenCaseRow = {
  case_number: string;
  client_id: string;
  court: string | null;
  docket_number: string | null;
  id: string;
  opened_on: string;
  title: string;
  updated_at?: string;
};

type ClientNameRow = {
  display_name: string;
  id: string;
};

type CaseDocumentStorageRow = {
  storage_bucket: string;
  storage_path: string;
};

export async function listOpenCases(
  filters: CaseListFilters = {}
): Promise<OpenCaseSummary[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("cases")
    .select("id,case_number,title,opened_on,court,docket_number,client_id")
    .eq("firm_id", membership.firmId)
    .eq("status", "open")
    .order("last_activity_at", { ascending: false })
    .order("id", { ascending: true });

  if (error) {
    throw new UserFacingError("No se pudieron cargar las causas abiertas.");
  }

  const rows = (data ?? []) as OpenCaseRow[];
  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const { data: clients, error: clientsError } = clientIds.length
    ? await supabase
        .from("clients")
        .select("id,display_name")
        .eq("firm_id", membership.firmId)
        .in("id", clientIds)
    : { data: [], error: null };

  if (clientsError) {
    throw new UserFacingError("No se pudieron cargar las causas abiertas.");
  }

  const clientNames = new Map(
    ((clients ?? []) as ClientNameRow[]).map((client) => [client.id, client.display_name])
  );

  const openCases = rows.map((row) => ({
    caseNumber: row.case_number,
    clientName: clientNames.get(row.client_id) ?? "Cliente sin asignar",
    court: row.court,
    docketNumber: row.docket_number,
    id: row.id,
    openedOn: row.opened_on,
    title: row.title
  }));

  return filterCaseSummaries(openCases, filters);
}

export async function listArchivedCases(): Promise<ArchivedCaseSummary[]> {
  const { membership } = await requireActiveMembership();

  if (!canPermanentlyDeleteCases(membership.role)) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select("id,case_number,title,opened_on,court,docket_number,client_id,updated_at")
    .eq("firm_id", membership.firmId)
    .eq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new UserFacingError("No se pudieron cargar las causas archivadas.");
  }

  const rows = (data ?? []) as OpenCaseRow[];
  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const { data: clients, error: clientsError } = clientIds.length
    ? await supabase
        .from("clients")
        .select("id,display_name")
        .eq("firm_id", membership.firmId)
        .in("id", clientIds)
    : { data: [], error: null };

  if (clientsError) {
    throw new UserFacingError("No se pudieron cargar las causas archivadas.");
  }

  const clientNames = new Map(
    ((clients ?? []) as ClientNameRow[]).map((client) => [client.id, client.display_name])
  );

  return rows.map((row) => ({
    archivedAt: row.updated_at ?? row.opened_on,
    caseNumber: row.case_number,
    clientName: clientNames.get(row.client_id) ?? "Cliente sin asignar",
    court: row.court,
    docketNumber: row.docket_number,
    id: row.id,
    openedOn: row.opened_on,
    title: row.title
  }));
}

export async function createCase(input: CreateCaseInput) {
  const { membership } = await requireActiveMembership();

  if (!canManageCases(membership.role)) {
    throw new UserFacingError("Solo administración y abogados pueden crear causas.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_case_with_client", {
    p_case_number: input.caseNumber,
    p_client_display_name: input.clientName,
    p_court: input.court,
    p_description: input.description,
    p_docket_number: input.docketNumber,
    p_firm_id: membership.firmId,
    p_jurisdiction: input.jurisdiction,
    p_opened_on: input.openedOn,
    p_title: input.title
  });

  if (error) {
    console.error("create_case_with_client failed", {
      code: error.code,
      message: error.message
    });
    throw new UserFacingError(toCreateCaseErrorMessage(error));
  }

  revalidatePath("/app");
  revalidatePath("/app/cases");
}

export async function archiveCase(input: ArchiveCaseInput) {
  const { membership } = await requireActiveMembership();

  if (!canArchiveCases(membership.role)) {
    throw new UserFacingError("Solo administración puede archivar causas.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_case", {
    p_case_id: input.caseId
  });

  if (error) {
    throw new UserFacingError("No se pudo archivar la causa.");
  }

  revalidatePath("/app");
  revalidatePath("/app/cases");
  revalidatePath(`/app/cases/${input.caseId}`);
  revalidatePath("/app/calendar");
  revalidatePath("/app/team");
}

export async function permanentlyDeleteCase(input: PermanentlyDeleteCaseInput) {
  const { membership } = await requireActiveMembership();

  if (!canPermanentlyDeleteCases(membership.role)) {
    throw new UserFacingError(
      "Solo administración puede eliminar causas definitivamente."
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("storage_bucket,storage_path")
    .eq("case_id", input.caseId);

  const { error } = await supabase.rpc("delete_case_permanently", {
    p_case_id: input.caseId,
    p_confirmation: input.confirmation
  });

  if (error) {
    console.error("delete_case_permanently failed", {
      code: error.code,
      message: error.message
    });
    throw new UserFacingError(toPermanentDeleteCaseErrorMessage(error));
  }

  await removeDeletedCaseStorageObjects((documents ?? []) as CaseDocumentStorageRow[]);

  revalidatePath("/app");
  revalidatePath("/app/cases");
  revalidatePath(`/app/cases/${input.caseId}`);
  revalidatePath("/app/calendar");
  revalidatePath("/app/team");
}

async function removeDeletedCaseStorageObjects(documents: CaseDocumentStorageRow[]) {
  const pathsByBucket = new Map<string, string[]>();

  for (const document of documents) {
    const paths = pathsByBucket.get(document.storage_bucket) ?? [];
    paths.push(document.storage_path);
    pathsByBucket.set(document.storage_bucket, paths);
  }

  if (!pathsByBucket.size) {
    return;
  }

  try {
    const admin = createSupabaseAdminClient();

    for (const [bucket, paths] of pathsByBucket) {
      const { error } = await admin.storage.from(bucket).remove(paths);

      if (error) {
        console.error("delete_case_permanently storage cleanup failed", {
          bucket,
          message: error.message
        });
      }
    }
  } catch (error) {
    console.error("delete_case_permanently storage cleanup unavailable", error);
  }
}
