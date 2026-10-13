type PostgresError = {
  code?: string;
  message?: string;
};

export function toCreateCaseErrorMessage(error: PostgresError) {
  if (error.code === "23505") {
    return "Ya existe una causa con ese número.";
  }

  if (error.code === "42501") {
    return "Tu rol no permite crear causas.";
  }

  return "No se pudo crear la causa.";
}

export function toPermanentDeleteCaseErrorMessage(error: PostgresError) {
  if (error.code === "22023") {
    return "La confirmación debe coincidir con el número de causa.";
  }

  if (error.code === "23514") {
    return "Archivá la causa antes de eliminarla definitivamente.";
  }

  if (error.code === "42501") {
    return "Solo administración puede eliminar causas definitivamente.";
  }

  return "No se pudo eliminar definitivamente la causa.";
}
