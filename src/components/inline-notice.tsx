import type { ReactNode } from "react";

export function InlineNotice({
  children,
  tone = "info"
}: {
  children: ReactNode;
  tone?: "info" | "success" | "error";
}) {
  return (
    <p className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
