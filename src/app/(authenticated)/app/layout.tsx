import Link from "next/link";

import { requireUser } from "@/lib/server/auth";

import { signOutAction } from "./actions";

export default async function AuthenticatedLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const label = user.displayName ?? user.email;

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brandBlock">
          <strong>Agenda Legal</strong>
          <span>Case scheduling</span>
        </div>
        <nav aria-label="Primary navigation" className="navList">
          <Link href="/app">Dashboard</Link>
          <Link href="/app/cases">Open cases</Link>
          <Link href="/app/calendar">Calendar</Link>
          <Link href="/app/team">Team access</Link>
        </nav>
      </aside>
      <div className="mainArea">
        <header className="topbar">
          {user.membership ? (
            <span className="badge">{user.membership.role.replace("_", " ")}</span>
          ) : (
            <span className="badge">No active firm</span>
          )}
          <div className="userBlock">
            <strong>{label}</strong>
            <span>{user.email}</span>
          </div>
          <form action={signOutAction}>
            <button className="secondaryButton" type="submit">
              Sign out
            </button>
          </form>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
