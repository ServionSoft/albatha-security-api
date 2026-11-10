import type { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError, notFound, unauthorized, validationError } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { pickDefaultRole, serializeUser } from "../../lib/serializers.js";
import { signAccessToken } from "../../lib/tokens.js";

const userInclude = { roles: true, team: true, location: true } as const;

export const AuthService = {
  async login(employeeId: string, password: string, preferredRole?: UserRole) {
    const user = await prisma.user.findFirst({
      where: { employeeId: { equals: employeeId.trim(), mode: "insensitive" } },
      include: userInclude,
    });
    if (!user) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid employee ID or password.", 401);
    }
    if (user.status !== "ACTIVE") {
      throw new AppError("INACTIVE_USER", "This account is inactive.", 403);
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid employee ID or password.", 401);
    }

    const roles = user.roles.map((r) => r.role);
    const activeRole = pickDefaultRole(roles, preferredRole);
    const token = signAccessToken({
      userId: user.id,
      employeeId: user.employeeId,
      activeRole,
    });

    return {
      user: serializeUser(user),
      session: {
        userId: user.id,
        employeeId: user.employeeId,
        activeRole,
        token,
      },
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
    if (!user) throw unauthorized();
    return serializeUser(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("User");
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw validationError("Current password is incorrect.");
    if (newPassword.length < 8) throw validationError("New password must be at least 8 characters.");
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
      },
    });
    return { ok: true };
  },

  async logout() {
    return { ok: true };
  },
};
