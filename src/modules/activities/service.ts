import type { ActivityUnit, ChallengeCategory, EntityStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";
import { newId, serializeActivity } from "../../lib/serializers.js";

export const ActivityService = {
  async list(challengeId?: string) {
    const rows = await prisma.activity.findMany({
      where: challengeId ? { challengeId } : undefined,
      orderBy: { name: "asc" },
    });
    return rows.map(serializeActivity);
  },

  async getById(id: string) {
    const row = await prisma.activity.findUnique({ where: { id } });
    if (!row) throw notFound("Activity");
    return serializeActivity(row);
  },

  async create(input: {
    challengeId: string;
    name: string;
    category: ChallengeCategory;
    objective?: string;
    requirement?: string;
    unit?: ActivityUnit;
    points: number;
    evidenceRequired?: boolean;
    verificationRequired?: boolean;
    status?: EntityStatus;
    deadline?: string;
    defaultQuantity?: number;
  }) {
    const row = await prisma.activity.create({
      data: {
        id: newId("activity"),
        challengeId: input.challengeId,
        name: input.name.trim(),
        category: input.category,
        objective: input.objective ?? "",
        requirement: input.requirement ?? "",
        unit: input.unit ?? "NONE",
        points: Number(input.points) || 0,
        evidenceRequired: input.evidenceRequired ?? true,
        verificationRequired: input.verificationRequired ?? true,
        status: input.status ?? "ACTIVE",
        deadline: input.deadline ? new Date(input.deadline) : null,
        defaultQuantity: input.defaultQuantity,
      },
    });
    return serializeActivity(row);
  },

  async update(id: string, patch: Partial<{
    name: string;
    objective: string;
    requirement: string;
    unit: ActivityUnit;
    points: number;
    evidenceRequired: boolean;
    verificationRequired: boolean;
    status: EntityStatus;
    deadline: string | null;
    defaultQuantity: number | null;
  }>) {
    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) throw notFound("Activity");
    const row = await prisma.activity.update({
      where: { id },
      data: {
        name: patch.name?.trim(),
        objective: patch.objective,
        requirement: patch.requirement,
        unit: patch.unit,
        points: patch.points,
        evidenceRequired: patch.evidenceRequired,
        verificationRequired: patch.verificationRequired,
        status: patch.status,
        deadline: patch.deadline === undefined ? undefined : patch.deadline ? new Date(patch.deadline) : null,
        defaultQuantity: patch.defaultQuantity,
      },
    });
    return serializeActivity(row);
  },

  async setStatus(id: string, status: EntityStatus) {
    return this.update(id, { status });
  },
};
