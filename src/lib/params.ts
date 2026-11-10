import type { Request } from "express";

export function idParam(req: Request, name = "id") {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
