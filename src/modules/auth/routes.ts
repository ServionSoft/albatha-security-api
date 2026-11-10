import { Router } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { ok } from "../../lib/response.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth, requireWrite } from "../../middleware/auth.js";
import { EmployeeService } from "../employees/service.js";
import { AuthService } from "./service.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  employeeId: z.string().min(1),
  password: z.string().min(1),
  activeRole: z.enum(["GUARD", "TEAM_LEADER", "HR_ADMIN", "MANAGEMENT", "SUPER_USER"]).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

authRouter.post("/login", loginLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const data = await AuthService.login(req.body.employeeId, req.body.password, req.body.activeRole);
    return ok(res, data, "Signed in");
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", requireAuth, async (_req, res, next) => {
  try {
    return ok(res, await AuthService.logout(), "Signed out");
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    return ok(res, await AuthService.me(req.auth!.userId));
  } catch (err) {
    next(err);
  }
});

authRouter.post("/change-password", requireAuth, validateBody(changePasswordSchema), async (req, res, next) => {
  try {
    const data = await AuthService.changePassword(
      req.auth!.userId,
      req.body.currentPassword,
      req.body.newPassword,
    );
    return ok(res, data, "Password updated");
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  "/reset-password",
  requireAuth,
  requireWrite,
  validateBody(z.object({ userId: z.string().min(1) })),
  async (req, res, next) => {
    try {
      return ok(res, await EmployeeService.resetPassword(req.body.userId), "Password reset");
    } catch (err) {
      next(err);
    }
  },
);
