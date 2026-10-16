"use client";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { useFormAction } from "@/components/use-form-action";

import type { CaseMemberOption } from "@/lib/server/case-detail";

import {
  createNoteAction,
  createTaskAction,
  uploadDocumentAction,
  type CaseDetailFormState
} from "./actions";

const initialState: CaseDetailFormState = { message: null, ok: false };

export function CaseWorkForms({
  canManage,
  caseId,
  members,
  section
}: {
  canManage: boolean;
  caseId: string;
  members: CaseMemberOption[];
  section: "note" | "task" | "document";
}) {
  const {
    state: noteState,
    formAction: noteAction,
    pending: notePending,
    onReset: noteActionReset
  } = useFormAction(createNoteAction, initialState);
  const {
    state: taskState,
    formAction: taskAction,
    pending: taskPending,
    onReset: taskActionReset
  } = useFormAction(createTaskAction, initialState);
  const {
    state: documentState,
    formAction: documentAction,
    pending: documentPending,
    onReset: documentActionReset
  } = useFormAction(uploadDocumentAction, initialState);

  return (
    <div className="grid">
      {section === "note" ? (
        <section className="panel" aria-labelledby="new-note-title">
          <h2 id="new-note-title">Agregar nota</h2>
          <form onReset={noteActionReset} action={noteAction} className="formGrid">
            <input name="caseId" type="hidden" value={caseId} />
            <FormField id="note-body" label="Nota" error={noteState.fieldErrors?.body}>
              <textarea disabled={!canManage} id="note-body" name="body" required />
            </FormField>
            <FormFeedback state={noteState} />
            <Button
              disabled={!canManage || notePending}
              type="submit"
              aria-busy={notePending}
            >
              {notePending ? "Guardando..." : "Guardar nota"}
            </Button>
          </form>
        </section>
      ) : null}

      {section === "task" ? (
        <section className="panel" aria-labelledby="new-task-title">
          <h2 id="new-task-title">Agregar tarea</h2>
          <form onReset={taskActionReset} action={taskAction} className="formGrid">
            <input name="caseId" type="hidden" value={caseId} />
            <FormField
              id="task-title"
              label="Título"
              error={taskState.fieldErrors?.title}
            >
              <input disabled={!canManage} id="task-title" name="title" required />
            </FormField>
            <div className="fieldRow">
              <FormField
                id="task-due-on"
                label="Vencimiento"
                error={taskState.fieldErrors?.dueOn}
              >
                <input disabled={!canManage} id="task-due-on" name="dueOn" type="date" />
              </FormField>
              <FormField
                id="task-assigned-to"
                label="Asignada a"
                error={taskState.fieldErrors?.assignedTo}
              >
                <select disabled={!canManage} id="task-assigned-to" name="assignedTo">
                  <option value="">Sin asignar</option>
                  {members.map((member) => (
                    <option key={member.profileId} value={member.profileId}>
                      {member.displayName ?? member.email}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormFeedback state={taskState} />
            <Button
              disabled={!canManage || taskPending}
              type="submit"
              aria-busy={taskPending}
            >
              {taskPending ? "Guardando..." : "Guardar tarea"}
            </Button>
          </form>
        </section>
      ) : null}

      {section === "document" ? (
        <section className="panel" aria-labelledby="new-document-title">
          <h2 id="new-document-title">Subir documento</h2>
          <form
            onReset={documentActionReset}
            action={documentAction}
            className="formGrid"
          >
            <input name="caseId" type="hidden" value={caseId} />
            <FormField
              id="document-file"
              label="Archivo"
              error={documentState.fieldErrors?.file}
            >
              <input
                accept="application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={!canManage}
                id="document-file"
                name="file"
                required
                type="file"
              />
            </FormField>
            <FormField
              id="document-name"
              label="Nombre visible"
              error={documentState.fieldErrors?.displayName}
            >
              <input disabled={!canManage} id="document-name" name="displayName" />
            </FormField>
            <FormFeedback state={documentState} />
            <Button
              className="button"
              disabled={!canManage || documentPending}
              type="submit"
              aria-busy={documentPending}
            >
              {documentPending ? "Subiendo..." : "Subir documento"}
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
