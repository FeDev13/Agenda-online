import { canManageScheduling } from "@/lib/domain/authorization";
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
          <h1>Calendar and deadlines</h1>
          <p>Events use timezone-aware instants. Legal deadlines remain date-only.</p>
        </div>
      </div>
      <div className="grid two">
        <section className="panel" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title">Upcoming items</h2>
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
                      {item.kind}: {item.dateLabel}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No upcoming events or deadlines are visible.</p>
          )}
        </section>
        <div className="grid">
          {!canCreate ? (
            <p className="errorText">Your role cannot create scheduling entries.</p>
          ) : null}
          {cases.length === 0 ? (
            <p className="emptyState">
              Create an open case before adding schedule items.
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
      <h1 id="no-firm-title">No active firm access</h1>
      <p className="muted">An active firm membership is required to view scheduling.</p>
    </section>
  );
}
