import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import { verifyAccessToken, type JwtPayload } from "../lib/tokens.js";

export type AuthUser = JwtPayload & {
  roles: UserRole[];
  status: "ACTIVE" | "INACTIVE";
  teamId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw unauthorized();

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { roles: true },
    });
    if (!user) throw unauthorized();
    if (user.status !== "ACTIVE") throw unauthorized("This account is inactive.");

    const roles = user.roles.map((r) => r.role);
    req.auth = {
      ...payload,
      roles,
      status: user.status,
      teamId: user.teamId,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw unauthorized();
      const ok = req.auth.roles.some((role) => allowed.includes(role));
      if (!ok) throw forbidden();
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireWrite(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw unauthorized();
    const canWrite = req.auth.roles.some((role) => role === "HR_ADMIN" || role === "SUPER_USER");
    if (!canWrite) throw forbidden("Read-only accounts cannot change this resource.");
    next();
  } catch (err) {
    next(err);
  }
}
