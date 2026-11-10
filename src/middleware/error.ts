import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { fail } from "../lib/response.js";
import jwt from "jsonwebtoken";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return fail(res, err.status, err.code, err.message);
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join(" ") || "Validation failed.";
    return fail(res, 422, "VALIDATION_ERROR", message);
  }

  if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
    return fail(res, 401, "UNAUTHORIZED", "Invalid or expired token.");
  }

  const maybeMulter = err as { code?: string };
  if (maybeMulter?.code === "LIMIT_FILE_SIZE") {
    return fail(res, 422, "VALIDATION_ERROR", "Evidence file is too large.");
  }

  console.error(err);
  return fail(res, 500, "INTERNAL_ERROR", "Something went wrong.");
}
