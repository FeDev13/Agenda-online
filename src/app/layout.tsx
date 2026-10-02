import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda Legal",
  description: "Agenda interna para la gestión de causas de un estudio jurídico"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
