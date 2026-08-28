import "server-only";

import { randomUUID } from "node:crypto";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import type {
  ArchiveNoteInput,
  CreateDocumentMetadataInput,
  CreateDocumentUploadInput,
  CreateNoteInput,
  CreateTaskInput,
  UpdateTaskStatusInput
} from "@/features/cases/validation";
import { canManageCaseWork } from "@/lib/domain/authorization";
import { requireActiveMembership } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CaseStatus, TaskStatus } from "@/types/database";

export type CaseDetail = {
  caseNumber: string;
  clientName: string;
  court: string | null;
  description: string | null;
  docketNumber: string | null;
  id: string;
  jurisdiction: string | null;
  openedOn: string;
  status: CaseStatus;
  title: string;
};

export type CaseNoteSummary = {
  body: string;
  createdAt: string;
  createdByName: string;
  id: string;
};

export type CaseTaskSummary = {
  assignedToName: string | null;
  dueOn: string | null;
  id: string;
  status: TaskStatus;
  title: string;
};

export type CaseDocumentSummary = {
  displayName: string;
  id: string;
  mimeType: string | null;
  sizeBytes: number | null;
  storageBucket: string;
  storagePath: string;
};

export type CaseMemberOption = {
  displayName: string | null;
  email: string;
  profileId: string;
};

type CaseRow = {
  case_number: string;
  client_id: string;
  court: string | null;
  description: string | null;
  docket_number: string | null;
  id: string;
  jurisdiction: string | null;
  opened_on: string;
  status: CaseStatus;
  title: string;
};

type ClientRow = {
  display_name: string;
  id: string;
};

type NoteRow = {
  body: string;
  created_at: string;
  created_by: string;
  id: string;
};

type TaskRow = {
  assigned_to: string | null;
  due_on: string | null;
  id: string;
  status: TaskStatus;
  title: string;
};

type DocumentRow = {
  display_name: string;
  id: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_bucket: string;
  storage_path: string;
};

type CaseMemberRow = {
  profile_id: string;
};

type ProfileRow = {
  display_name: string | null;
  email: string;
  id: string;
};

const caseDocumentsBucket = "case-documents";
const maxDocumentBytes = 52_428_800;
const allowedDocumentMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function getCaseDetail(caseId: string): Promise<CaseDetail> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data: caseItem, error } = await supabase
    .from("cases")
    .select(
      "id,case_number,title,status,jurisdiction,court,docket_number,opened_on,description,client_id"
    )
    .eq("firm_id", membership.firmId)
    .eq("id", caseId)
    .maybeSingle();

  if (error) {
    throw new UserFacingError("No se pudo cargar la causa.");
  }

  if (!caseItem) {
    notFound();
  }

  const row = caseItem as CaseRow;
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id,display_name")
    .eq("firm_id", membership.firmId)
    .eq("id", row.client_id)
    .maybeSingle();

  if (clientError) {
    throw new UserFacingError("No se pudo cargar la causa.");
  }

  return {
    caseNumber: row.case_number,
    clientName: (client as ClientRow | null)?.display_name ?? "Cliente restringido",
    court: row.court,
    description: row.description,
    docketNumber: row.docket_number,
    id: row.id,
    jurisdiction: row.jurisdiction,
    openedOn: row.opened_on,
    status: row.status,
    title: row.title
  };
}

export async function listCaseNotes(caseId: string): Promise<CaseNoteSummary[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notes")
    .select("id,body,created_by,created_at")
    .eq("firm_id", membership.firmId)
    .eq("case_id", caseId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new UserFacingError("No se pudieron cargar las notas.");
  }

  const rows = (data ?? []) as NoteRow[];
  const profilesById = await getProfilesById(rows.map((row) => row.created_by));

  return rows.map((row) => ({
    body: row.body,
    createdAt: row.created_at,
    createdByName: profilesById.get(row.created_by)?.display_name ?? "Integrante del equipo",
    id: row.id
  }));
}

export async function listCaseTasks(caseId: string): Promise<CaseTaskSummary[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,status,due_on,assigned_to")
    .eq("firm_id", membership.firmId)
    .eq("case_id", caseId)
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new UserFacingError("No se pudieron cargar las tareas.");
  }

  const rows = (data ?? []) as TaskRow[];
  const profilesById = await getProfilesById(
    rows.flatMap((row) => (row.assigned_to ? [row.assigned_to] : []))
  );

  return rows.map((row) => ({
    assignedToName: row.assigned_to
      ? (profilesById.get(row.assigned_to)?.display_name ?? "Integrante del equipo")
      : null,
    dueOn: row.due_on,
    id: row.id,
    status: row.status,
    title: row.title
  }));
}

export async function listCaseDocuments(caseId: string): Promise<CaseDocumentSummary[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id,display_name,mime_type,size_bytes,storage_bucket,storage_path")
    .eq("firm_id", membership.firmId)
    .eq("case_id", caseId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new UserFacingError("No se pudieron cargar los documentos.");
  }

  return ((data ?? []) as DocumentRow[]).map((row) => ({
    displayName: row.display_name,
    id: row.id,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path
  }));
}

export async function listAssignableCaseMembers(
  caseId: string
): Promise<CaseMemberOption[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("case_members")
    .select("profile_id")
    .eq("firm_id", membership.firmId)
    .eq("case_id", caseId);

  if (error) {
    throw new UserFacingError("No se pudieron cargar los integrantes de la causa.");
  }

  const profileIds = ((data ?? []) as CaseMemberRow[]).map((row) => row.profile_id);

  if (!profileIds.length) {
    return [];
  }

  const profilesById = await getProfilesById(profileIds);

  return profileIds.map((profileId) => {
    const profile = profilesById.get(profileId);

    return {
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? "Correo no disponible",
      profileId
    };
  });
}

export async function createCaseNote(input: CreateNoteInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseWork(membership.role)) {
    throw new UserFacingError("Tu rol no permite agregar trabajo a la causa.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notes").insert({
    body: input.body,
    case_id: input.caseId,
    created_by: user.id,
    firm_id: membership.firmId
  });

  if (error) {
    throw new UserFacingError("No se pudo guardar la nota.");
  }

  revalidateCase(input.caseId);
}

export async function archiveCaseNote(input: ArchiveNoteInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseWork(membership.role)) {
    throw new UserFacingError("Tu rol no permite actualizar el trabajo de la causa.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .update({
      archived_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq("firm_id", membership.firmId)
    .eq("case_id", input.caseId)
    .eq("id", input.noteId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new UserFacingError("No se pudo archivar la nota.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "note.archived",
    "notes",
    input.noteId
  );
  revalidateCase(input.caseId);
}

export async function createCaseTask(input: CreateTaskInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseWork(membership.role)) {
    throw new UserFacingError("Tu rol no permite agregar trabajo a la causa.");
  }

  const supabase = await createSupabaseServerClient();

  if (input.assignedTo) {
    const { data: assignedMember, error: assignedMemberError } = await supabase
      .from("case_members")
      .select("profile_id")
      .eq("firm_id", membership.firmId)
      .eq("case_id", input.caseId)
      .eq("profile_id", input.assignedTo)
      .maybeSingle();

    if (assignedMemberError || !assignedMember) {
      throw new UserFacingError("Las tareas solo pueden asignarse a integrantes de la causa.");
    }
  }

  const { error } = await supabase.from("tasks").insert({
    assigned_to: input.assignedTo,
    case_id: input.caseId,
    created_by: user.id,
    due_on: input.dueOn,
    firm_id: membership.firmId,
    title: input.title
  });

  if (error) {
    throw new UserFacingError("No se pudo guardar la tarea.");
  }

  revalidateCase(input.caseId);
}

export async function updateCaseTaskStatus(input: UpdateTaskStatusInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseWork(membership.role)) {
    throw new UserFacingError("Tu rol no permite actualizar el trabajo de la causa.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: input.status })
    .eq("firm_id", membership.firmId)
    .eq("case_id", input.caseId)
    .eq("id", input.taskId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new UserFacingError("No se pudo actualizar la tarea.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "task.status_updated",
    "tasks",
    input.taskId
  );
  revalidateCase(input.caseId);
}

export async function createDocumentMetadata(input: CreateDocumentMetadataInput) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseWork(membership.role)) {
    throw new UserFacingError("Tu rol no permite agregar trabajo a la causa.");
  }

  const storagePath = buildStoragePath(
    membership.firmId,
    input.caseId,
    input.displayName
  );
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("documents").insert({
    case_id: input.caseId,
    created_by: user.id,
    display_name: input.displayName,
    firm_id: membership.firmId,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    storage_bucket: caseDocumentsBucket,
    storage_path: storagePath
  });

  if (error) {
    throw new UserFacingError("No se pudieron guardar los datos del documento.");
  }

  revalidateCase(input.caseId);
}

export async function uploadCaseDocument(input: CreateDocumentUploadInput, file: File) {
  const { membership, user } = await requireActiveMembership();

  if (!canManageCaseWork(membership.role)) {
    throw new UserFacingError("Tu rol no permite agregar trabajo a la causa.");
  }

  if (!file.name || file.size === 0) {
    throw new UserFacingError("Seleccioná un documento para subir.");
  }

  if (file.size > maxDocumentBytes) {
    throw new UserFacingError("Los documentos no pueden superar 50 MiB.");
  }

  if (!allowedDocumentMimeTypes.has(file.type)) {
    throw new UserFacingError("El tipo de documento no está permitido.");
  }

  await requireWritableCase(input.caseId);

  const displayName = input.displayName ?? file.name;
  const storagePath = buildStoragePath(membership.firmId, input.caseId, file.name);
  const supabase = await createSupabaseServerClient();

  const { data: documentRow, error: metadataError } = await supabase
    .from("documents")
    .insert({
      case_id: input.caseId,
      created_by: user.id,
      display_name: displayName,
      firm_id: membership.firmId,
      mime_type: file.type,
      size_bytes: file.size,
      storage_bucket: caseDocumentsBucket,
      storage_path: storagePath
    })
    .select("id")
    .single();

  if (metadataError || !documentRow) {
    throw new UserFacingError("No se pudieron guardar los datos del documento.");
  }

  const { error: uploadError } = await supabase.storage
    .from(caseDocumentsBucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    await supabase
      .from("documents")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", documentRow.id);
    throw new UserFacingError("No se pudo subir el documento.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "document.uploaded",
    "documents",
    documentRow.id
  );
  revalidateCase(input.caseId);
}

export async function createSignedDocumentDownloadUrl(
  caseId: string,
  documentId: string
) {
  const { membership, user } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id,display_name,storage_bucket,storage_path")
    .eq("firm_id", membership.firmId)
    .eq("case_id", caseId)
    .eq("id", documentId)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data) {
    throw new UserFacingError("No se pudo cargar el documento.");
  }

  const document = data as Pick<
    DocumentRow,
    "display_name" | "id" | "storage_bucket" | "storage_path"
  >;
  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from(document.storage_bucket)
    .createSignedUrl(document.storage_path, 60, {
      download: document.display_name
    });

  if (signedUrlError || !signedUrl?.signedUrl) {
    throw new UserFacingError("No se pudo preparar la descarga del documento.");
  }

  await appendAuditLog(
    membership.firmId,
    user.id,
    "document.download_prepared",
    "documents",
    document.id
  );

  return signedUrl.signedUrl;
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
    throw new UserFacingError("No se pudieron cargar los datos del equipo.");
  }

  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
}

async function requireWritableCase(caseId: string) {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select("id")
    .eq("firm_id", membership.firmId)
    .eq("id", caseId)
    .eq("status", "open")
    .maybeSingle();

  if (error || !data) {
    throw new UserFacingError("Seleccioná una causa abierta.");
  }
}

async function appendAuditLog(
  firmId: string,
  actorProfileId: string,
  action: string,
  targetTable: string,
  targetId: string
) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("audit_log").insert({
    action,
    actor_profile_id: actorProfileId,
    firm_id: firmId,
    target_id: targetId,
    target_table: targetTable
  });
}

function revalidateCase(caseId: string) {
  revalidatePath("/app");
  revalidatePath("/app/cases");
  revalidatePath(`/app/cases/${caseId}`);
}

function buildStoragePath(firmId: string, caseId: string, fileName: string) {
  return `${firmId}/${caseId}/${randomUUID()}-${toStorageName(fileName)}`;
}

function toStorageName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "document"
  );
}
