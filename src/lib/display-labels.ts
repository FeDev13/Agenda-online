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

const assignmentRoleLabels: Record<string, string> = {
  assigned: "Asignado/a",
  assigned_paralegal: "Asistente asignado/a",
  assigned_reader: "Lectura asignada",
  responsible_admin: "Administración responsable",
  responsible_lawyer: "Abogado/a responsable"
};

const auditActionLabels: Record<string, string> = {
  "case.created": "Causa creada",
  "case_member.assigned": "Acceso a causa asignado",
  "case_member.removed": "Acceso a causa removido",
  "deadline.created": "Vencimiento creado",
  "document.download_prepared": "Descarga de documento preparada",
  "document.uploaded": "Documento subido",
  "event.created": "Evento creado",
  "membership.accepted": "Invitación aceptada",
  "membership.disabled": "Integrante desactivado",
  "membership.invited": "Integrante invitado",
  "membership.reinvited": "Integrante reinvitado",
  "membership.role_updated": "Rol de integrante actualizado",
  "note.archived": "Nota archivada",
  "task.status_updated": "Estado de tarea actualizado"
};

export function formatAssignmentRole(role: string) {
  return assignmentRoleLabels[role] ?? role;
}

export function formatAuditAction(action: string) {
  return auditActionLabels[action] ?? action;
}

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

export function formatScheduleKind(kind: "deadline" | "event" | "task") {
  if (kind === "deadline") {
    return "vencimiento";
  }

  if (kind === "task") {
    return "vencimiento";
  }

  return "evento";
}
