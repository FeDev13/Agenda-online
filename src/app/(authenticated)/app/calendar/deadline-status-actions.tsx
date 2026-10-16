import { ActionForm } from "@/components/action-form";
import type { DeadlineStatus } from "@/types/database";
import { updateDeadlineStatusAction } from "./actions";

export function DeadlineStatusActions({
  id,
  title,
  status,
  revision
}: {
  id: string;
  title: string;
  status: DeadlineStatus;
  revision: number;
}) {
  const resolved = status === "completed" || status === "cancelled";
  const operations = resolved
    ? [
        {
          status: "pending",
          label: "Reabrir vencimiento",
          explanation: "Volverá a figurar como pendiente y podrá generar alertas."
        }
      ]
    : [
        ...(status === "needs_review"
          ? [
              {
                status: "pending",
                label: "Confirmar pendiente",
                explanation:
                  "Confirmás que este vencimiento histórico sigue pendiente. Su fecha original se conservará."
              }
            ]
          : []),
        {
          status: "completed",
          label: "Marcar cumplido",
          explanation:
            "Confirmás que la obligación fue cumplida. Dejará de aparecer como pendiente y de generar nuevas alertas."
        },
        {
          status: "cancelled",
          label: "Cancelar vencimiento",
          explanation:
            "Confirmás que la obligación ya no corresponde. Su fecha y el historial se conservarán."
        }
      ];
  return (
    <div className="inlineForm startActions">
      {operations.map((operation) => (
        <ActionForm
          key={operation.status}
          action={updateDeadlineStatusAction}
          label={operation.label}
          variant={operation.status === "cancelled" ? "danger" : "secondary"}
          confirmation={`“${title}”. ${operation.explanation}`}
        >
          <input type="hidden" name="deadlineId" value={id} />
          <input type="hidden" name="status" value={operation.status} />
          <input type="hidden" name="expectedRevision" value={revision} />
        </ActionForm>
      ))}
    </div>
  );
}

export const deadlineStatusLabels: Record<DeadlineStatus, string> = {
  pending: "Pendiente",
  needs_review: "Por revisar",
  completed: "Cumplido",
  cancelled: "Cancelado"
};
