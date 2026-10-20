import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { ScheduleBadge } from "@/components/schedule-badge";
import { canManageScheduling } from "@/lib/domain/authorization";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";
import { listAgenda } from "@/lib/server/agenda";
import { parseScheduleFilters } from "@/features/calendar/filters";
import { InlineNotice } from "@/components/inline-notice";

import { hideScheduleItemAction } from "./actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const [cases, upcoming, overdue, review] = await Promise.all([
    listOpenCases(),
    listAgenda(parseScheduleFilters({})),
    listAgenda(parseScheduleFilters({ scope: "overdue" })),
    listAgenda(parseScheduleFilters({ scope: "review" }))
  ]);
  const schedule = upcoming.entries;
  const canHideSchedule = canManageScheduling(user.membership.role);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Inicio</h1>
          <p>Causas abiertas y próximos compromisos de agenda.</p>
        </div>
        <div>
          <Link className="button" href="/app/cases">
            Gestionar causas
          </Link>
        </div>
      </div>

      <section className="metricGrid" aria-label="Indicadores del estudio">
        <div className="metric">
          <span>Causas abiertas visibles</span>
          <strong>{cases.length}</strong>
        </div>
        <div className="metric">
          <span>Entradas próximas</span>
          <strong>{upcoming.total}</strong>
        </div>
        <div className="metric">
          <span>Vencidos pendientes</span>
          <strong>{overdue.total}</strong>
        </div>
      </section>

      {overdue.total > 0 ? (
        <InlineNotice tone="error">
          Hay {overdue.total} obligaciones vencidas pendientes.{" "}
          <Link className="inlineLink" href="/app/calendar?scope=overdue">
            Revisar vencidos
          </Link>
        </InlineNotice>
      ) : null}
      {review.total > 0 ? (
        <InlineNotice>
          Hay {review.total} vencimientos históricos por revisar.{" "}
          <Link className="inlineLink" href="/app/calendar?scope=review">
            Revisar su estado
          </Link>
        </InlineNotice>
      ) : null}
      <div className="grid two" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="dashboard-cases">
          <h2 id="dashboard-cases">Últimas causas actualizadas</h2>
          {cases.length ? (
            <ul className="caseList">
              {cases.slice(0, 5).map((caseItem) => (
                <li className="card" key={caseItem.id}>
                  <div className="cardHeader">
                    <div>
                      <strong>{caseItem.title}</strong>
                      <p className="muted">{caseItem.clientName}</p>
                      <Link className="textLink" href={`/app/cases/${caseItem.id}`}>
                        Ver causa
                      </Link>
                    </div>
                    <span className="badge">{caseItem.caseNumber}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">
              No hay causas abiertas visibles para esta cuenta.
            </p>
          )}
        </section>

        <section className="panel" aria-labelledby="dashboard-schedule">
          <h2 id="dashboard-schedule">Próxima agenda</h2>
          {schedule.length ? (
            <ul className="scheduleList">
              {schedule.slice(0, 6).map((item) => (
                <li className="card" key={`${item.kind}-${item.id}`}>
                  <div className="cardHeader">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="muted">
                        <Link className="inlineLink" href={`/app/cases/${item.caseId}`}>
                          {item.caseTitle}
                        </Link>
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </p>
                    </div>
                    <div className="stackedActions">
                      <ScheduleBadge
                        dateLabel={item.dateLabel}
                        urgencyLabel={item.urgencyLabel}
                        deadlineProximity={item.deadlineProximity}
                        kind={item.kind}
                      />
                      {canHideSchedule && item.kind !== "task" ? (
                        <ActionForm
                          action={hideScheduleItemAction}
                          label="Ocultar"
                          variant="quiet"
                          pendingLabel="Ocultando…"
                          confirmation={`“${item.title}” dejará de aparecer en la agenda de todo el estudio. No se elimina de la causa.`}
                        >
                          <input name="id" type="hidden" value={item.id} />
                          <input name="kind" type="hidden" value={item.kind} />
                        </ActionForm>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No hay eventos ni vencimientos visibles.</p>
          )}
        </section>
      </div>
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-access-title">
      <h1 id="no-access-title">Sin acceso activo al estudio</h1>
      <p className="muted">
        Esta cuenta ingresó correctamente, pero no tiene una membresía activa en un
        estudio. Una persona administradora debe crear o aceptar la invitación antes de
        habilitar datos de causas.
      </p>
    </section>
  );
}
