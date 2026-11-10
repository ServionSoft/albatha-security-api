import type { ChallengeCategory, CycleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound, validationError } from "../../lib/errors.js";
import {
  crmStatusToCycle,
  cycleStatusToCrm,
  newId,
  serializeActivity,
  serializeChallenge,
  serializeCycle,
  toDateOnly,
} from "../../lib/serializers.js";

function computeEndDate(startDate: string) {
  const d = new Date(`${startDate}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return startDate;
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 20);
  return end.toISOString().slice(0, 10);
}

function toCrmCycle(
  cycle: Awaited<ReturnType<typeof prisma.cycle.findFirst>> & {
    challenges: Array<{
      category: ChallengeCategory;
      activities: Array<{ id: string; name: string; points: number; evidenceRequired: boolean }>;
    }>;
  },
) {
  const first = cycle!.challenges[0];
  const activities = cycle!.challenges.flatMap((c) =>
    c.activities.map((a) => ({
      id: a.id,
      name: a.name,
      points: a.points,
      evidenceRequired: a.evidenceRequired,
    })),
  );
  return {
    ...serializeCycle(cycle!),
    status: cycleStatusToCrm(cycle!.status),
    category: first?.category ?? "MOVE",
    activities,
  };
}

export const CycleService = {
  async list() {
    const rows = await prisma.cycle.findMany({
      include: { challenges: { include: { activities: true } } },
      orderBy: { startDate: "desc" },
    });
    return rows.map((c) => ({
      ...serializeCycle(c),
      challenges: c.challenges.map((ch) => ({
        ...serializeChallenge(ch),
        activities: ch.activities.map(serializeActivity),
      })),
    }));
  },

  async listCrm() {
    const rows = await prisma.cycle.findMany({
      include: { challenges: { include: { activities: true } } },
      orderBy: { startDate: "desc" },
    });
    return rows.map((c) => toCrmCycle(c as never));
  },

  async getCurrent() {
    const cycle =
      (await prisma.cycle.findFirst({
        where: { status: "ACTIVE" },
        include: { challenges: { include: { activities: true } } },
        orderBy: { startDate: "desc" },
      })) ??
      (await prisma.cycle.findFirst({
        include: { challenges: { include: { activities: true } } },
        orderBy: { startDate: "desc" },
      }));
    if (!cycle) return null;
    return {
      ...serializeCycle(cycle),
      challenges: cycle.challenges.map((ch) => ({
        ...serializeChallenge(ch),
        activities: ch.activities.map(serializeActivity),
      })),
    };
  },

  async getById(id: string) {
    const cycle = await prisma.cycle.findUnique({
      where: { id },
      include: { challenges: { include: { activities: true } } },
    });
    if (!cycle) throw notFound("Cycle");
    return toCrmCycle(cycle as never);
  },

  async create(input: {
    name: string;
    startDate: string;
    endDate?: string;
    status?: string;
    category?: ChallengeCategory;
    activities?: Array<{ id?: string; name: string; points: number; evidenceRequired: boolean }>;
  }) {
    const status = crmStatusToCycle(input.status) ?? "UPCOMING";
    if (status === "ACTIVE") {
      const other = await prisma.cycle.findFirst({ where: { status: "ACTIVE" } });
      if (other) throw conflict("CONFLICT", "Another cycle is already active. Close it first.");
    }
    const endDate = input.endDate ?? computeEndDate(input.startDate);
    const cycleId = newId("cycle");
    const category = input.category ?? "MOVE";

    const cycle = await prisma.cycle.create({
      data: {
        id: cycleId,
        name: input.name.trim(),
        startDate: new Date(input.startDate),
        endDate: new Date(endDate),
        status,
        challenges: {
          create: [
            {
              id: newId("challenge"),
              name: `${category.charAt(0)}${category.slice(1).toLowerCase()} Challenge`,
              category,
              objective: "",
              startDate: new Date(input.startDate),
              endDate: new Date(endDate),
              status: status === "CLOSED" ? "CLOSED" : status === "ACTIVE" ? "ACTIVE" : "UPCOMING",
              activities: {
                create: (input.activities ?? []).map((a) => ({
                  id: a.id || newId("activity"),
                  name: a.name.trim(),
                  category,
                  points: Number(a.points) || 0,
                  evidenceRequired: a.evidenceRequired,
                  verificationRequired: true,
                  unit: "NONE",
                  status: "ACTIVE",
                })),
              },
            },
          ],
        },
      },
      include: { challenges: { include: { activities: true } } },
    });
    return toCrmCycle(cycle as never);
  },

  async update(
    id: string,
    input: {
      name?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      category?: ChallengeCategory;
      activities?: Array<{ id?: string; name: string; points: number; evidenceRequired: boolean }>;
    },
  ) {
    const existing = await prisma.cycle.findUnique({
      where: { id },
      include: { challenges: { include: { activities: true } } },
    });
    if (!existing) throw notFound("Cycle");
    if (existing.status === "CLOSED" && input.activities) {
      throw validationError("Closed cycles cannot be edited.");
    }

    const startDate = input.startDate ?? toDateOnly(existing.startDate);
    const endDate = input.endDate ?? computeEndDate(startDate);
    const status = crmStatusToCycle(input.status) ?? existing.status;

    await prisma.cycle.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      },
    });

    if (input.activities) {
      let challenge = existing.challenges[0];
      if (!challenge) {
        challenge = await prisma.challenge.create({
          data: {
            id: newId("challenge"),
            cycleId: id,
            name: "Challenge",
            category: input.category ?? "MOVE",
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: "ACTIVE",
          },
          include: { activities: true },
        });
      } else if (input.category) {
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { category: input.category },
        });
      }

      const existingIds = new Set(challenge.activities.map((row) => row.id));
      const keepIds = input.activities
        .map((a) => a.id)
        .filter((id): id is string => typeof id === "string" && existingIds.has(id));
      await prisma.activity.deleteMany({
        where: { challengeId: challenge.id, id: { notIn: keepIds } },
      });

      for (const a of input.activities) {
        if (a.id && existingIds.has(a.id)) {
          await prisma.activity.update({
            where: { id: a.id },
            data: {
              name: a.name.trim(),
              points: Number(a.points) || 0,
              evidenceRequired: a.evidenceRequired,
              category: input.category ?? challenge.category,
            },
          });
        } else {
          await prisma.activity.create({
            data: {
              id: newId("activity"),
              challengeId: challenge.id,
              name: a.name.trim(),
              category: input.category ?? challenge.category,
              points: Number(a.points) || 0,
              evidenceRequired: a.evidenceRequired,
              verificationRequired: true,
              unit: "NONE",
              status: "ACTIVE",
            },
          });
        }
      }
    }

    return this.getById(id);
  },

  async setStatus(id: string, next: CycleStatus) {
    const cycle = await prisma.cycle.findUnique({ where: { id } });
    if (!cycle) throw notFound("Cycle");
    if (next === "ACTIVE") {
      await prisma.cycle.updateMany({
        where: { status: "ACTIVE", id: { not: id } },
        data: { status: "CLOSED" },
      });
      await prisma.challenge.updateMany({
        where: { cycleId: id },
        data: { status: "ACTIVE" },
      });
    }
    if (next === "CLOSED") {
      await prisma.challenge.updateMany({
        where: { cycleId: id },
        data: { status: "CLOSED" },
      });
    }
    await prisma.cycle.update({ where: { id }, data: { status: next } });
    return this.getById(id);
  },
};
