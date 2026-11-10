import { Router } from "express";
import { ok } from "../../lib/response.js";
import { requireAuth } from "../../middleware/auth.js";
import { LeaderboardService } from "./service.js";

export const leaderboardRouter = Router();
leaderboardRouter.use(requireAuth);

leaderboardRouter.get("/", async (req, res, next) => {
  try {
    const scope = req.query.scope;
    const teamId = typeof req.query.teamId === "string" ? req.query.teamId : undefined;
    if (scope === "team" && teamId) return ok(res, await LeaderboardService.forTeam(teamId));
    return ok(res, await LeaderboardService.overall());
  } catch (err) {
    next(err);
  }
});
