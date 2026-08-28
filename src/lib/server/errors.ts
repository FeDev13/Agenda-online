import "server-only";

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export function toUserMessage(error: unknown) {
  if (error instanceof UserFacingError) {
    return error.message;
  }

  return "No se pudo completar la solicitud. Revisá la información e intentá nuevamente.";
}
