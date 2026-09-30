import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="reset-password-title">
        <h1 id="reset-password-title">Recuperar acceso</h1>
        <p>Ingresá el email de tu invitación para recibir un enlace seguro.</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
