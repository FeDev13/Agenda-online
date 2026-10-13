"use client";

import { useActionState } from "react";

import {
  permanentlyDeleteCaseAction,
  type CaseFormState
} from "./actions";

const initialState: CaseFormState = { message: null, ok: false };

type PermanentDeleteCaseFormProps = {
  caseId: string;
  caseNumber: string;
};

export function PermanentDeleteCaseForm({
  caseId,
  caseNumber
}: PermanentDeleteCaseFormProps) {
  const [state, formAction, pending] = useActionState(
    permanentlyDeleteCaseAction,
    initialState
  );
  const confirmationId = `delete-confirmation-${caseId}`;

  return (
    <form action={formAction} className="permanentDeleteForm">
      <input name="caseId" type="hidden" value={caseId} />
      <input name="caseNumber" type="hidden" value={caseNumber} />
      <div className="field">
        <label htmlFor={confirmationId}>Confirmar {caseNumber}</label>
        <input
          autoComplete="off"
          disabled={pending}
          id={confirmationId}
          name="confirmation"
          required
        />
      </div>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "muted" : "errorText"}>
          {state.message}
        </p>
      ) : null}
      <button
        className="secondaryButton dangerButton compactButton"
        disabled={pending}
        type="submit"
      >
        {pending ? "Eliminando..." : "Eliminar definitivamente"}
      </button>
    </form>
  );
}
