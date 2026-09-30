"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { message: null };

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="formGrid">
      <input name="next" type="hidden" value={next} />
      <div className="field">
        <label htmlFor="email">Correo electronico</label>
        <input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          autoComplete="current-password"
          id="password"
          name="password"
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
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
      <Link className="secondaryLink" href="/reset-password">
        Recuperar acceso
      </Link>
    </form>
  );
}
