"use client";

import { useActionState } from "react";

import type { OpenCaseSummary } from "@/lib/server/cases";

import { createEventAction, type ScheduleFormState } from "./actions";

const initialState: ScheduleFormState = { message: null, ok: false };

export function ScheduleForms({
  canCreate,
  cases
}: {
  canCreate: boolean;
  cases: OpenCaseSummary[];
}) {
  const [eventState, eventAction, eventPending] = useActionState(
    createEventAction,
    initialState
  );
  const disabled = !canCreate || cases.length === 0;

  return (
    <div className="grid">
      <section className="panel" aria-labelledby="new-event-title">
        <h2 id="new-event-title">Crear evento</h2>
        <form action={eventAction} className="formGrid">
          <CaseSelect cases={cases} disabled={disabled} id="event-case" />
          <div className="field">
            <label htmlFor="event-title">Título</label>
            <input disabled={disabled} id="event-title" name="title" required />
          </div>
          <div className="fieldRow">
            <div className="field">
              <label htmlFor="startsAtLocal">Inicio</label>
              <input
                disabled={disabled}
                id="startsAtLocal"
                name="startsAtLocal"
                required
                type="datetime-local"
              />
            </div>
            <div className="field">
              <label htmlFor="endsAtLocal">Fin</label>
              <input
                disabled={disabled}
                id="endsAtLocal"
                name="endsAtLocal"
                type="datetime-local"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="timezone">Zona horaria</label>
            <input
              defaultValue="America/Argentina/Buenos_Aires"
              disabled={disabled}
              id="timezone"
              name="timezone"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="location">Lugar</label>
            <input disabled={disabled} id="location" name="location" />
          </div>
          <div className="field">
            <label htmlFor="event-description">Descripción</label>
            <textarea disabled={disabled} id="event-description" name="description" />
          </div>
          {eventState.message ? (
            <p aria-live="polite" className={eventState.ok ? "muted" : "errorText"}>
              {eventState.message}
            </p>
          ) : null}
          <button className="button" disabled={disabled || eventPending} type="submit">
            {eventPending ? "Creando..." : "Crear evento"}
          </button>
        </form>
      </section>
    </div>
  );
}

function CaseSelect({
  cases,
  disabled,
  id
}: {
  cases: OpenCaseSummary[];
  disabled: boolean;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>Causa</label>
      <select disabled={disabled} id={id} name="caseId" required>
        <option value="">Seleccionar causa</option>
        {cases.map((caseItem) => (
          <option key={caseItem.id} value={caseItem.id}>
            {caseItem.caseNumber} - {caseItem.title}
          </option>
        ))}
      </select>
    </div>
  );
}
