"use server";

import {
  archiveNoteSchema,
  createDocumentMetadataSchema,
  createDocumentUploadSchema,
  createNoteSchema,
  createTaskSchema,
  updateNoteSchema,
  updateTaskStatusSchema
} from "@/features/cases/validation";
import {
  archiveCaseNote,
  createCaseNote,
  createCaseTask,
  createDocumentMetadata,
  updateCaseNote,
  updateCaseTaskStatus,
  uploadCaseDocument
} from "@/lib/server/case-detail";
import type { ActionResult } from "@/types/action-result";
import { validationFailure } from "@/lib/server/form-validation";
import { toUserMessage } from "@/lib/server/errors";

export type CaseDetailFormState = ActionResult;

export async function createNoteAction(_state: CaseDetailFormState, formData: FormData) {
  const parsed = createNoteSchema.safeParse({
    body: formData.get("body"),
    caseId: formData.get("caseId")
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
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
    return validationFailure(parsed.error);
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
    return validationFailure(parsed.error);
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
    return validationFailure(parsed.error);
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
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await updateCaseTaskStatus(parsed.data);
    return { ok: true, message: "Estado de tarea actualizado." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function archiveNoteAction(formData: FormData) {
  const parsed = archiveNoteSchema.safeParse({
    caseId: formData.get("caseId"),
    noteId: formData.get("noteId")
  });

  if (!parsed.success) {
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await archiveCaseNote(parsed.data);
    return { ok: true, message: "Nota archivada." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateNoteAction(_state: CaseDetailFormState, formData: FormData) {
  const parsed = updateNoteSchema.safeParse({
    body: formData.get("body"),
    caseId: formData.get("caseId"),
    noteId: formData.get("noteId")
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    await updateCaseNote(parsed.data);
    return { message: "Nota actualizada.", ok: true };
  } catch (error) {
    return { message: toUserMessage(error), ok: false };
  }
}
