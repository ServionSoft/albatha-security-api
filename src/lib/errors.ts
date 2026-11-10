export type ErrorCode =
  | "INVALID_CREDENTIALS"
  | "INACTIVE_USER"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "ACTIVITY_ALREADY_SUBMITTED"
  | "ACTIVITY_ALREADY_APPROVED"
  | "UNAUTHORIZED"
  | "MUST_CHANGE_PASSWORD";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(entity: string) {
  return new AppError("NOT_FOUND", `${entity} not found.`, 404);
}

export function forbidden(message = "You do not have permission to perform this action.") {
  return new AppError("FORBIDDEN", message, 403);
}

export function unauthorized(message = "Authentication required.") {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function conflict(code: ErrorCode, message: string) {
  return new AppError(code, message, 409);
}

export function validationError(message: string) {
  return new AppError("VALIDATION_ERROR", message, 422);
}
