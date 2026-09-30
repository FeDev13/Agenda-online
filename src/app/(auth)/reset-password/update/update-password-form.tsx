"use client";

import { useActionState } from "react";

import { updatePasswordAction, type PasswordUpdateState } from "./actions";

const initialState: PasswordUpdateState = {
  message: null
};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="formGrid">
      <div className="field">
        <label htmlFor="new-password">Nueva contraseña</label>
        <input
          autoComplete="new-password"
          disabled={pending}
          id="new-password"
          minLength={12}
          name="password"
          required
          type="password"
        />
      </div>
      <div className="field">
        <label htmlFor="confirm-password">Confirmar contraseña</label>
        <input
          autoComplete="new-password"
          disabled={pending}
          id="confirm-password"
          minLength={12}
          name="confirmPassword"
          required
          type="password"
        />
      </div>
      {state.message ? (
        <p aria-live="polite" className="errorText">
          {state.message}
        </p>
      ) : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
