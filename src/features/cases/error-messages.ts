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
