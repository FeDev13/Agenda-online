"use client";

import { useActionState } from "react";

import type { OpenCaseSummary } from "@/lib/server/cases";

import {
  createDeadlineAction,
  createEventAction,
  type ScheduleFormState
} from "./actions";

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
  const [deadlineState, deadlineAction, deadlinePending] = useActionState(
    createDeadlineAction,
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

      <section className="panel" aria-labelledby="new-deadline-title">
        <h2 id="new-deadline-title">Crear vencimiento legal</h2>
        <form action={deadlineAction} className="formGrid">
          <CaseSelect cases={cases} disabled={disabled} id="deadline-case" />
          <div className="field">
            <label htmlFor="deadline-title">Título</label>
            <input disabled={disabled} id="deadline-title" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="dueOn">Fecha de vencimiento</label>
            <input disabled={disabled} id="dueOn" name="dueOn" required type="date" />
          </div>
          <div className="field">
            <label htmlFor="ruleSource">Fuente de la regla</label>
            <input disabled={disabled} id="ruleSource" name="ruleSource" />
          </div>
          <div className="field">
            <label htmlFor="calculationNotes">Notas de cálculo</label>
            <textarea disabled={disabled} id="calculationNotes" name="calculationNotes" />
          </div>
          {deadlineState.message ? (
            <p aria-live="polite" className={deadlineState.ok ? "muted" : "errorText"}>
              {deadlineState.message}
            </p>
          ) : null}
          <button className="button" disabled={disabled || deadlinePending} type="submit">
            {deadlinePending ? "Creando..." : "Crear vencimiento"}
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
