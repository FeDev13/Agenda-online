"use server";

import {
  archiveNoteSchema,
  createDocumentMetadataSchema,
  createDocumentUploadSchema,
  createNoteSchema,
  createTaskSchema,
  updateTaskStatusSchema
} from "@/features/cases/validation";
import {
  archiveCaseNote,
  createCaseNote,
  createCaseTask,
  createDocumentMetadata,
  updateCaseTaskStatus,
  uploadCaseDocument
} from "@/lib/server/case-detail";
import { toUserMessage } from "@/lib/server/errors";

export type CaseDetailFormState = {
  message: string | null;
  ok: boolean;
};

export async function createNoteAction(_state: CaseDetailFormState, formData: FormData) {
  const parsed = createNoteSchema.safeParse({
    body: formData.get("body"),
    caseId: formData.get("caseId")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos de la nota.",
      ok: false
    };
  }

  try {
    await createCaseNote(parsed.data);
    return { message: "Nota guardada.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

export async function createTaskAction(_state: CaseDetailFormState, formData: FormData) {
  const parsed = createTaskSchema.safeParse({
    assignedTo: formData.get("assignedTo"),
    caseId: formData.get("caseId"),
    dueOn: formData.get("dueOn"),
    title: formData.get("title")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos de la tarea.",
      ok: false
    };
  }

  try {
    await createCaseTask(parsed.data);
    return { message: "Tarea guardada.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

export async function createDocumentMetadataAction(
  _state: CaseDetailFormState,
  formData: FormData
) {
  const parsed = createDocumentMetadataSchema.safeParse({
    caseId: formData.get("caseId"),
    displayName: formData.get("displayName"),
    mimeType: formData.get("mimeType"),
    sizeBytes: formData.get("sizeBytes")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos del documento.",
      ok: false
    };
  }

  try {
    await createDocumentMetadata(parsed.data);
    return { message: "Datos del documento guardados.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

export async function uploadDocumentAction(
  _state: CaseDetailFormState,
  formData: FormData
) {
  const file = formData.get("file");
  const parsed = createDocumentUploadSchema.safeParse({
    caseId: formData.get("caseId"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá los datos del documento.",
      ok: false
    };
  }

  if (!(file instanceof File)) {
    return { message: "Seleccioná un documento para subir.", ok: false };
  }

  try {
    await uploadCaseDocument(parsed.data, file);
    return { message: "Documento subido.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}

export async function updateTaskStatusAction(formData: FormData) {
  const parsed = updateTaskStatusSchema.safeParse({
    caseId: formData.get("caseId"),
    status: formData.get("status"),
    taskId: formData.get("taskId")
  });

  if (!parsed.success) {
    return;
  }

  await updateCaseTaskStatus(parsed.data);
}

export async function archiveNoteAction(formData: FormData) {
  const parsed = archiveNoteSchema.safeParse({
    caseId: formData.get("caseId"),
    noteId: formData.get("noteId")
  });

  if (!parsed.success) {
    return;
  }

  await archiveCaseNote(parsed.data);
}
