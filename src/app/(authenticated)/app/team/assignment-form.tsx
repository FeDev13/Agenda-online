"use client";

import { useActionState } from "react";

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
  const [state, formAction, pending] = useActionState(
    assignCaseMemberAction,
    initialState
  );
  const disabled = !canAssign || cases.length === 0 || members.length === 0;

  return (
    <form action={formAction} className="formGrid">
      <div className="field">
        <label htmlFor="assignment-case">Causa</label>
        <select disabled={disabled} id="assignment-case" name="caseId" required>
          <option value="">Seleccionar causa</option>
          {cases.map((caseItem) => (
            <option key={caseItem.id} value={caseItem.id}>
              {caseItem.caseNumber} - {caseItem.title}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="assignment-member">Integrante del equipo</label>
        <select disabled={disabled} id="assignment-member" name="profileId" required>
          <option value="">Seleccionar integrante</option>
          {members.map((member) => (
            <option key={member.profileId} value={member.profileId}>
              {member.displayName ?? member.email} - {formatFirmRole(member.role)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="assignment-role">Rol de asignación</label>
        <input
          defaultValue="assigned"
          disabled={disabled}
          id="assignment-role"
          name="role"
          required
        />
      </div>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "muted" : "errorText"}>
          {state.message}
        </p>
      ) : null}
      <button className="button" disabled={disabled || pending} type="submit">
        {pending ? "Asignando..." : "Asignar acceso a la causa"}
      </button>
    </form>
  );
}
