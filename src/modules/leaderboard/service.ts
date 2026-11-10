import { prisma } from "../../lib/prisma.js";

function ratio(completed: number, required: number) {
  if (!required) return 0;
  return Math.round((completed / required) * 100);
}

export const LeaderboardService = {
  async overall() {
    const [users, progress] = await Promise.all([
      prisma.user.findMany({
        where: { roles: { some: { role: { in: ["GUARD", "TEAM_LEADER"] } } } },
        include: { points: true, team: true },
      }),
      prisma.progressRecord.findMany({
        where: { cycle: { status: "ACTIVE" } },
      }),
    ]);

    const progressByUser = new Map<string, { participation: number; consistency: number; percent: number }>();
    for (const row of progress) {
      const current = progressByUser.get(row.userId);
      const participation = ratio(row.activitiesCompleted, row.activitiesRequired);
      const consistency = ratio(row.weeksParticipated, row.weeksRequired);
      if (!current) {
        progressByUser.set(row.userId, { participation, consistency, percent: row.percent });
        continue;
      }
      current.participation = Math.round((current.participation + participation) / 2);
      current.consistency = Math.round((current.consistency + consistency) / 2);
      current.percent = Math.round((current.percent + row.percent) / 2);
    }

    return users
      .map((u) => {
        const stats = progressByUser.get(u.id);
        return {
          userId: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          points: u.points.reduce((sum, tx) => sum + tx.amount, 0),
          teamId: u.teamId,
          team: u.team?.name ?? "—",
          participationPercent: stats?.participation ?? 0,
          consistencyPercent: stats?.consistency ?? 0,
          progressPercent: stats?.percent ?? 0,
          rank: 0,
        };
      })
      .sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  },

  async forTeam(teamId: string) {
    const all = await this.overall();
    return all
      .filter((e) => e.teamId === teamId)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  },
};
