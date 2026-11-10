import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { requireAuth, requireWrite } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ActivityService } from "./service.js";

export const activityRouter = Router();
activityRouter.use(requireAuth);

const createSchema = z.object({
  challengeId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["MOVE", "PROGRESS", "RECOGNITION"]),
  objective: z.string().optional(),
  requirement: z.string().optional(),
  unit: z.enum(["MINUTES", "COUNT", "NONE"]).optional(),
  points: z.coerce.number(),
  evidenceRequired: z.boolean().optional(),
  verificationRequired: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  deadline: z.string().optional(),
  defaultQuantity: z.coerce.number().optional(),
});

activityRouter.get("/", async (req, res, next) => {
  try {
    return ok(
      res,
      await ActivityService.list(typeof req.query.challengeId === "string" ? req.query.challengeId : undefined),
    );
  } catch (err) {
    next(err);
  }
});

activityRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await ActivityService.getById(idParam(req)));
  } catch (err) {
    next(err);
  }
});

activityRouter.post("/", requireWrite, validateBody(createSchema), async (req, res, next) => {
  try {
    return ok(res, await ActivityService.create(req.body), "Activity created", 201);
  } catch (err) {
    next(err);
  }
});

activityRouter.patch("/:id", requireWrite, validateBody(createSchema.partial()), async (req, res, next) => {
  try {
    return ok(res, await ActivityService.update(idParam(req), req.body), "Activity updated");
  } catch (err) {
    next(err);
  }
});

activityRouter.post("/:id/activate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await ActivityService.setStatus(idParam(req), "ACTIVE"), "Activity activated");
  } catch (err) {
    next(err);
  }
});

activityRouter.post("/:id/deactivate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await ActivityService.setStatus(idParam(req), "INACTIVE"), "Activity deactivated");
  } catch (err) {
    next(err);
  }
});
