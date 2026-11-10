import type { Prisma, SubmissionStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { conflict, forbidden, notFound, validationError } from "../../lib/errors.js";
import { displayName, newId, serializeSubmission } from "../../lib/serializers.js";
import type { AuthUser } from "../../middleware/auth.js";

function canVerify(auth: AuthUser, submitterTeamId: string | null) {
  if (auth.roles.some((r) => r === "HR_ADMIN" || r === "SUPER_USER")) return true;
  if (auth.roles.includes("TEAM_LEADER") && submitterTeamId && auth.teamId === submitterTeamId) return true;
  return false;
}

export const SubmissionService = {
  async list(opts: {
    query?: string;
    userId?: string;
    teamId?: string;
    locationId?: string;
    cycleId?: string;
    challengeId?: string;
    activityId?: string;
    status?: string;
    page: number;
    pageSize: number;
    skip: number;
  }) {
    const where: Prisma.SubmissionWhereInput = {};
    if (opts.userId) where.userId = opts.userId;
    if (opts.cycleId) where.cycleId = opts.cycleId;
    if (opts.challengeId) where.challengeId = opts.challengeId;
    if (opts.activityId) where.activityId = opts.activityId;
    if (opts.status && opts.status !== "ALL") where.status = opts.status as SubmissionStatus;
    if (opts.teamId) where.user = { teamId: opts.teamId };
    if (opts.locationId) where.user = { ...(where.user as object), locationId: opts.locationId };
    if (opts.query) {
      const q = opts.query.trim();
      where.OR = [
        { notes: { contains: q, mode: "insensitive" } },
        { activity: { name: { contains: q, mode: "insensitive" } } },
        { user: { firstName: { contains: q, mode: "insensitive" } } },
        { user: { lastName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, rows] = await prisma.$transaction([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        include: { user: true, activity: true, cycle: true, verifier: true },
        orderBy: { submittedAt: "desc" },
        skip: opts.skip,
        take: opts.pageSize,
      }),
    ]);

    return {
      items: rows.map((s) =>
        serializeSubmission(s, {
          guardName: displayName(s.user),
          activityName: s.activity.name,
          cycleName: s.cycle.name,
          reviewerName: s.verifier ? displayName(s.verifier) : null,
        }),
      ),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  },

  async getById(id: string) {
    const s = await prisma.submission.findUnique({
      where: { id },
      include: { user: true, activity: true, cycle: true, verifier: true, challenge: true },
    });
    if (!s) throw notFound("Submission");
    return {
      ...serializeSubmission(s, {
        guardName: displayName(s.user),
        activityName: s.activity.name,
        cycleName: s.cycle.name,
        reviewerName: s.verifier ? displayName(s.verifier) : null,
      }),
      category: s.challenge.category,
    };
  },

  async create(
    auth: AuthUser,
    input: {
      activityId: string;
      activityDate: string;
      durationMinutes?: number | null;
      quantity?: number | null;
      notes?: string;
      evidenceUri?: string | null;
    },
  ) {
    const activity = await prisma.activity.findUnique({
      where: { id: input.activityId },
      include: { challenge: { include: { cycle: true } } },
    });
    if (!activity) throw notFound("Activity");
    if (activity.status !== "ACTIVE") throw validationError("This activity is not active.");
    if (activity.challenge.status !== "ACTIVE") throw validationError("This challenge is not active.");
    if (activity.challenge.cycle.status !== "ACTIVE") throw validationError("This cycle is not active.");
    if (activity.evidenceRequired && !input.evidenceUri) {
      throw validationError("Photo evidence is required for this activity.");
    }

    const submitter = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!submitter || submitter.status !== "ACTIVE") throw validationError("Inactive users cannot submit.");

    const blocker = await prisma.submission.findFirst({
      where: {
        userId: auth.userId,
        activityId: activity.id,
        cycleId: activity.challenge.cycleId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (blocker?.status === "APPROVED") {
      throw conflict(
        "ACTIVITY_ALREADY_APPROVED",
        "This activity is already approved for the current cycle. You can do it again in the next cycle.",
      );
    }
    if (blocker?.status === "PENDING") {
      throw conflict(
        "ACTIVITY_ALREADY_SUBMITTED",
        "This activity is already waiting for verification. You can resubmit only if it is rejected.",
      );
    }

    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.submission.create({
        data: {
          id: newId("sub"),
          userId: auth.userId,
          activityId: activity.id,
          challengeId: activity.challengeId,
          cycleId: activity.challenge.cycleId,
          activityDate: new Date(input.activityDate),
          durationMinutes: input.durationMinutes ?? null,
          quantity: input.quantity ?? null,
          notes: input.notes ?? "",
          evidenceUri: input.evidenceUri ?? null,
          status: "PENDING",
          expectedPoints: activity.points,
          awardedPoints: 0,
        },
        include: { user: true, activity: true, cycle: true },
      });

      const leaderId = submitter.teamId
        ? (await tx.team.findUnique({ where: { id: submitter.teamId } }))?.leaderId
        : null;
      if (leaderId && leaderId !== auth.userId) {
        await tx.notification.create({
          data: {
            id: newId("ntf"),
            userId: leaderId,
            type: "SUBMISSION_SUBMITTED",
            title: "Pending verification",
            body: `${displayName(submitter)} submitted ${activity.name} for review.`,
            relatedSubmissionId: created.id,
          },
        });
      }
      await tx.notification.create({
        data: {
          id: newId("ntf"),
          userId: auth.userId,
          type: "SUBMISSION_SUBMITTED",
          title: "Submission received",
          body: `Your ${activity.name} activity was submitted for verification.`,
          relatedSubmissionId: created.id,
        },
      });
      return created;
    });

    return serializeSubmission(submission, {
      guardName: displayName(submission.user),
      activityName: submission.activity.name,
      cycleName: submission.cycle.name,
    });
  },

  async approve(id: string, auth: AuthUser) {
    const current = await prisma.submission.findUnique({
      where: { id },
      include: { user: true, activity: true, points: true },
    });
    if (!current) throw notFound("Submission");
    if (current.status !== "PENDING") throw validationError("Only pending submissions can be approved.");
    if (current.points) throw conflict("CONFLICT", "Points have already been awarded for this submission.");
    if (!canVerify(auth, current.user.teamId)) throw forbidden("You can only verify submissions for your team.");

    const required =
      (await prisma.activity.count({
        where: { challengeId: current.challengeId, status: "ACTIVE" },
      })) || 1;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.submission.update({
        where: { id },
        data: {
          status: "APPROVED",
          awardedPoints: current.expectedPoints,
          verifierId: auth.userId,
          verifiedAt: new Date(),
          rejectionReason: null,
        },
        include: { user: true, activity: true, cycle: true, verifier: true },
      });

      await tx.pointsTransaction.create({
        data: {
          id: newId("pts"),
          userId: current.userId,
          category: current.activity.category,
          amount: current.expectedPoints,
          reason: `Approved: ${current.activity.name}`,
          submissionId: current.id,
        },
      });

      const existing = await tx.progressRecord.findUnique({
        where: { userId_challengeId: { userId: current.userId, challengeId: current.challengeId } },
      });
      const weekStatuses = (existing?.weekStatuses as string[] | undefined) ?? [
        "NOT_STARTED",
        "NOT_STARTED",
        "NOT_STARTED",
      ];
      const currentWeek = weekStatuses.findIndex((s) => s !== "COMPLETED");
      const weekIndex = currentWeek === -1 ? weekStatuses.length - 1 : currentWeek;
      if (weekStatuses[weekIndex] === "NOT_STARTED") weekStatuses[weekIndex] = "IN_PROGRESS";

      const activitiesCompleted = Math.min(required, (existing?.activitiesCompleted ?? 0) + 1);
      const percent = Math.round((activitiesCompleted / required) * 100);

      await tx.progressRecord.upsert({
        where: { userId_challengeId: { userId: current.userId, challengeId: current.challengeId } },
        create: {
          id: newId("prg"),
          userId: current.userId,
          cycleId: current.cycleId,
          challengeId: current.challengeId,
          percent,
          activitiesCompleted,
          activitiesRequired: required,
          weeksParticipated: 1,
          weeksRequired: 3,
          consecutiveWeeks: 1,
          weekStatuses,
        },
        update: {
          percent,
          activitiesCompleted,
          activitiesRequired: required,
          weekStatuses,
        },
      });

      await tx.notification.create({
        data: {
          id: newId("ntf"),
          userId: current.userId,
          type: "SUBMISSION_APPROVED",
          title: "Points awarded",
          body: `+${current.expectedPoints} Guard Points awarded for ${current.activity.name}.`,
          relatedSubmissionId: current.id,
        },
      });

      return row;
    });

    return serializeSubmission(updated, {
      guardName: displayName(updated.user),
      activityName: updated.activity.name,
      cycleName: updated.cycle.name,
      reviewerName: updated.verifier ? displayName(updated.verifier) : null,
    });
  },

  async reject(id: string, auth: AuthUser, reason: string) {
    if (!reason?.trim()) throw validationError("A rejection reason is required.");
    const current = await prisma.submission.findUnique({
      where: { id },
      include: { user: true, activity: true },
    });
    if (!current) throw notFound("Submission");
    if (current.status !== "PENDING") throw validationError("Only pending submissions can be rejected.");
    if (!canVerify(auth, current.user.teamId)) throw forbidden("You can only verify submissions for your team.");

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.submission.update({
        where: { id },
        data: {
          status: "REJECTED",
          awardedPoints: 0,
          verifierId: auth.userId,
          verifiedAt: new Date(),
          rejectionReason: reason.trim(),
        },
        include: { user: true, activity: true, cycle: true, verifier: true },
      });
      await tx.notification.create({
        data: {
          id: newId("ntf"),
          userId: current.userId,
          type: "SUBMISSION_REJECTED",
          title: "Submission rejected",
          body: `${current.activity.name} was rejected. ${reason.trim()}`,
          relatedSubmissionId: current.id,
        },
      });
      return row;
    });

    return serializeSubmission(updated, {
      guardName: displayName(updated.user),
      activityName: updated.activity.name,
      cycleName: updated.cycle.name,
      reviewerName: updated.verifier ? displayName(updated.verifier) : null,
    });
  },
};
