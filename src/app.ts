import express from "express";
import cors from "cors";
import path from "node:path";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/routes.js";
import { employeeRouter } from "./modules/employees/routes.js";
import { teamRouter } from "./modules/teams/routes.js";
import { locationRouter } from "./modules/locations/routes.js";
import { cycleRouter } from "./modules/cycles/routes.js";
import { challengeRouter } from "./modules/challenges/routes.js";
import { activityRouter } from "./modules/activities/routes.js";
import { submissionRouter } from "./modules/submissions/routes.js";
import { pointsRouter } from "./modules/points/routes.js";
import { progressRouter } from "./modules/progress/routes.js";
import { leaderboardRouter } from "./modules/leaderboard/routes.js";
import { notificationPrefsRouter, notificationRouter } from "./modules/notifications/routes.js";
import { dashboardRouter } from "./modules/dashboard/routes.js";
import { randomValueRouter } from "./modules/random-value/routes.js";

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",")
        .map((o) => o.trim())
        .filter(Boolean)
        .concat(["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.87:3000"]),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { ok: true }, message: "OK" });
  });

  app.use("/auth", authRouter);
  app.use("/employees", employeeRouter);
  app.use("/teams", teamRouter);
  app.use("/locations", locationRouter);
  app.use("/cycles", cycleRouter);
  app.use("/challenges", challengeRouter);
  app.use("/activities", activityRouter);
  app.use("/submissions", submissionRouter);
  app.use("/points", pointsRouter);
  app.use("/progress", progressRouter);
  app.use("/leaderboard", leaderboardRouter);
  app.use("/notifications", notificationRouter);
  app.use("/notification-preferences", notificationPrefsRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/random-value", randomValueRouter);

  app.use(errorHandler);
  return app;
}
