import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";
import { newId, serializeTeam } from "../../lib/serializers.js";

export const TeamService = {
  async list(opts: { query?: string; status?: string; page: number; pageSize: number; skip: number }) {
    const where: Prisma.TeamWhereInput = {};
    if (opts.status && opts.status !== "ALL") where.status = opts.status as "ACTIVE" | "INACTIVE";
    if (opts.query) where.name = { contains: opts.query, mode: "insensitive" };

    const [total, rows] = await prisma.$transaction([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        include: { location: true, _count: { select: { members: true } } },
        orderBy: { name: "asc" },
        skip: opts.skip,
        take: opts.pageSize,
      }),
    ]);

    return {
      items: rows.map((t) => ({
        ...serializeTeam(t),
        locationName: t.location?.name ?? "—",
        membersCount: t._count.members,
      })),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  },

  async listAll() {
    const rows = await prisma.team.findMany({ orderBy: { name: "asc" } });
    return rows.map(serializeTeam);
  },

  async getById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        location: true,
        members: { include: { roles: true }, orderBy: { firstName: "asc" } },
      },
    });
    if (!team) throw notFound("Team");
    return {
      ...serializeTeam(team),
      locationName: team.location?.name ?? "—",
      members: team.members.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        employeeId: m.employeeId,
        email: m.email,
        role: m.roles[0]?.role ?? "GUARD",
        roles: m.roles.map((r) => r.role),
        teamId: m.teamId,
        locationId: m.locationId,
        status: m.status,
      })),
    };
  },

  async create(input: { name: string; code?: string; locationId?: string | null; leaderId?: string | null; status?: "ACTIVE" | "INACTIVE" }) {
    const team = await prisma.team.create({
      data: {
        id: newId("team"),
        name: input.name.trim(),
        code: (input.code ?? input.name.slice(0, 4)).trim().toUpperCase().replace(/\s+/g, ""),
        locationId: input.locationId ?? null,
        leaderId: input.leaderId ?? null,
        status: input.status ?? "ACTIVE",
      },
    });
    return serializeTeam(team);
  },

  async update(
    id: string,
    patch: { name?: string; locationId?: string | null; leaderId?: string | null; status?: "ACTIVE" | "INACTIVE" },
  ) {
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) throw notFound("Team");
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: patch.name?.trim(),
        locationId: patch.locationId,
        leaderId: patch.leaderId,
        status: patch.status,
      },
    });
    return serializeTeam(team);
  },

  async deactivate(id: string) {
    return this.update(id, { status: "INACTIVE" });
  },

  async assignLeader(id: string, leaderId: string) {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw notFound("Team");
    const user = await prisma.user.findUnique({ where: { id: leaderId }, include: { roles: true } });
    if (!user) throw notFound("Employee");

    await prisma.$transaction(async (tx) => {
      await tx.team.update({ where: { id }, data: { leaderId } });
      await tx.user.update({ where: { id: leaderId }, data: { teamId: id } });
      if (!user.roles.some((r) => r.role === "TEAM_LEADER")) {
        await tx.userRoleAssignment.create({ data: { userId: leaderId, role: "TEAM_LEADER" } });
      }
    });
    return this.getById(id);
  },
};
