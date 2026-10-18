"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "./button";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Inicio" },
  { href: "/app/cases", label: "Causas abiertas" },
  { href: "/app/calendar", label: "Agenda" },
  { href: "/app/honorarios", label: "Honorarios" },
  { href: "/app/team", label: "Accesos" }
];

export function AppNavigation({ showAgendaWarning }: { showAgendaWarning: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  return (
    <div
      className={`navigation ${open ? "isOpen" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <Button
        ref={menuButton}
        variant="secondary"
        className="mobileMenuButton"
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        Menú ·{" "}
        {
          links.find(({ href }) =>
            href === "/app" ? pathname === href : pathname.startsWith(href)
          )?.label
        }
      </Button>
      <nav id="main-navigation" aria-label="Navegación principal" className="navList">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={
              (
                href === "/app"
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`)
              )
                ? "page"
                : undefined
            }
          >
            <span>{label}</span>
            {href === "/app/calendar" && showAgendaWarning ? (
              <>
                <span aria-hidden="true" className="navAlertIcon">
                  !
                </span>
                <span className="srOnly">
                  Hay vencimientos vencidos, próximos o por revisar
                </span>
              </>
            ) : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
