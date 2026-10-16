"use client";

import { Button } from "@/components/button";
import { FormField } from "@/components/form-field";
import { FormFeedback } from "@/components/form-feedback";
import { useFormAction } from "@/components/use-form-action";

import { formatFirmRole } from "@/lib/display-labels";
import type { FirmRole } from "@/types/database";

import { inviteFirmMemberAction, type InviteFirmMemberFormState } from "./actions";

const initialState: InviteFirmMemberFormState = {
  message: null,
  ok: false
};

const roleOptions: FirmRole[] = ["admin", "lawyer", "paralegal", "read_only"];

export function InviteMemberForm({ canInvite }: { canInvite: boolean }) {
  const {
    state: state,
    formAction: formAction,
    pending: pending,
    onReset: formActionReset
  } = useFormAction(inviteFirmMemberAction, initialState);

  return (
    <form onReset={formActionReset} action={formAction} className="formGrid">
      <FormField id="invite-email" label="Email" error={state.fieldErrors?.email}>
        <input
          autoComplete="email"
          disabled={!canInvite || pending}
          id="invite-email"
          name="email"
          required
          type="email"
        />
      </FormField>
      <FormField
        id="invite-display-name"
        label="Nombre visible"
        error={state.fieldErrors?.displayName}
      >
        <input
          autoComplete="name"
          disabled={!canInvite || pending}
          id="invite-display-name"
          name="displayName"
          type="text"
        />
      </FormField>
      <FormField id="invite-role" label="Rol" error={state.fieldErrors?.role}>
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
      </FormField>
      <FormFeedback state={state} />
      <Button disabled={!canInvite || pending} type="submit" aria-busy={pending}>
        {pending ? "Enviando..." : "Invitar integrante"}
      </Button>
    </form>
  );
}
