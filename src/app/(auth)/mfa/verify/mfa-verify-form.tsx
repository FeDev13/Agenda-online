"use client";

import { useFormAction } from "@/components/use-form-action";

import { verifyMfaAction, type MfaVerifyState } from "./actions";

const initialState: MfaVerifyState = {
  message: null
};

export function MfaVerifyForm({
  factors,
  next
}: {
  factors: Array<{ friendly_name?: string; id: string }>;
  next: string;
}) {
  const {
    state: state,
    formAction: formAction,
    pending: pending,
    onReset: formActionReset
  } = useFormAction(verifyMfaAction, initialState);

  return (
    <form onReset={formActionReset} action={formAction} className="formGrid">
      <input name="next" type="hidden" value={next} />
      {factors.length === 1 ? (
        <input name="factorId" type="hidden" value={factors[0]?.id} />
      ) : (
        <div className="field">
          <label htmlFor="factorId">Segundo factor</label>
          <select id="factorId" name="factorId" required>
            {factors.map((factor) => (
              <option key={factor.id} value={factor.id}>
                {factor.friendly_name ?? "App autenticadora"}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor="mfa-code">Código de autenticación</label>
        <input
          autoComplete="one-time-code"
          id="mfa-code"
          inputMode="numeric"
          name="code"
          pattern="[0-9]{6}"
          required
        />
      </div>
      {state.message ? (
        <p aria-live="polite" className="errorText">
          {state.message}
        </p>
      ) : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Verificando..." : "Verificar"}
      </button>
    </form>
  );
}
