import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
import { unauthorized } from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import { requireAuth } from "../../middleware/auth.js";
import { RandomValueService } from "./service.js";

function requireCronSecret(req: Request, _res: Response, next: NextFunction) {
  try {
    const secret = req.headers["x-cron-secret"];
    if (typeof secret !== "string" || secret !== env.CRON_SECRET) {
      throw unauthorized("Invalid cron secret.");
    }
    next();
  } catch (err) {
    next(err);
  }
}

export const randomValueRouter = Router();

randomValueRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    return ok(res, await RandomValueService.getCurrent());
  } catch (err) {
    next(err);
  }
});

randomValueRouter.post("/rotate", requireCronSecret, async (_req, res, next) => {
  try {
    return ok(res, await RandomValueService.rotate(), "Rotated");
  } catch (err) {
    next(err);
  }
});
