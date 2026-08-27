import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda Legal",
  description: "Internal law-firm case scheduling application"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
