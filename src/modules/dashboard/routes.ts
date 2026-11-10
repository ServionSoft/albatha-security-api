import { Router } from "express";
import { ok } from "../../lib/response.js";
import { requireAuth } from "../../middleware/auth.js";
import { DashboardService } from "./service.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (_req, res, next) => {
  try {
    return ok(res, await DashboardService.get());
  } catch (err) {
    next(err);
  }
});
