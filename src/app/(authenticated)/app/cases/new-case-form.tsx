"use client";

import { useActionState } from "react";

import { createCaseAction, type CaseFormState } from "./actions";

const initialState: CaseFormState = { message: null, ok: false };

export function NewCaseForm({ canCreate }: { canCreate: boolean }) {
  const [state, formAction, pending] = useActionState(createCaseAction, initialState);

  return (
    <form action={formAction} className="formGrid">
      <div className="fieldRow">
        <div className="field">
          <label htmlFor="caseNumber">Case number</label>
          <input disabled={!canCreate} id="caseNumber" name="caseNumber" required />
        </div>
        <div className="field">
          <label htmlFor="openedOn">Opened on</label>
          <input
            disabled={!canCreate}
            id="openedOn"
            name="openedOn"
            required
            type="date"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="title">Case title</label>
        <input disabled={!canCreate} id="title" name="title" required />
      </div>
      <div className="field">
        <label htmlFor="clientName">Client</label>
        <input disabled={!canCreate} id="clientName" name="clientName" required />
      </div>
      <div className="fieldRow">
        <div className="field">
          <label htmlFor="court">Court</label>
          <input disabled={!canCreate} id="court" name="court" />
        </div>
        <div className="field">
          <label htmlFor="docketNumber">Docket number</label>
          <input disabled={!canCreate} id="docketNumber" name="docketNumber" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="jurisdiction">Jurisdiction</label>
        <input disabled={!canCreate} id="jurisdiction" name="jurisdiction" />
      </div>
      <div className="field">
        <label htmlFor="description">Internal description</label>
        <textarea disabled={!canCreate} id="description" name="description" />
      </div>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "muted" : "errorText"}>
          {state.message}
        </p>
      ) : null}
      <button className="button" disabled={!canCreate || pending} type="submit">
        {pending ? "Creating..." : "Create case"}
      </button>
    </form>
  );
}
