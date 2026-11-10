import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { parsePage } from "../../lib/pagination.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { evidenceUpload } from "../../middleware/upload.js";
import { SubmissionService } from "./service.js";

export const submissionRouter = Router();
submissionRouter.use(requireAuth);

const rejectSchema = z.object({
  reason: z.string().min(1),
  notes: z.string().optional(),
});

submissionRouter.get("/", async (req, res, next) => {
  try {
    const { page, pageSize, skip } = parsePage(req);
    return ok(
      res,
      await SubmissionService.list({
        query: typeof req.query.query === "string" ? req.query.query : typeof req.query.q === "string" ? req.query.q : undefined,
        userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
        teamId: typeof req.query.teamId === "string" ? req.query.teamId : undefined,
        locationId: typeof req.query.locationId === "string" ? req.query.locationId : undefined,
        cycleId: typeof req.query.cycleId === "string" ? req.query.cycleId : undefined,
        challengeId: typeof req.query.challengeId === "string" ? req.query.challengeId : undefined,
        activityId: typeof req.query.activityId === "string" ? req.query.activityId : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        page,
        pageSize: req.query.pageSize ? pageSize : 100,
        skip: req.query.pageSize ? skip : 0,
      }),
    );
  } catch (err) {
    next(err);
  }
});

submissionRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await SubmissionService.getById(idParam(req)));
  } catch (err) {
    next(err);
  }
});

submissionRouter.post("/", evidenceUpload.single("photo"), async (req, res, next) => {
  try {
    const body = req.body as Record<string, string>;
    const evidenceUri = req.file ? `/uploads/${req.file.filename}` : body.evidenceUri || null;
    const data = await SubmissionService.create(req.auth!, {
      activityId: body.activityId,
      activityDate: body.activityDate,
      durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : null,
      quantity: body.quantity ? Number(body.quantity) : null,
      notes: body.notes,
      evidenceUri,
    });
    return ok(res, data, "Submission created", 201);
  } catch (err) {
    next(err);
  }
});

submissionRouter.post("/:id/approve", async (req, res, next) => {
  try {
    return ok(res, await SubmissionService.approve(idParam(req), req.auth!), "Submission approved");
  } catch (err) {
    next(err);
  }
});

submissionRouter.post("/:id/reject", validateBody(rejectSchema), async (req, res, next) => {
  try {
    return ok(
      res,
      await SubmissionService.reject(idParam(req), req.auth!, req.body.reason || req.body.notes),
      "Submission rejected",
    );
  } catch (err) {
    next(err);
  }
});
