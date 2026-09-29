import Link from "next/link";

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
      <aside className="sidebar">
        <div className="brandBlock">
          <strong>Agenda Legal</strong>
          <span>Gestión de causas</span>
        </div>
        <nav aria-label="Navegación principal" className="navList">
          <Link href="/app">Inicio</Link>
          <Link href="/app/cases">Causas abiertas</Link>
          <Link href="/app/calendar">
            <span>Agenda</span>
            {showAgendaWarning ? (
              <>
                <span
                  aria-hidden="true"
                  className="navAlertIcon"
                  title="Vencimiento dentro de 48 horas"
                >
                  !
                </span>
                <span className="srOnly">Hay vencimientos dentro de 48 horas</span>
              </>
            ) : null}
          </Link>
          <Link href="/app/team">Accesos</Link>
        </nav>
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
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
