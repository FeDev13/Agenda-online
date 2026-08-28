import type { CaseStatus, FirmRole, MembershipStatus, TaskStatus } from "@/types/database";

const firmRoleLabels: Record<FirmRole, string> = {
  admin: "Administración",
  lawyer: "Abogado/a",
  paralegal: "Asistente legal",
  read_only: "Solo lectura"
};

const membershipStatusLabels: Record<MembershipStatus, string> = {
  active: "Activa",
  disabled: "Deshabilitada",
  invited: "Invitada"
};

const caseStatusLabels: Record<CaseStatus, string> = {
  archived: "Archivada",
  closed: "Cerrada",
  open: "Abierta"
};

const taskStatusLabels: Record<TaskStatus, string> = {
  archived: "Archivada",
  completed: "Completada",
  open: "Pendiente"
};

export function formatFirmRole(role: FirmRole) {
  return firmRoleLabels[role];
}

export function formatMembershipStatus(status: MembershipStatus) {
  return membershipStatusLabels[status];
}

export function formatCaseStatus(status: CaseStatus) {
  return caseStatusLabels[status];
}

export function formatTaskStatus(status: TaskStatus) {
  return taskStatusLabels[status];
}

export function formatScheduleKind(kind: "deadline" | "event") {
  return kind === "deadline" ? "vencimiento" : "evento";
}
