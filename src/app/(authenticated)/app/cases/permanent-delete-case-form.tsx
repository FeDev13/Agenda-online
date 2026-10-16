"use client";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { useFormAction } from "@/components/use-form-action";

import { permanentlyDeleteCaseAction, type CaseFormState } from "./actions";

const initialState: CaseFormState = { message: null, ok: false };

type PermanentDeleteCaseFormProps = {
  caseId: string;
  caseNumber: string;
};

export function PermanentDeleteCaseForm({
  caseId,
  caseNumber
}: PermanentDeleteCaseFormProps) {
  const {
    state: state,
    formAction: formAction,
    pending: pending,
    onReset: formActionReset
  } = useFormAction(permanentlyDeleteCaseAction, initialState);
  const confirmationId = `delete-confirmation-${caseId}`;

  return (
    <form onReset={formActionReset} action={formAction} className="permanentDeleteForm">
      <input name="caseId" type="hidden" value={caseId} />
      <input name="caseNumber" type="hidden" value={caseNumber} />
      <FormField
        id={confirmationId}
        label={`Confirmar ${caseNumber}`}
        error={state.fieldErrors?.confirmation}
      >
        <input
          autoComplete="off"
          disabled={pending}
          id={confirmationId}
          name="confirmation"
          required
        />
      </FormField>
      <FormFeedback state={state} />
      <Button
        variant="danger-confirm"
        compact
        disabled={pending}
        type="submit"
        aria-busy={pending}
      >
        {pending ? "Eliminando..." : "Eliminar definitivamente"}
      </Button>
    </form>
  );
}
