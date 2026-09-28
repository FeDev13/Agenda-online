import Link from "next/link";

import { ScheduleBadge } from "@/components/schedule-badge";
import { canManageCases, canManageScheduling } from "@/lib/domain/authorization";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";
import { listUpcomingSchedule } from "@/lib/server/scheduling";

import { hideScheduleItemAction } from "./actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const [cases, schedule] = await Promise.all([listOpenCases(), listUpcomingSchedule()]);
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
          <span>Causas abiertas</span>
          <strong>{cases.length}</strong>
        </div>
        <div className="metric">
          <span>Próximos ítems</span>
          <strong>{schedule.length}</strong>
        </div>
        <div className="metric">
          <span>MFA</span>
          <strong>Listo</strong>
        </div>
      </section>

      <div className="grid two" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="dashboard-cases">
          <h2 id="dashboard-cases">Causas abiertas recientes</h2>
          {cases.length ? (
            <ul className="caseList">
              {cases.slice(0, 5).map((caseItem) => (
                <li className="card" key={caseItem.id}>
                  <div className="cardHeader">
                    <div>
                      <strong>{caseItem.title}</strong>
                      <p className="muted">{caseItem.clientName}</p>
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
                        {item.caseTitle}
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </p>
                    </div>
                    <div className="stackedActions">
                      <ScheduleBadge
                        dateLabel={item.dateLabel}
                        deadlineProximity={item.deadlineProximity}
                        kind={item.kind}
                      />
                      {canHideSchedule && item.kind !== "task" ? (
                        <form action={hideScheduleItemAction}>
                          <input name="id" type="hidden" value={item.id} />
                          <input name="kind" type="hidden" value={item.kind} />
                          <button className="secondaryButton compactButton" type="submit">
                            Ocultar
                          </button>
                        </form>
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

      <section
        className="panel"
        style={{ marginTop: 18 }}
        aria-labelledby="security-note"
      >
        <h2 id="security-note">Acceso</h2>
        <p className="muted">
          Los datos de las causas se leen mediante servicios del servidor y RLS de
          Supabase. Esta cuenta{" "}
          {canManageCases(user.membership.role) ? "puede" : "no puede"} crear causas y{" "}
          {canManageScheduling(user.membership.role) ? "puede" : "no puede"} crear
          entradas de agenda.
        </p>
      </section>
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
