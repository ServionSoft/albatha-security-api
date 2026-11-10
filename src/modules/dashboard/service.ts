import { prisma } from "../../lib/prisma.js";
import { displayName, serializeCycle, toDateOnly } from "../../lib/serializers.js";

export const DashboardService = {
  async get() {
    const [users, submissions, points, teams, locations, activeCycle] = await Promise.all([
      prisma.user.findMany({ include: { roles: true, team: true } }),
      prisma.submission.findMany({
        include: { user: true, activity: true, cycle: true },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.pointsTransaction.findMany(),
      prisma.team.findMany(),
      prisma.location.findMany(),
      prisma.cycle.findFirst({
        where: { status: "ACTIVE" },
        include: { challenges: { include: { activities: true } } },
      }),
    ]);

    const guards = users.filter((u) => u.roles.some((r) => r.role === "GUARD"));
    const totalGuards = guards.length;
    const activeParticipants = guards.filter((u) => u.status === "ACTIVE").length;
    const submittedGuardIds = new Set(submissions.map((s) => s.userId));
    const participantsWithAnySubmission = [...submittedGuardIds].filter((id) =>
      users.some((u) => u.id === id && u.status === "ACTIVE"),
    ).length;
    const participationPercent = totalGuards
      ? Math.round((participantsWithAnySubmission / totalGuards) * 100)
      : 0;
    const pendingSubmissions = submissions.filter((s) => s.status === "PENDING").length;

    const pointsByUser = new Map<string, number>();
    for (const tx of points) {
      pointsByUser.set(tx.userId, (pointsByUser.get(tx.userId) ?? 0) + tx.amount);
    }
    const guardPoints = [...pointsByUser.values()].reduce((a, b) => a + b, 0);

    const recentSubmissions = submissions.slice(0, 6).map((s) => ({
      id: s.id,
      guardName: displayName(s.user),
      activityName: s.activity.name,
      submittedDate: toDateOnly(s.submittedAt),
      status: s.status,
      points: s.expectedPoints,
      cycleName: s.cycle.name,
    }));

    const teamPerf = teams.map((t) => {
      const teamUserIds = new Set(users.filter((u) => u.teamId === t.id).map((u) => u.id));
      let pts = 0;
      for (const [userId, amount] of pointsByUser.entries()) {
        if (teamUserIds.has(userId)) pts += amount;
      }
      return { teamId: t.id, teamName: t.name, points: pts };
    });

    const locationPerf = locations.map((l) => {
      const locationUserIds = new Set(users.filter((u) => u.locationId === l.id).map((u) => u.id));
      let pts = 0;
      for (const [userId, amount] of pointsByUser.entries()) {
        if (locationUserIds.has(userId)) pts += amount;
      }
      return { locationId: l.id, locationName: l.name, points: pts };
    });

    const topPerformers = guards
      .map((u) => ({
        userId: u.id,
        name: displayName(u),
        points: pointsByUser.get(u.id) ?? 0,
        team: u.team?.name ?? "—",
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const currentCategory = activeCycle?.challenges[0]?.category ?? null;

    const activeProgress = activeCycle
      ? await prisma.progressRecord.findMany({ where: { cycleId: activeCycle.id } })
      : [];
    const weekScore = (status: unknown): number => {
      if (status === "COMPLETED") return 100;
      if (status === "IN_PROGRESS") return 50;
      return 0;
    };
    const weeklyProgress = [0, 1, 2].map((week) => {
      const scores = activeProgress.map((row) => {
        const statuses = Array.isArray(row.weekStatuses) ? row.weekStatuses : [];
        return weekScore(statuses[week]);
      });
      const y = scores.length ? Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length) : 0;
      return { x: `W${week + 1}`, y };
    });

    return {
      metrics: [
        { label: "Total guards", value: String(totalGuards) },
        { label: "Active participants", value: String(activeParticipants) },
        { label: "Participation %", value: `${participationPercent}%` },
        { label: "Pending submissions", value: String(pendingSubmissions) },
        { label: "Guard points", value: String(guardPoints) },
      ],
      currentCycle: activeCycle
        ? {
            ...serializeCycle(activeCycle),
            category: currentCategory,
            activities: activeCycle.challenges.flatMap((c) =>
              c.activities.map((a) => ({
                id: a.id,
                name: a.name,
                points: a.points,
                evidenceRequired: a.evidenceRequired,
              })),
            ),
          }
        : null,
      currentCategory,
      weeklyProgress,
      teamPerf,
      locationPerf,
      recentSubmissions,
      topPerformers,
    };
  },
};
