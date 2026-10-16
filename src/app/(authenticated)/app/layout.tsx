import { AppNavigation } from "@/components/app-navigation";

import { formatFirmRole } from "@/lib/display-labels";
import { requireMfaVerified } from "@/lib/server/auth";
import { hasImminentScheduleDeadline } from "@/lib/server/scheduling";

import { signOutAction } from "./actions";

export default async function AuthenticatedLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireMfaVerified("/app");
  const label = user.displayName ?? user.email;
  const showAgendaWarning = user.membership
    ? await hasImminentScheduleDeadline(user.membership)
    : false;

  return (
    <div className="appShell">
      <a className="skipLink" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <div className="brandBlock">
          <strong>Agenda Legal</strong>
          <span>Gestión de causas</span>
        </div>
        <AppNavigation showAgendaWarning={showAgendaWarning} />
      </aside>
      <div className="mainArea">
        <header className="topbar">
          {user.membership ? (
            <span className="badge">{formatFirmRole(user.membership.role)}</span>
          ) : (
            <span className="badge">Sin estudio activo</span>
          )}
          <div className="userBlock">
            <strong>{label}</strong>
            <span>{user.email}</span>
          </div>
          <form action={signOutAction}>
            <button className="secondaryButton" type="submit">
              Salir
            </button>
          </form>
        </header>
        <main className="content" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
