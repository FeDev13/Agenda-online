import type { ComponentProps } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "quiet" | "danger" | "danger-confirm";

export function buttonClassName(variant: ButtonVariant = "primary", compact = false) {
  return [
    variant === "primary" ? "button" : "secondaryButton",
    variant === "quiet" ? "quietButton" : "",
    variant === "danger" || variant === "danger-confirm" ? "dangerButton" : "",
    variant === "danger-confirm" ? "dangerConfirmButton" : "",
    compact ? "compactButton" : ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  compact = false,
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  compact?: boolean;
}) {
  return (
    <button
      {...props}
      className={`${buttonClassName(variant, compact)} ${className}`}
      type={type}
    />
  );
}
