import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { requireAuth, requireWrite } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { crmStatusToCycle } from "../../lib/serializers.js";
import { CycleService } from "./service.js";

export const cycleRouter = Router();
cycleRouter.use(requireAuth);

const upsertSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  status: z.enum(["DRAFT", "UPCOMING", "ACTIVE", "CLOSED"]).optional(),
  category: z.enum(["MOVE", "PROGRESS", "RECOGNITION"]).optional(),
  activities: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        points: z.coerce.number(),
        evidenceRequired: z.boolean().optional().default(true),
      }),
    )
    .optional(),
});

cycleRouter.get("/", async (req, res, next) => {
  try {
    if (req.query.view === "app") return ok(res, await CycleService.list());
    return ok(res, await CycleService.listCrm());
  } catch (err) {
    next(err);
  }
});

cycleRouter.get("/current", async (_req, res, next) => {
  try {
    return ok(res, await CycleService.getCurrent());
  } catch (err) {
    next(err);
  }
});

cycleRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await CycleService.getById(idParam(req)));
  } catch (err) {
    next(err);
  }
});

cycleRouter.post("/", requireWrite, validateBody(upsertSchema), async (req, res, next) => {
  try {
    return ok(res, await CycleService.create(req.body), "Cycle created", 201);
  } catch (err) {
    next(err);
  }
});

cycleRouter.patch("/:id", requireWrite, validateBody(upsertSchema.partial()), async (req, res, next) => {
  try {
    return ok(res, await CycleService.update(idParam(req), req.body), "Cycle updated");
  } catch (err) {
    next(err);
  }
});

cycleRouter.post("/:id/activate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await CycleService.setStatus(idParam(req), "ACTIVE"), "Cycle activated");
  } catch (err) {
    next(err);
  }
});

cycleRouter.post("/:id/close", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await CycleService.setStatus(idParam(req), crmStatusToCycle("CLOSED") ?? "CLOSED"), "Cycle closed");
  } catch (err) {
    next(err);
  }
});
