"use client";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { InlineNotice } from "@/components/inline-notice";
import { useFormAction } from "@/components/use-form-action";

import type { OpenCaseSummary } from "@/lib/server/cases";
import type { FirmMemberSummary } from "@/lib/server/team";
import { formatFirmRole } from "@/lib/display-labels";

import { assignCaseMemberAction, type AssignCaseMemberFormState } from "./actions";

const initialState: AssignCaseMemberFormState = { message: null, ok: false };

export function AssignmentForm({
  canAssign,
  cases,
  members
}: {
  canAssign: boolean;
  cases: OpenCaseSummary[];
  members: FirmMemberSummary[];
}) {
  const {
    state: state,
    formAction: formAction,
    pending: pending,
    onReset: formActionReset
  } = useFormAction(assignCaseMemberAction, initialState);
  const disabled = !canAssign || cases.length === 0 || members.length === 0;

  return (
    <form onReset={formActionReset} action={formAction} className="formGrid">
      {disabled ? (
        <InlineNotice>
          Necesitás una causa abierta e integrantes activos para asignar acceso.
        </InlineNotice>
      ) : null}
      <FormField id="assignment-case" label="Causa" error={state.fieldErrors?.caseId}>
        <select disabled={disabled} id="assignment-case" name="caseId" required>
          <option value="">Seleccionar causa</option>
          {cases.map((caseItem) => (
            <option key={caseItem.id} value={caseItem.id}>
              {caseItem.caseNumber} - {caseItem.title}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        id="assignment-member"
        label="Integrante del equipo"
        error={state.fieldErrors?.profileId}
      >
        <select disabled={disabled} id="assignment-member" name="profileId" required>
          <option value="">Seleccionar integrante</option>
          {members.map((member) => (
            <option key={member.profileId} value={member.profileId}>
              {member.displayName ?? member.email} - {formatFirmRole(member.role)}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        id="assignment-role"
        label="Rol de asignación"
        error={state.fieldErrors?.role}
      >
        <input
          defaultValue="assigned"
          disabled={disabled}
          id="assignment-role"
          name="role"
          required
        />
      </FormField>
      <FormFeedback state={state} />
      <Button disabled={disabled || pending} type="submit" aria-busy={pending}>
        {pending ? "Asignando..." : "Asignar acceso a la causa"}
      </Button>
    </form>
  );
}
