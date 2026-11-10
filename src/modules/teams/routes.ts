import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { parsePage } from "../../lib/pagination.js";
import { requireAuth, requireWrite } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { TeamService } from "./service.js";

export const teamRouter = Router();
teamRouter.use(requireAuth);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  locationId: z.string().nullable().optional(),
  leaderId: z.string().nullable().optional(),
  leaderUserId: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

teamRouter.get("/", async (req, res, next) => {
  try {
    if (req.query.all === "true") {
      return ok(res, await TeamService.listAll());
    }
    const { page, pageSize, skip } = parsePage(req);
    return ok(
      res,
      await TeamService.list({
        query: typeof req.query.query === "string" ? req.query.query : typeof req.query.q === "string" ? req.query.q : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        page,
        pageSize,
        skip,
      }),
    );
  } catch (err) {
    next(err);
  }
});

teamRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await TeamService.getById(idParam(req)));
  } catch (err) {
    next(err);
  }
});

teamRouter.post("/", requireWrite, validateBody(upsertSchema), async (req, res, next) => {
  try {
    const data = await TeamService.create({
      name: req.body.name,
      code: req.body.code,
      locationId: req.body.locationId,
      leaderId: req.body.leaderId ?? req.body.leaderUserId,
      status: req.body.status,
    });
    return ok(res, data, "Team created", 201);
  } catch (err) {
    next(err);
  }
});

teamRouter.patch("/:id", requireWrite, validateBody(upsertSchema.partial()), async (req, res, next) => {
  try {
    return ok(
      res,
      await TeamService.update(idParam(req), {
        name: req.body.name,
        locationId: req.body.locationId,
        leaderId: req.body.leaderId ?? req.body.leaderUserId,
        status: req.body.status,
      }),
      "Team updated",
    );
  } catch (err) {
    next(err);
  }
});

teamRouter.post("/:id/deactivate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await TeamService.deactivate(idParam(req)), "Team deactivated");
  } catch (err) {
    next(err);
  }
});

teamRouter.post("/:id/assign-leader", requireWrite, validateBody(z.object({ leaderId: z.string().min(1) })), async (req, res, next) => {
  try {
    return ok(res, await TeamService.assignLeader(idParam(req), req.body.leaderId), "Leader assigned");
  } catch (err) {
    next(err);
  }
});
