"use client";

import { useId, useState } from "react";
import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { useFormAction } from "@/components/use-form-action";
import { ActionForm } from "@/components/action-form";

import type { CaseNoteSummary } from "@/lib/server/case-detail";

import { archiveNoteAction, updateNoteAction, type CaseDetailFormState } from "./actions";

const initialState: CaseDetailFormState = { message: null, ok: false };

export function CaseNoteItem({
  canManage,
  caseId,
  note,
  timeZone
}: {
  canManage: boolean;
  caseId: string;
  note: CaseNoteSummary;
  timeZone: string;
}) {
  const bodyId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const {
    state: state,
    formAction: formAction,
    pending: pending,
    onReset: formActionReset
  } = useFormAction(updateNoteAction, initialState);

  return (
    <li className="card">
      {isEditing ? (
        <form onReset={formActionReset} action={formAction} className="formGrid">
          <input name="caseId" type="hidden" value={caseId} />
          <input name="noteId" type="hidden" value={note.id} />
          <FormField id={bodyId} label="Nota" error={state.fieldErrors?.body}>
            <textarea
              defaultValue={note.body}
              disabled={!canManage || pending}
              id={bodyId}
              name="body"
              required
            />
          </FormField>
          <FormFeedback state={state} />
          <div className="inlineForm">
            <Button compact disabled={pending} type="submit" aria-busy={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              variant="secondary"
              compact
              disabled={pending}
              onClick={() => setIsEditing(false)}
              type="button"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <p className="noteBody">{note.body}</p>
      )}

      <div className="actionRow">
        <p className="muted">
          {note.createdByName} ·{" "}
          {new Date(note.createdAt).toLocaleString("es-AR", { timeZone })}
        </p>
        {canManage && !isEditing ? (
          <div className="inlineForm">
            <Button
              variant="secondary"
              compact
              onClick={() => setIsEditing(true)}
              type="button"
            >
              Editar
            </Button>
            <ActionForm
              action={archiveNoteAction}
              label="Archivar"
              pendingLabel="Archivando…"
            >
              <input name="caseId" type="hidden" value={caseId} />
              <input name="noteId" type="hidden" value={note.id} />
            </ActionForm>
          </div>
        ) : null}
      </div>
    </li>
  );
}
