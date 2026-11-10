import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { parsePage } from "../../lib/pagination.js";
import { requireAuth, requireWrite } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { LocationService } from "./service.js";

export const locationRouter = Router();
locationRouter.use(requireAuth);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

locationRouter.get("/", async (req, res, next) => {
  try {
    if (req.query.all === "true") {
      return ok(res, await LocationService.listAll());
    }
    const { page, pageSize, skip } = parsePage(req);
    return ok(
      res,
      await LocationService.list({
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

locationRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await LocationService.getById(idParam(req)));
  } catch (err) {
    next(err);
  }
});

locationRouter.post("/", requireWrite, validateBody(upsertSchema), async (req, res, next) => {
  try {
    return ok(res, await LocationService.create(req.body), "Location created", 201);
  } catch (err) {
    next(err);
  }
});

locationRouter.patch("/:id", requireWrite, validateBody(upsertSchema.partial()), async (req, res, next) => {
  try {
    return ok(res, await LocationService.update(idParam(req), req.body), "Location updated");
  } catch (err) {
    next(err);
  }
});

locationRouter.post("/:id/activate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await LocationService.setStatus(idParam(req), "ACTIVE"), "Location activated");
  } catch (err) {
    next(err);
  }
});

locationRouter.post("/:id/deactivate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await LocationService.setStatus(idParam(req), "INACTIVE"), "Location deactivated");
  } catch (err) {
    next(err);
  }
});
