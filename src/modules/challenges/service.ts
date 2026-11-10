import type { ChallengeCategory, ChallengeStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";
import { newId, serializeActivity, serializeChallenge } from "../../lib/serializers.js";

export const ChallengeService = {
  async list(cycleId?: string) {
    const rows = await prisma.challenge.findMany({
      where: cycleId ? { cycleId } : undefined,
      include: { activities: true },
      orderBy: { startDate: "desc" },
    });
    return rows.map((c) => ({
      ...serializeChallenge(c),
      activities: c.activities.map(serializeActivity),
    }));
  },

  async getById(id: string) {
    const row = await prisma.challenge.findUnique({ where: { id }, include: { activities: true } });
    if (!row) throw notFound("Challenge");
    return { ...serializeChallenge(row), activities: row.activities.map(serializeActivity) };
  },

  async create(input: {
    cycleId: string;
    name: string;
    category: ChallengeCategory;
    objective?: string;
    tagline?: string;
    startDate: string;
    endDate: string;
    status?: ChallengeStatus;
  }) {
    const row = await prisma.challenge.create({
      data: {
        id: newId("challenge"),
        cycleId: input.cycleId,
        name: input.name.trim(),
        category: input.category,
        objective: input.objective ?? "",
        tagline: input.tagline,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: input.status ?? "UPCOMING",
      },
    });
    return serializeChallenge(row);
  },

  async update(id: string, patch: Partial<{ name: string; objective: string; tagline: string; status: ChallengeStatus; startDate: string; endDate: string }>) {
    const existing = await prisma.challenge.findUnique({ where: { id } });
    if (!existing) throw notFound("Challenge");
    const row = await prisma.challenge.update({
      where: { id },
      data: {
        name: patch.name?.trim(),
        objective: patch.objective,
        tagline: patch.tagline,
        status: patch.status,
        startDate: patch.startDate ? new Date(patch.startDate) : undefined,
        endDate: patch.endDate ? new Date(patch.endDate) : undefined,
      },
    });
    return serializeChallenge(row);
  },
};
