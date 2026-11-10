import { prisma } from "../../lib/prisma.js";
import { serializeNotification } from "../../lib/serializers.js";

export const NotificationService = {
  async list(userId: string, unreadOnly?: boolean) {
    const rows = await prisma.notification.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(serializeNotification);
  },

  async markRead(id: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id, OR: [{ userId }, { userId: null }] },
      data: { readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  },

  async getPreferences(userId: string) {
    const row = await prisma.notificationPreference.findUnique({ where: { userId } });
    return (
      row ?? {
        userId,
        submissions: true,
        approvals: true,
        challenges: true,
        points: true,
      }
    );
  },

  async updatePreferences(
    userId: string,
    patch: Partial<{ submissions: boolean; approvals: boolean; challenges: boolean; points: boolean }>,
  ) {
    const row = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        submissions: patch.submissions ?? true,
        approvals: patch.approvals ?? true,
        challenges: patch.challenges ?? true,
        points: patch.points ?? true,
      },
      update: patch,
    });
    return row;
  },
};
