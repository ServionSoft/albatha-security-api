import { Router } from "express";
import { ok } from "../../lib/response.js";
import { parsePage } from "../../lib/pagination.js";
import { requireAuth } from "../../middleware/auth.js";
import { PointsService } from "./service.js";

export const pointsRouter = Router();
pointsRouter.use(requireAuth);

pointsRouter.get("/me", async (req, res, next) => {
  try {
    return ok(res, await PointsService.forUser(req.auth!.userId));
  } catch (err) {
    next(err);
  }
});

pointsRouter.get("/summary", async (_req, res, next) => {
  try {
    return ok(res, await PointsService.summary());
  } catch (err) {
    next(err);
  }
});

pointsRouter.get("/", async (req, res, next) => {
  try {
    const { page, pageSize, skip } = parsePage(req);
    return ok(
      res,
      await PointsService.list({
        userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        query: typeof req.query.query === "string" ? req.query.query : typeof req.query.q === "string" ? req.query.q : undefined,
        page,
        pageSize,
        skip,
      }),
    );
  } catch (err) {
    next(err);
  }
});
