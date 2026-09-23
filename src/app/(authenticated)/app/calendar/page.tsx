import { canManageScheduling } from "@/lib/domain/authorization";
import { formatScheduleKind } from "@/lib/display-labels";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";
import { listUpcomingSchedule } from "@/lib/server/scheduling";

import { ScheduleForms } from "./schedule-forms";

export default async function CalendarPage() {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const [cases, schedule] = await Promise.all([listOpenCases(), listUpcomingSchedule()]);
  const canCreate = canManageScheduling(user.membership.role);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Agenda y vencimientos</h1>
          <p>
            Los eventos usan fecha y hora con zona horaria. Las tareas con vencimiento
            se muestran como fechas en la agenda.
          </p>
        </div>
      </div>
      <div className="grid two">
        <section className="panel" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title">Próximos ítems</h2>
          {schedule.length ? (
            <ul className="scheduleList">
              {schedule.map((item) => (
                <li className="card" key={`${item.kind}-${item.id}`}>
                  <div className="cardHeader">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="muted">
                        {item.caseTitle}
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </p>
                    </div>
                    <span className="badge">
                      {formatScheduleKind(item.kind)}: {item.dateLabel}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No hay eventos ni vencimientos visibles.</p>
          )}
        </section>
        <div className="grid">
          {!canCreate ? (
            <p className="errorText">Tu rol no permite crear entradas de agenda.</p>
          ) : null}
          {cases.length === 0 ? (
            <p className="emptyState">
              Creá una causa abierta antes de agregar ítems de agenda.
            </p>
          ) : null}
          <ScheduleForms canCreate={canCreate} cases={cases} />
        </div>
      </div>
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-firm-title">
      <h1 id="no-firm-title">Sin acceso activo al estudio</h1>
      <p className="muted">Se requiere una membresía activa para ver la agenda.</p>
    </section>
  );
}
