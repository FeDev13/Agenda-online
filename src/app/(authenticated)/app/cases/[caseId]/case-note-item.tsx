"use client";

import { useActionState, useId, useState } from "react";

import type { CaseNoteSummary } from "@/lib/server/case-detail";

import {
  archiveNoteAction,
  updateNoteAction,
  type CaseDetailFormState
} from "./actions";

const initialState: CaseDetailFormState = { message: null, ok: false };

export function CaseNoteItem({
  canManage,
  caseId,
  note
}: {
  canManage: boolean;
  caseId: string;
  note: CaseNoteSummary;
}) {
  const bodyId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateNoteAction,
    initialState
  );

  return (
    <li className="card">
      {isEditing ? (
        <form action={formAction} className="formGrid">
          <input name="caseId" type="hidden" value={caseId} />
          <input name="noteId" type="hidden" value={note.id} />
          <div className="field">
            <label htmlFor={bodyId}>Nota</label>
            <textarea
              defaultValue={note.body}
              disabled={!canManage || pending}
              id={bodyId}
              name="body"
              required
            />
          </div>
          {state.message ? (
            <p aria-live="polite" className={state.ok ? "muted" : "errorText"}>
              {state.message}
            </p>
          ) : null}
          <div className="inlineForm">
            <button className="button compactButton" disabled={pending} type="submit">
              {pending ? "Guardando..." : "Guardar"}
            </button>
            <button
              className="secondaryButton compactButton"
              disabled={pending}
              onClick={() => setIsEditing(false)}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <p className="noteBody">{note.body}</p>
      )}

      <div className="actionRow">
        <p className="muted">
          {note.createdByName} · {new Date(note.createdAt).toLocaleString()}
        </p>
        {canManage && !isEditing ? (
          <div className="inlineForm">
            <button
              className="secondaryButton compactButton"
              onClick={() => setIsEditing(true)}
              type="button"
            >
              Editar
            </button>
            <form action={archiveNoteAction}>
              <input name="caseId" type="hidden" value={caseId} />
              <input name="noteId" type="hidden" value={note.id} />
              <button className="secondaryButton compactButton" type="submit">
                Archivar
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </li>
  );
}
