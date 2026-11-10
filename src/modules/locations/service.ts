import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";
import { newId, serializeLocation } from "../../lib/serializers.js";

export const LocationService = {
  async list(opts: { query?: string; status?: string; page: number; pageSize: number; skip: number }) {
    const where: Prisma.LocationWhereInput = {};
    if (opts.status && opts.status !== "ALL") where.status = opts.status as "ACTIVE" | "INACTIVE";
    if (opts.query) where.name = { contains: opts.query, mode: "insensitive" };

    const [total, rows] = await prisma.$transaction([
      prisma.location.count({ where }),
      prisma.location.findMany({
        where,
        include: { _count: { select: { users: true } } },
        orderBy: { name: "asc" },
        skip: opts.skip,
        take: opts.pageSize,
      }),
    ]);

    return {
      items: rows.map((l) => ({
        ...serializeLocation(l),
        guardsCount: l._count.users,
      })),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  },

  async listAll() {
    const rows = await prisma.location.findMany({ orderBy: { name: "asc" } });
    return rows.map(serializeLocation);
  },

  async getById(id: string) {
    const loc = await prisma.location.findUnique({
      where: { id },
      include: { users: { include: { roles: true } } },
    });
    if (!loc) throw notFound("Location");
    return {
      ...serializeLocation(loc),
      guards: loc.users
        .filter((u) => u.roles.some((r) => r.role === "GUARD"))
        .map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          employeeId: u.employeeId,
          status: u.status,
        })),
    };
  },

  async create(input: { name: string; code?: string; status?: "ACTIVE" | "INACTIVE" }) {
    const loc = await prisma.location.create({
      data: {
        id: newId("loc"),
        name: input.name.trim(),
        code: (input.code ?? input.name.slice(0, 4)).trim().toUpperCase().replace(/\s+/g, ""),
        status: input.status ?? "ACTIVE",
      },
    });
    return serializeLocation(loc);
  },

  async update(id: string, patch: { name?: string; status?: "ACTIVE" | "INACTIVE" }) {
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) throw notFound("Location");
    const loc = await prisma.location.update({
      where: { id },
      data: { name: patch.name?.trim(), status: patch.status },
    });
    return serializeLocation(loc);
  },

  async setStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    return this.update(id, { status });
  },
};
