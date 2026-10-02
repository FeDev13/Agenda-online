import { BootstrapForm } from "./bootstrap-form";

export default function BootstrapPage() {
  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="bootstrap-title">
        <h1 id="bootstrap-title">Bootstrap de estudio</h1>
        <p>Creá el estudio inicial y registrá la invitación administradora.</p>
        <BootstrapForm />
      </section>
    </main>
  );
}
