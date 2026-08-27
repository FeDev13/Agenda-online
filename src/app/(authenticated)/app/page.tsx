import Link from "next/link";

import { canManageCases, canManageScheduling } from "@/lib/domain/authorization";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";
import { listUpcomingSchedule } from "@/lib/server/scheduling";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const [cases, schedule] = await Promise.all([listOpenCases(), listUpcomingSchedule()]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Dashboard</h1>
          <p>Open matter load and upcoming scheduling commitments.</p>
        </div>
        <div>
          <Link className="button" href="/app/cases">
            Manage cases
          </Link>
        </div>
      </div>

      <section className="metricGrid" aria-label="Firm metrics">
        <div className="metric">
          <span>Open cases</span>
          <strong>{cases.length}</strong>
        </div>
        <div className="metric">
          <span>Upcoming items</span>
          <strong>{schedule.length}</strong>
        </div>
        <div className="metric">
          <span>MFA path</span>
          <strong>Ready</strong>
        </div>
      </section>

      <div className="grid two" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="dashboard-cases">
          <h2 id="dashboard-cases">Recently opened cases</h2>
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
            <p className="emptyState">No open cases are visible to this account.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="dashboard-schedule">
          <h2 id="dashboard-schedule">Upcoming schedule</h2>
          {schedule.length ? (
            <ul className="scheduleList">
              {schedule.slice(0, 6).map((item) => (
                <li className="card" key={`${item.kind}-${item.id}`}>
                  <div className="cardHeader">
                    <div>
                      <strong>{item.title}</strong>
                      <p className="muted">{item.caseTitle}</p>
                    </div>
                    <span className="badge">{item.dateLabel}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No upcoming events or deadlines are visible.</p>
          )}
        </section>
      </div>

      <section
        className="panel"
        style={{ marginTop: 18 }}
        aria-labelledby="security-note"
      >
        <h2 id="security-note">Access posture</h2>
        <p className="muted">
          Case data is read through server-only services and Supabase RLS. This account
          can {canManageCases(user.membership.role) ? "" : "not "}create cases and can{" "}
          {canManageScheduling(user.membership.role) ? "" : "not "}create scheduling
          entries.
        </p>
      </section>
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-access-title">
      <h1 id="no-access-title">No active firm access</h1>
      <p className="muted">
        This account is signed in but does not have an active firm membership. An admin
        must create or accept an invite before case data is available.
      </p>
    </section>
  );
}
