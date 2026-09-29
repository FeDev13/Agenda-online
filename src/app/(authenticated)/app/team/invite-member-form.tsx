"use client";

import { useActionState } from "react";

import { formatFirmRole } from "@/lib/display-labels";
import type { FirmRole } from "@/types/database";

import { inviteFirmMemberAction, type InviteFirmMemberFormState } from "./actions";

const initialState: InviteFirmMemberFormState = {
  message: null,
  ok: false
};

const roleOptions: FirmRole[] = ["admin", "lawyer", "paralegal", "read_only"];

export function InviteMemberForm({ canInvite }: { canInvite: boolean }) {
  const [state, formAction, pending] = useActionState(
    inviteFirmMemberAction,
    initialState
  );

  return (
    <form action={formAction} className="formGrid">
      <div className="field">
        <label htmlFor="invite-email">Email</label>
        <input
          autoComplete="email"
          disabled={!canInvite || pending}
          id="invite-email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="field">
        <label htmlFor="invite-display-name">Nombre visible</label>
        <input
          autoComplete="name"
          disabled={!canInvite || pending}
          id="invite-display-name"
          name="displayName"
          type="text"
        />
      </div>
      <div className="field">
        <label htmlFor="invite-role">Rol</label>
        <select
          defaultValue="read_only"
          disabled={!canInvite || pending}
          id="invite-role"
          name="role"
          required
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {formatFirmRole(role)}
            </option>
          ))}
        </select>
      </div>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "muted" : "errorText"}>
          {state.message}
        </p>
      ) : null}
      <button className="button" disabled={!canInvite || pending} type="submit">
        {pending ? "Enviando..." : "Invitar integrante"}
      </button>
    </form>
  );
}
