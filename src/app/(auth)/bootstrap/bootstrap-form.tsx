"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  bootstrapFirmAction,
  type BootstrapFirmFormState
} from "./actions";

const initialState: BootstrapFirmFormState = {
  message: null,
  ok: false
};

export function BootstrapForm() {
  const [state, formAction, pending] = useActionState(
    bootstrapFirmAction,
    initialState
  );

  return (
    <form action={formAction} className="formGrid">
      <div className="field">
        <label htmlFor="firmName">Estudio</label>
        <input
          autoComplete="organization"
          disabled={pending}
          id="firmName"
          name="firmName"
          required
          type="text"
        />
      </div>
      <div className="field">
        <label htmlFor="adminEmail">Email administrador</label>
        <input
          autoComplete="email"
          disabled={pending}
          id="adminEmail"
          name="adminEmail"
          required
          type="email"
        />
      </div>
      <div className="field">
        <label htmlFor="adminDisplayName">Nombre visible</label>
        <input
          autoComplete="name"
          disabled={pending}
          id="adminDisplayName"
          name="adminDisplayName"
          type="text"
        />
      </div>
      <div className="field">
        <label htmlFor="defaultTimezone">Zona horaria</label>
        <input
          disabled={pending}
          id="defaultTimezone"
          name="defaultTimezone"
          required
          type="text"
          defaultValue="America/Argentina/Buenos_Aires"
        />
      </div>
      <div className="field">
        <label htmlFor="bootstrapToken">Token de bootstrap</label>
        <input
          autoComplete="off"
          disabled={pending}
          id="bootstrapToken"
          name="bootstrapToken"
          required
          type="password"
        />
      </div>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "muted" : "errorText"}>
          {state.message}
        </p>
      ) : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Creando..." : "Crear estudio"}
      </button>
      <Link className="secondaryLink" href="/sign-in">
        Volver al ingreso
      </Link>
    </form>
  );
}
