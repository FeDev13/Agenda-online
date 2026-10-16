import { cloneElement, type ReactElement } from "react";

export function FormField({
  id,
  label,
  error,
  children
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? `${id}-error` : undefined
      })}
      {error ? (
        <p className="fieldError" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
