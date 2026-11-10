import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { requireAuth, requireWrite } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { ChallengeService } from "./service.js";

export const challengeRouter = Router();
challengeRouter.use(requireAuth);

const createSchema = z.object({
  cycleId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["MOVE", "PROGRESS", "RECOGNITION"]),
  objective: z.string().optional(),
  tagline: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(["UPCOMING", "ACTIVE", "CLOSED"]).optional(),
});

challengeRouter.get("/", async (req, res, next) => {
  try {
    return ok(res, await ChallengeService.list(typeof req.query.cycleId === "string" ? req.query.cycleId : undefined));
  } catch (err) {
    next(err);
  }
});

challengeRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await ChallengeService.getById(idParam(req)));
  } catch (err) {
    next(err);
  }
});

challengeRouter.post("/", requireWrite, validateBody(createSchema), async (req, res, next) => {
  try {
    return ok(res, await ChallengeService.create(req.body), "Challenge created", 201);
  } catch (err) {
    next(err);
  }
});

challengeRouter.patch("/:id", requireWrite, validateBody(createSchema.partial()), async (req, res, next) => {
  try {
    return ok(res, await ChallengeService.update(idParam(req), req.body), "Challenge updated");
  } catch (err) {
    next(err);
  }
});
