import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound, validationError } from "../../lib/errors.js";
import { generateTemporaryPassword, hashPassword } from "../../lib/password.js";
import { newId, serializeUser } from "../../lib/serializers.js";

const include = { roles: true, team: true, location: true } as const;

function staffWhere(role?: string, fieldOnly?: boolean): Prisma.UserWhereInput {
  if (role && role !== "ALL") {
    return { roles: { some: { role: role as UserRole } } };
  }
  if (fieldOnly) {
    return { roles: { some: { role: { in: ["GUARD", "TEAM_LEADER"] } } } };
  }
  return {};
}

export const EmployeeService = {
  async list(opts: {
    query?: string;
    role?: string;
    teamId?: string;
    locationId?: string;
    status?: string;
    sort?: string;
    fieldOnly?: boolean;
    page: number;
    pageSize: number;
    skip: number;
  }) {
    const where: Prisma.UserWhereInput = {
      ...staffWhere(opts.role, opts.fieldOnly),
    };
    if (opts.status && opts.status !== "ALL") where.status = opts.status as "ACTIVE" | "INACTIVE";
    if (opts.teamId && opts.teamId !== "ALL") where.teamId = opts.teamId;
    if (opts.locationId && opts.locationId !== "ALL") where.locationId = opts.locationId;
    if (opts.query) {
      const q = opts.query.trim();
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { employeeId: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput =
      opts.sort === "employeeId"
        ? { employeeId: "asc" }
        : { firstName: "asc" };

    const [total, rows] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, include, orderBy, skip: opts.skip, take: opts.pageSize }),
    ]);

    return { items: rows.map((u) => serializeUser(u)), total, page: opts.page, pageSize: opts.pageSize };
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, include });
    if (!user) throw notFound("Employee");
    return serializeUser(user);
  },

  async listTeamMembers(teamId: string) {
    const rows = await prisma.user.findMany({
      where: { teamId, status: "ACTIVE" },
      include,
      orderBy: { firstName: "asc" },
    });
    return rows.map((u) => serializeUser(u));
  },

  async create(input: {
    employeeId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    roles: UserRole[];
    teamId?: string | null;
    locationId?: string | null;
  }) {
    const employeeId = input.employeeId.trim().toUpperCase();
    const exists = await prisma.user.findFirst({
      where: { employeeId: { equals: employeeId, mode: "insensitive" } },
    });
    if (exists) throw conflict("CONFLICT", "Employee ID already exists.");
    if (!input.roles.length) throw validationError("At least one role is required.");

    const temporaryPassword = generateTemporaryPassword();
    const user = await prisma.user.create({
      data: {
        id: newId("user"),
        employeeId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() ?? "",
        email: input.email?.trim() || null,
        teamId: input.teamId ?? null,
        locationId: input.locationId ?? null,
        status: "ACTIVE",
        mustChangePassword: true,
        passwordHash: await hashPassword(temporaryPassword),
        roles: { create: input.roles.map((role) => ({ role })) },
      },
      include,
    });
    return { user: serializeUser(user, { temporaryPassword }), temporaryPassword };
  },

  async update(
    id: string,
    patch: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string | null;
      teamId?: string | null;
      locationId?: string | null;
      roles?: UserRole[];
      status?: "ACTIVE" | "INACTIVE";
    },
  ) {
    const existing = await prisma.user.findUnique({ where: { id }, include });
    if (!existing) throw notFound("Employee");

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: patch.firstName?.trim(),
        lastName: patch.lastName?.trim(),
        phone: patch.phone,
        email: patch.email,
        teamId: patch.teamId,
        locationId: patch.locationId,
        status: patch.status,
        ...(patch.roles
          ? {
              roles: {
                deleteMany: {},
                create: patch.roles.map((role) => ({ role })),
              },
            }
          : {}),
      },
      include,
    });
    return serializeUser(user);
  },

  async setStatus(id: string, status: "ACTIVE" | "INACTIVE") {
    const existing = await prisma.user.findUnique({ where: { id }, include });
    if (!existing) throw notFound("Employee");
    const user = await prisma.user.update({ where: { id }, data: { status }, include });
    return serializeUser(user);
  },

  async resetPassword(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw notFound("Employee");
    const temporaryPassword = generateTemporaryPassword();
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(temporaryPassword),
        mustChangePassword: true,
      },
    });
    return { temporaryPassword, tempPassword: temporaryPassword };
  },
};
