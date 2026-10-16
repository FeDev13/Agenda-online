"use client";

import Link from "next/link";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { useFormAction } from "@/components/use-form-action";

import type { OpenCaseSummary } from "@/lib/server/cases";

import { createEventAction, type ScheduleFormState } from "./actions";

const initialState: ScheduleFormState = { message: null, ok: false };

export function ScheduleForms({
  canCreate,
  cases,
  timeZone
}: {
  canCreate: boolean;
  cases: OpenCaseSummary[];
  timeZone: string;
}) {
  const {
    state: eventState,
    formAction: eventAction,
    pending: eventPending,
    onReset: eventActionReset
  } = useFormAction(createEventAction, initialState);
  const disabled = !canCreate || cases.length === 0;

  return (
    <div className="grid">
      <section className="panel" aria-labelledby="new-event-title">
        <h2 id="new-event-title">Crear evento</h2>
        <form onReset={eventActionReset} action={eventAction} className="formGrid">
          <CaseSelect
            cases={cases}
            disabled={disabled}
            id="event-case"
            error={eventState.fieldErrors?.caseId}
          />
          <FormField
            id="event-title"
            label="Título"
            error={eventState.fieldErrors?.title}
          >
            <input disabled={disabled} id="event-title" name="title" required />
          </FormField>
          <div className="fieldRow">
            <FormField
              id="startsAtLocal"
              label="Inicio"
              error={eventState.fieldErrors?.startsAtLocal}
            >
              <input
                disabled={disabled}
                id="startsAtLocal"
                name="startsAtLocal"
                required
                type="datetime-local"
              />
            </FormField>
            <FormField
              id="endsAtLocal"
              label="Fin"
              error={eventState.fieldErrors?.endsAtLocal}
            >
              <input
                disabled={disabled}
                id="endsAtLocal"
                name="endsAtLocal"
                type="datetime-local"
              />
            </FormField>
          </div>
          <FormField
            id="timezone"
            label="Zona horaria"
            error={eventState.fieldErrors?.timezone}
          >
            <input
              defaultValue={timeZone}
              disabled={disabled}
              id="timezone"
              name="timezone"
              required
            />
          </FormField>
          <FormField id="location" label="Lugar" error={eventState.fieldErrors?.location}>
            <input disabled={disabled} id="location" name="location" />
          </FormField>
          <FormField
            id="event-description"
            label="Descripción"
            error={eventState.fieldErrors?.description}
          >
            <textarea disabled={disabled} id="event-description" name="description" />
          </FormField>
          <FormFeedback state={eventState} />
          {eventState.ok ? (
            <Link className="inlineLink" href="/app/calendar?scope=all&kind=event">
              Ver eventos creados, incluidos los anteriores
            </Link>
          ) : null}
          <Button
            disabled={disabled || eventPending}
            type="submit"
            aria-busy={eventPending}
          >
            {eventPending ? "Creando..." : "Crear evento"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function CaseSelect({
  cases,
  disabled,
  id,
  error
}: {
  cases: OpenCaseSummary[];
  disabled: boolean;
  id: string;
  error?: string;
}) {
  return (
    <FormField id={id} label="Causa" error={error}>
      <select disabled={disabled} id={id} name="caseId" required>
        <option value="">Seleccionar causa</option>
        {cases.map((caseItem) => (
          <option key={caseItem.id} value={caseItem.id}>
            {caseItem.caseNumber} - {caseItem.title}
          </option>
        ))}
      </select>
    </FormField>
  );
}
