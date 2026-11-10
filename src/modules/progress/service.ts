import { prisma } from "../../lib/prisma.js";
import { displayName, serializeProgress } from "../../lib/serializers.js";

export const ProgressService = {
  async list(userId?: string, challengeId?: string, cycleId?: string) {
    const rows = await prisma.progressRecord.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(challengeId ? { challengeId } : {}),
        ...(cycleId ? { cycleId } : {}),
      },
      include: {
        user: { include: { team: true } },
        challenge: true,
        cycle: true,
      },
      orderBy: [{ percent: "desc" }, { userId: "asc" }],
    });
    return rows.map((row) =>
      serializeProgress(row, {
        guardName: displayName(row.user),
        teamName: row.user.team?.name ?? null,
        cycleName: row.cycle.name,
        challengeName: row.challenge.name,
        category: row.challenge.category,
      }),
    );
  },

  async forUser(userId: string, challengeId?: string) {
    if (challengeId) {
      const row = await prisma.progressRecord.findUnique({
        where: { userId_challengeId: { userId, challengeId } },
        include: {
          user: { include: { team: true } },
          challenge: true,
          cycle: true,
        },
      });
      return row
        ? serializeProgress(row, {
            guardName: displayName(row.user),
            teamName: row.user.team?.name ?? null,
            cycleName: row.cycle.name,
            challengeName: row.challenge.name,
            category: row.challenge.category,
          })
        : null;
    }
    return this.list(userId);
  },
};
