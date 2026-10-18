import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { formatFee } from "@/features/honorarios/validation";
import { listHonorarios } from "@/lib/server/honorarios";
import { saveFeeEstimateAction } from "./actions";

export default async function HonorariosPage() {
  const { cases, estimates, canManage } = await listHonorarios();
  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Honorarios</h1>
          <p>
            Ingreso total esperado por causa, estimado manualmente. No representa cobros
            ni saldo pendiente.
          </p>
        </div>
      </div>
      <section className="panel" aria-labelledby="fee-totals">
        <h2 id="fee-totals">Total esperado · causas abiertas</h2>
        {["ARS", "USD"].map((currency) => (
          <p key={currency}>
            {formatFee(
              estimates
                .filter(
                  (estimate) =>
                    estimate.currency === currency &&
                    cases.some(
                      (caseItem) =>
                        caseItem.id === estimate.case_id && caseItem.status === "open"
                    )
                )
                .reduce((sum, estimate) => sum + estimate.amount_cents, 0),
              currency
            )}
          </p>
        ))}
        <p className="muted">
          Solo incluye estimaciones registradas en causas visibles. Las monedas se
          muestran por separado.
        </p>
      </section>
      <div className="grid">
        {cases.length === 0 ? (
          <p className="emptyState">No hay causas visibles.</p>
        ) : (
          cases.map((caseItem) => (
            <section className="panel" key={caseItem.id}>
              <h2>
                <Link href={`/app/cases/${caseItem.id}`}>
                  {caseItem.case_number} · {caseItem.title}
                </Link>
              </h2>
              <p className="muted">
                {caseItem.status === "open"
                  ? "Causa abierta"
                  : "Causa cerrada o archivada · solo consulta"}
              </p>
              {["ARS", "USD"].map((currency) => {
                const estimate = estimates.find(
                  (fee) => fee.case_id === caseItem.id && fee.currency === currency
                );
                const fieldId = `fee-${caseItem.id}-${currency}`;
                return (
                  <div key={currency}>
                    <p>
                      {estimate
                        ? formatFee(estimate.amount_cents, currency)
                        : `${currency} · Sin estimación`}
                    </p>
                    {canManage && caseItem.status === "open" ? (
                      <ActionForm
                        key={`${fieldId}-${estimate?.revision ?? 0}`}
                        action={saveFeeEstimateAction}
                        label={`Guardar ${currency}`}
                      >
                        <input type="hidden" name="caseId" value={caseItem.id} />
                        <input type="hidden" name="currency" value={currency} />
                        <input
                          type="hidden"
                          name="expectedRevision"
                          value={estimate?.revision ?? 0}
                        />
                        <div className="field">
                          <label htmlFor={fieldId}>Ingreso esperado ({currency})</label>
                          <input
                            id={fieldId}
                            name="amount"
                            type="text"
                            inputMode="decimal"
                            required
                            maxLength={13}
                            defaultValue={
                              estimate ? (estimate.amount_cents / 100).toFixed(2) : ""
                            }
                            placeholder="0,00"
                          />
                        </div>
                      </ActionForm>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
    </>
  );
}
