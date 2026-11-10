import { Router } from "express";
import { ok } from "../../lib/response.js";
import { requireAuth } from "../../middleware/auth.js";
import { ProgressService } from "./service.js";

export const progressRouter = Router();
progressRouter.use(requireAuth);

progressRouter.get("/", async (req, res, next) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const challengeId = typeof req.query.challengeId === "string" ? req.query.challengeId : undefined;
    const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId : undefined;
    return ok(res, await ProgressService.list(userId, challengeId, cycleId));
  } catch (err) {
    next(err);
  }
});
