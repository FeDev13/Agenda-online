"use client";

import { useActionState } from "react";

import type { OpenCaseSummary } from "@/lib/server/cases";
import type { FirmMemberSummary } from "@/lib/server/team";

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
        <label htmlFor="assignment-case">Case</label>
        <select disabled={disabled} id="assignment-case" name="caseId" required>
          <option value="">Select a case</option>
          {cases.map((caseItem) => (
            <option key={caseItem.id} value={caseItem.id}>
              {caseItem.caseNumber} - {caseItem.title}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="assignment-member">Team member</label>
        <select disabled={disabled} id="assignment-member" name="profileId" required>
          <option value="">Select a member</option>
          {members.map((member) => (
            <option key={member.profileId} value={member.profileId}>
              {member.displayName ?? member.email} - {member.role.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="assignment-role">Assignment role</label>
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
        {pending ? "Assigning..." : "Assign case access"}
      </button>
    </form>
  );
}
