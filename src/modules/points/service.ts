import type { PointsCategory, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { displayName, serializePoints } from "../../lib/serializers.js";

export const PointsService = {
  async list(opts: { userId?: string; category?: string; query?: string; page: number; pageSize: number; skip: number }) {
    const where: Prisma.PointsTransactionWhereInput = {};
    if (opts.userId) where.userId = opts.userId;
    if (opts.category && opts.category !== "ALL") where.category = opts.category as PointsCategory;
    if (opts.query) {
      const q = opts.query.trim();
      where.OR = [
        { reason: { contains: q, mode: "insensitive" } },
        { user: { firstName: { contains: q, mode: "insensitive" } } },
        { user: { lastName: { contains: q, mode: "insensitive" } } },
      ];
    }
    const [total, rows] = await prisma.$transaction([
      prisma.pointsTransaction.count({ where }),
      prisma.pointsTransaction.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        skip: opts.skip,
        take: opts.pageSize,
      }),
    ]);
    return {
      items: rows.map((tx) => serializePoints(tx, { guardName: displayName(tx.user) })),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  },

  async forUser(userId: string) {
    const items = await prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const byCategory = {
      MOVE: 0,
      PROGRESS: 0,
      RECOGNITION: 0,
      CONSISTENCY: 0,
      BONUS: 0,
      total: 0,
    };
    for (const tx of items) {
      byCategory[tx.category] += tx.amount;
      byCategory.total += tx.amount;
    }
    return { items: items.map((tx) => serializePoints(tx)), totals: byCategory, total: byCategory.total };
  },

  async summary() {
    const txs = await prisma.pointsTransaction.findMany({ include: { user: { include: { team: true } } } });
    const byCategory = { MOVE: 0, PROGRESS: 0, RECOGNITION: 0 } as Record<"MOVE" | "PROGRESS" | "RECOGNITION", number>;
    const byUser = new Map<string, { name: string; points: number; team: string }>();
    let total = 0;
    for (const tx of txs) {
      total += tx.amount;
      if (tx.category === "MOVE" || tx.category === "PROGRESS" || tx.category === "RECOGNITION") {
        byCategory[tx.category] += tx.amount;
      }
      const cur = byUser.get(tx.userId) ?? {
        name: displayName(tx.user),
        points: 0,
        team: tx.user.team?.name ?? "—",
      };
      cur.points += tx.amount;
      byUser.set(tx.userId, cur);
    }
    const top = [...byUser.entries()]
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.points - a.points);
    return { total, byCategory, top };
  },
};
