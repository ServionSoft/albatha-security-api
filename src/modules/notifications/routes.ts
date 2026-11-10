import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { NotificationService } from "./service.js";

export const notificationRouter = Router();
export const notificationPrefsRouter = Router();
notificationRouter.use(requireAuth);
notificationPrefsRouter.use(requireAuth);

notificationRouter.get("/", async (req, res, next) => {
  try {
    const unreadOnly = req.query.unreadOnly === "true";
    return ok(res, await NotificationService.list(req.auth!.userId, unreadOnly));
  } catch (err) {
    next(err);
  }
});

notificationRouter.post("/read-all", async (req, res, next) => {
  try {
    return ok(res, await NotificationService.markAllRead(req.auth!.userId), "Marked read");
  } catch (err) {
    next(err);
  }
});

notificationRouter.post("/:id/read", async (req, res, next) => {
  try {
    await NotificationService.markRead(idParam(req), req.auth!.userId);
    return ok(res, { ok: true }, "Marked read");
  } catch (err) {
    next(err);
  }
});

notificationPrefsRouter.get("/", async (req, res, next) => {
  try {
    return ok(res, await NotificationService.getPreferences(req.auth!.userId));
  } catch (err) {
    next(err);
  }
});

notificationPrefsRouter.patch(
  "/",
  validateBody(
    z.object({
      submissions: z.boolean().optional(),
      approvals: z.boolean().optional(),
      challenges: z.boolean().optional(),
      points: z.boolean().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      return ok(res, await NotificationService.updatePreferences(req.auth!.userId, req.body), "Preferences updated");
    } catch (err) {
      next(err);
    }
  },
);
