import { sanitizeProtectedNextPath } from "@/lib/routes";

import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = sanitizeProtectedNextPath(params.next);

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="signin-title">
        <h1 id="signin-title">Agenda Legal</h1>
        <p>
          Ingresá con la invitación de tu estudio. El registro público está
          deshabilitado.
        </p>
        <SignInForm next={next} />
      </section>
    </main>
  );
}
