import { redirect } from "next/navigation";

import { sanitizeProtectedNextPath } from "@/lib/routes";
import { getMfaStatus, requireUser } from "@/lib/server/auth";

import { MfaEnrollForm } from "./mfa-enroll-form";

export default async function MfaEnrollPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = sanitizeProtectedNextPath(params.next);
  const user = await requireUser();
  const status = await getMfaStatus(user);

  if (!status.mfaRequired || status.currentLevel === "aal2") {
    redirect(next);
  }

  if (!status.needsEnrollment) {
    redirect(`/mfa/verify?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="mfa-enroll-title">
        <h1 id="mfa-enroll-title">Configurar segundo factor</h1>
        <p>Escaneá el código con una app autenticadora y confirmá el código.</p>
        <MfaEnrollForm next={next} />
      </section>
    </main>
  );
}
