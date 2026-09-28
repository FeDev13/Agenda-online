import { formatScheduleKind } from "@/lib/display-labels";
import type { DeadlineProximity } from "@/lib/schedule-proximity";

const deadlineBadgeClassNames: Record<DeadlineProximity, string> = {
  normal: "deadlineBadgeNormal",
  soon: "deadlineBadgeSoon",
  urgent: "deadlineBadgeUrgent"
};

export function ScheduleBadge({
  dateLabel,
  deadlineProximity,
  kind
}: {
  dateLabel: string;
  deadlineProximity: DeadlineProximity | null;
  kind: "deadline" | "event" | "task";
}) {
  const className = [
    "badge",
    deadlineProximity ? "deadlineBadge" : null,
    deadlineProximity ? deadlineBadgeClassNames[deadlineProximity] : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={className}>
      {formatScheduleKind(kind)}: {dateLabel}
    </span>
  );
}
