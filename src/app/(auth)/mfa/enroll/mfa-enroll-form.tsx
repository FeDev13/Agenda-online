"use client";

import { useActionState } from "react";

import {
  startMfaEnrollmentAction,
  verifyMfaEnrollmentAction,
  type MfaEnrollState,
  type MfaVerifyEnrollmentState
} from "./actions";

const initialEnrollState: MfaEnrollState = {
  enrollment: null,
  message: null
};

const initialVerifyState: MfaVerifyEnrollmentState = {
  message: null
};

export function MfaEnrollForm({ next }: { next: string }) {
  const [enrollState, enrollAction, enrollPending] = useActionState(
    startMfaEnrollmentAction,
    initialEnrollState
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyMfaEnrollmentAction,
    initialVerifyState
  );

  return (
    <div className="formGrid">
      {!enrollState.enrollment ? (
        <form action={enrollAction} className="formGrid">
          <button className="button" disabled={enrollPending} type="submit">
            {enrollPending ? "Generando..." : "Generar segundo factor"}
          </button>
          {enrollState.message ? (
            <p aria-live="polite" className="errorText">
              {enrollState.message}
            </p>
          ) : null}
        </form>
      ) : (
        <>
          <div className="mfaQrBlock">
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns a local SVG data URI for the TOTP QR code. */}
            <img
              alt="Código QR para configurar el autenticador"
              className="mfaQrImage"
              src={enrollState.enrollment.qrCodeDataUrl}
            />
            <code>{enrollState.enrollment.secret}</code>
          </div>
          <form action={verifyAction} className="formGrid">
            <input
              name="factorId"
              type="hidden"
              value={enrollState.enrollment.factorId}
            />
            <input name="next" type="hidden" value={next} />
            <div className="field">
              <label htmlFor="mfa-enroll-code">Código de autenticación</label>
              <input
                autoComplete="one-time-code"
                id="mfa-enroll-code"
                inputMode="numeric"
                name="code"
                pattern="[0-9]{6}"
                required
              />
            </div>
            {verifyState.message ? (
              <p aria-live="polite" className="errorText">
                {verifyState.message}
              </p>
            ) : null}
            <button className="button" disabled={verifyPending} type="submit">
              {verifyPending ? "Verificando..." : "Verificar"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
