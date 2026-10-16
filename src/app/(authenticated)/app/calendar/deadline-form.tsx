"use client";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { useFormAction } from "@/components/use-form-action";
import type { OpenCaseSummary } from "@/lib/server/cases";
import { createDeadlineAction, type ScheduleFormState } from "./actions";

const initialState: ScheduleFormState = { ok: false, message: null };

export function DeadlineForm({ cases }: { cases: OpenCaseSummary[] }) {
  const { state, formAction, pending, onReset } = useFormAction(
    createDeadlineAction,
    initialState
  );
  return (
    <form action={formAction} onReset={onReset} className="formGrid">
      <p className="muted">
        Ingresá una fecha revisada por una persona. La aplicación no calcula plazos
        legales.
      </p>
      <FormField id="deadline-case" label="Causa" error={state.fieldErrors?.caseId}>
        <select name="caseId" required disabled={pending}>
          <option value="">Seleccionar causa</option>
          {cases.map((caseItem) => (
            <option key={caseItem.id} value={caseItem.id}>
              {caseItem.caseNumber} - {caseItem.title}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        id="deadline-title"
        label="Título del vencimiento"
        error={state.fieldErrors?.title}
      >
        <input name="title" maxLength={220} required disabled={pending} />
      </FormField>
      <FormField
        id="deadline-due-on"
        label="Fecha del vencimiento"
        error={state.fieldErrors?.dueOn}
      >
        <input name="dueOn" type="date" required disabled={pending} />
      </FormField>
      <FormField
        id="deadline-rule-source"
        label="Fuente de la fecha"
        error={state.fieldErrors?.ruleSource}
      >
        <textarea
          name="ruleSource"
          placeholder="Por ejemplo, resolución u orden judicial revisada"
          maxLength={1000}
          required
          disabled={pending}
        />
      </FormField>
      <div className="checkboxField">
        <input
          id="deadline-confirmed"
          name="confirmed"
          type="checkbox"
          required
          disabled={pending}
          aria-invalid={state.fieldErrors?.confirmed ? true : undefined}
          aria-describedby={
            state.fieldErrors?.confirmed ? "deadline-confirmation-error" : undefined
          }
        />
        <label htmlFor="deadline-confirmed">
          Confirmo que revisé la fecha y su fuente.
        </label>
      </div>
      {state.fieldErrors?.confirmed ? (
        <p id="deadline-confirmation-error" className="fieldError">
          {state.fieldErrors.confirmed}
        </p>
      ) : null}
      <FormFeedback state={state} />
      <Button type="submit" disabled={pending || cases.length === 0} aria-busy={pending}>
        {pending ? "Guardando…" : "Crear vencimiento"}
      </Button>
    </form>
  );
}
