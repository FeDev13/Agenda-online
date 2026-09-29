import { redirect } from "next/navigation";

import { sanitizeProtectedNextPath } from "@/lib/routes";
import { getMfaStatus, requireUser } from "@/lib/server/auth";

import { MfaVerifyForm } from "./mfa-verify-form";

export default async function MfaVerifyPage({
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

  if (status.needsEnrollment) {
    redirect(`/mfa/enroll?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="mfa-verify-title">
        <h1 id="mfa-verify-title">Verificar segundo factor</h1>
        <p>Ingresá el código de tu app autenticadora para continuar.</p>
        <MfaVerifyForm factors={status.verifiedTotpFactors} next={next} />
      </section>
    </main>
  );
}
