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

  return "The request could not be completed. Please check the information and try again.";
}
