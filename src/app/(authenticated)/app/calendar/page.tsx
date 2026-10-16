import Link from "next/link";

import { ActionForm } from "@/components/action-form";
import { InlineNotice } from "@/components/inline-notice";
import { ScheduleBadge } from "@/components/schedule-badge";
import { agendaHref, parseScheduleFilters } from "@/features/calendar/filters";
import { canManageScheduling } from "@/lib/domain/authorization";
import { formatDateOnly, formatTimeZone } from "@/lib/presentation";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";
import { listAgenda } from "@/lib/server/agenda";
import type { DeadlineStatus } from "@/types/database";

import { ScheduleForms } from "./schedule-forms";
import { DeadlineForm } from "./deadline-form";
import { DeadlineStatusActions, deadlineStatusLabels } from "./deadline-status-actions";
import { updateTaskStatusAction } from "../cases/[caseId]/actions";

const scopes = {
  upcoming: "Próximos ítems",
  overdue: "Vencidos",
  review: "Por revisar",
  resolved: "Resueltos",
  all: "Todas las entradas"
} as const;

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user?.membership)
    return (
      <section className="panel">
        <h1>Sin acceso activo al estudio</h1>
        <p className="muted">Se requiere una membresía activa para ver la agenda.</p>
      </section>
    );
  const filters = parseScheduleFilters(await searchParams);
  const [cases, agenda] = await Promise.all([listOpenCases(), listAgenda(filters)]);
  const dates = [...new Set(agenda.entries.map((entry) => entry.dateKey))].sort();
  const canCreate = canManageScheduling(user.membership.role);
  const timeZone = agenda.timeZone;

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Agenda y vencimientos</h1>
          <p>Eventos, vencimientos legales y tareas con fecha, en un solo lugar.</p>
        </div>
      </div>
      {canCreate && cases.length > 0 ? (
        <>
          <details className="panel disclosure">
            <summary>Crear evento</summary>
            <ScheduleForms canCreate={canCreate} cases={cases} timeZone={timeZone} />
          </details>
          <details className="panel disclosure">
            <summary>Crear vencimiento legal</summary>
            <DeadlineForm cases={cases} />
          </details>
        </>
      ) : (
        <InlineNotice>
          {canCreate ? (
            <>
              Creá una causa abierta antes de agregar eventos o vencimientos.{" "}
              <Link className="inlineLink" href="/app/cases#create-case">
                Ir a causas
              </Link>
            </>
          ) : (
            "Tu acceso permite consultar la agenda de las causas asignadas."
          )}
        </InlineNotice>
      )}
      <section className="panel" aria-labelledby="agenda-title">
        <div className="sectionHeader">
          <h2 id="agenda-title">{scopes[filters.scope]}</h2>
          <span className="badge">
            {agenda.total} {agenda.total === 1 ? "entrada" : "entradas"}
          </span>
        </div>
        <nav className="filterList" aria-label="Estado de la agenda">
          {(Object.keys(scopes) as Array<keyof typeof scopes>).map((scope) => (
            <Link
              key={scope}
              className={filters.scope === scope ? "active" : undefined}
              aria-current={filters.scope === scope ? "page" : undefined}
              href={agendaHref(filters, { scope, page: 1 })}
            >
              {scopes[scope]}
            </Link>
          ))}
        </nav>
        {filters.scope === "review" ? (
          <InlineNotice>
            Estos vencimientos históricos necesitan revisión. Una fecha pasada no confirma
            que una obligación siga pendiente. Revisá cada caso antes de indicar su
            estado, incluso si se había ocultado de la agenda.
          </InlineNotice>
        ) : null}
        {filters.scope === "overdue" ? (
          <InlineNotice tone="error">
            Obligaciones confirmadas como pendientes cuya fecha ya pasó. Ocultarlas de
            próximos compromisos no las resuelve.
          </InlineNotice>
        ) : null}
        <p className="muted">
          Los filtros buscan en toda la agenda, con 25 entradas por página. Las fechas se
          agrupan según el horario de {formatTimeZone(timeZone, new Date())}. Los eventos
          indican su zona horaria; los vencimientos y las tareas conservan su fecha sin
          hora.
        </p>
        <form action="/app/calendar" className="formGrid scheduleFilters">
          <input type="hidden" name="scope" value={filters.scope} />
          <div className="field">
            <label htmlFor="schedule-kind">Tipo</label>
            <select id="schedule-kind" name="kind" defaultValue={filters.kind}>
              <option value="all">Todos</option>
              <option value="event">Eventos</option>
              <option value="deadline">Vencimientos legales</option>
              <option value="task">Tareas</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="schedule-from">Desde</label>
            <input
              id="schedule-from"
              name="from"
              type="date"
              defaultValue={filters.from}
            />
          </div>
          <div className="field">
            <label htmlFor="schedule-to">Hasta</label>
            <input
              id="schedule-to"
              name="to"
              type="date"
              min={filters.from || undefined}
              defaultValue={filters.to}
            />
          </div>
          <div className="inlineForm">
            <button className="secondaryButton" type="submit">
              Filtrar
            </button>
            <Link
              className="textLink"
              href={agendaHref(parseScheduleFilters({}), { scope: filters.scope })}
            >
              Limpiar
            </Link>
          </div>
        </form>
        {filters.invalid ? (
          <InlineNotice tone="error">
            Revisá el tipo, el estado, la página y el rango de fechas. La fecha final debe
            ser igual o posterior a la inicial.
          </InlineNotice>
        ) : null}
        {dates.length ? (
          dates.map((date) => (
            <section key={date} aria-labelledby={`date-${date}`}>
              <h3 className="scheduleDate" id={`date-${date}`}>
                {date === agenda.today ? "Hoy · " : ""}
                {formatDateOnly(date)}
              </h3>
              <ul className="scheduleList">
                {agenda.entries
                  .filter((entry) => entry.dateKey === date)
                  .map((item) => (
                    <li className="card" key={`${item.kind}-${item.id}`}>
                      <div className="cardHeader">
                        <div>
                          <strong>{item.title}</strong>
                          <p className="muted">
                            <Link
                              className="inlineLink"
                              href={`/app/cases/${item.caseId}`}
                            >
                              {item.caseTitle}
                            </Link>
                            {item.subtitle ? ` · ${item.subtitle}` : ""}
                          </p>
                        </div>
                        <ScheduleBadge
                          dateLabel={item.dateLabel}
                          deadlineProximity={item.deadlineProximity}
                          urgencyLabel={item.urgencyLabel}
                          kind={item.kind}
                        />
                      </div>
                      {item.kind === "deadline" ? (
                        <>
                          <p className="muted">
                            Estado: {deadlineStatusLabels[item.status as DeadlineStatus]}
                            {item.statusChangedAt
                              ? ` · actualizado ${new Date(item.statusChangedAt).toLocaleString("es-AR", { timeZone })}`
                              : ""}
                          </p>
                          {canCreate ? (
                            <DeadlineStatusActions
                              id={item.id}
                              title={item.title}
                              status={item.status as DeadlineStatus}
                              revision={item.statusRevision}
                            />
                          ) : null}
                        </>
                      ) : null}
                      {item.kind === "task" && canCreate ? (
                        <ActionForm
                          action={updateTaskStatusAction}
                          label={
                            item.status === "completed"
                              ? "Reabrir tarea"
                              : "Completar tarea"
                          }
                        >
                          <input type="hidden" name="caseId" value={item.caseId} />
                          <input type="hidden" name="taskId" value={item.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={item.status === "completed" ? "open" : "completed"}
                          />
                        </ActionForm>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="emptyState">
            No hay entradas visibles en esta página. Probá otro filtro o volvé a la página
            anterior.
          </p>
        )}
        <nav className="inlineForm pagination" aria-label="Páginas de la agenda">
          {filters.page > 1 ? (
            <Link
              className="secondaryButton"
              href={agendaHref(filters, { page: filters.page - 1 })}
            >
              Página anterior
            </Link>
          ) : null}
          <span className="muted">
            Página {filters.page} · {agenda.total}{" "}
            {agenda.total === 1 ? "entrada" : "entradas"} en total
          </span>
          {filters.page * agenda.pageSize < agenda.total ? (
            <Link
              className="secondaryButton"
              href={agendaHref(filters, { page: filters.page + 1 })}
            >
              Página siguiente
            </Link>
          ) : null}
        </nav>
      </section>
    </>
  );
}
