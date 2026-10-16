"use client";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { useFormAction } from "@/components/use-form-action";

import { createCaseAction, type CaseFormState } from "./actions";

const initialState: CaseFormState = { message: null, ok: false };

export function NewCaseForm({ canCreate }: { canCreate: boolean }) {
  const {
    state: state,
    formAction: formAction,
    pending: pending,
    onReset: formActionReset
  } = useFormAction(createCaseAction, initialState);

  return (
    <form onReset={formActionReset} action={formAction} className="formGrid">
      <div className="fieldRow">
        <FormField
          id="caseNumber"
          label="Número de causa"
          error={state.fieldErrors?.caseNumber}
        >
          <input disabled={!canCreate} id="caseNumber" name="caseNumber" required />
        </FormField>
        <FormField
          id="openedOn"
          label="Fecha de apertura"
          error={state.fieldErrors?.openedOn}
        >
          <input
            disabled={!canCreate}
            id="openedOn"
            name="openedOn"
            required
            type="date"
          />
        </FormField>
      </div>
      <FormField id="title" label="Título de la causa" error={state.fieldErrors?.title}>
        <input disabled={!canCreate} id="title" name="title" required />
      </FormField>
      <FormField id="clientName" label="Cliente" error={state.fieldErrors?.clientName}>
        <input disabled={!canCreate} id="clientName" name="clientName" required />
      </FormField>
      <div className="fieldRow">
        <FormField id="court" label="Juzgado" error={state.fieldErrors?.court}>
          <input disabled={!canCreate} id="court" name="court" />
        </FormField>
        <FormField
          id="docketNumber"
          label="Expediente"
          error={state.fieldErrors?.docketNumber}
        >
          <input disabled={!canCreate} id="docketNumber" name="docketNumber" />
        </FormField>
      </div>
      <FormField
        id="jurisdiction"
        label="Jurisdicción"
        error={state.fieldErrors?.jurisdiction}
      >
        <input disabled={!canCreate} id="jurisdiction" name="jurisdiction" />
      </FormField>
      <FormField
        id="description"
        label="Descripción interna"
        error={state.fieldErrors?.description}
      >
        <textarea disabled={!canCreate} id="description" name="description" />
      </FormField>
      <FormFeedback state={state} />
      <Button disabled={!canCreate || pending} type="submit" aria-busy={pending}>
        {pending ? "Creando..." : "Crear causa"}
      </Button>
    </form>
  );
}
