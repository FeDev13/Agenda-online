"use client";

import Link from "next/link";
import { useFormAction } from "@/components/use-form-action";

import { requestPasswordResetAction, type PasswordResetRequestState } from "./actions";

const initialState: PasswordResetRequestState = {
  message: null,
  ok: false
};

export function ResetPasswordForm() {
  const {
    state: state,
    formAction: formAction,
    pending: pending,
    onReset: formActionReset
  } = useFormAction(requestPasswordResetAction, initialState);

  return (
    <form onReset={formActionReset} action={formAction} className="formGrid">
      <div className="field">
        <label htmlFor="reset-email">Correo electrónico</label>
        <input
          autoComplete="email"
          disabled={pending}
          id="reset-email"
          name="email"
          required
          type="email"
        />
      </div>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "muted" : "errorText"}>
          {state.message}
        </p>
      ) : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Enviando..." : "Enviar enlace"}
      </button>
      <Link className="secondaryLink" href="/sign-in">
        Volver al ingreso
      </Link>
    </form>
  );
}
