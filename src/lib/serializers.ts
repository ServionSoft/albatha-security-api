import type {
  Activity,
  Challenge,
  Cycle,
  Location,
  Notification,
  PointsTransaction,
  ProgressRecord,
  Submission,
  Team,
  User,
  UserRole,
  UserRoleAssignment,
} from "@prisma/client";
import { env } from "../config/env.js";

type UserWithRoles = User & { roles: UserRoleAssignment[]; team?: Team | null; location?: Location | null };

export function displayName(user: Pick<User, "firstName" | "lastName">) {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function toDateOnly(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function publicFileUrl(uri: string | null | undefined) {
  if (!uri) return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  if (uri.startsWith("/uploads/")) return `${env.PUBLIC_BASE_URL}${uri}`;
  return uri;
}

export function serializeUser(user: UserWithRoles, extra?: { temporaryPassword?: string }) {
  const roles = user.roles.map((r) => r.role);
  return {
    id: user.id,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    name: displayName(user),
    phone: user.phone,
    email: user.email,
    avatarUri: publicFileUrl(user.avatarUri),
    roles,
    role: roles[0] ?? "GUARD",
    teamId: user.teamId,
    teamName: user.team?.name ?? null,
    locationId: user.locationId,
    locationName: user.location?.name ?? null,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    ...(extra?.temporaryPassword ? { temporaryPassword: extra.temporaryPassword } : {}),
  };
}

export function serializeLocation(location: Location) {
  return {
    id: location.id,
    name: location.name,
    code: location.code,
    status: location.status,
    createdAt: location.createdAt.toISOString(),
  };
}

export function serializeTeam(team: Team) {
  return {
    id: team.id,
    name: team.name,
    code: team.code,
    leaderId: team.leaderId,
    leaderUserId: team.leaderId,
    locationId: team.locationId,
    status: team.status,
    createdAt: team.createdAt.toISOString(),
  };
}

export function serializeCycle(cycle: Cycle) {
  return {
    id: cycle.id,
    name: cycle.name,
    startDate: toDateOnly(cycle.startDate),
    endDate: toDateOnly(cycle.endDate),
    status: cycle.status,
    createdAt: cycle.createdAt.toISOString(),
  };
}

export function serializeChallenge(challenge: Challenge) {
  return {
    id: challenge.id,
    cycleId: challenge.cycleId,
    name: challenge.name,
    category: challenge.category,
    objective: challenge.objective,
    tagline: challenge.tagline,
    startDate: toDateOnly(challenge.startDate),
    endDate: toDateOnly(challenge.endDate),
    status: challenge.status,
    createdAt: challenge.createdAt.toISOString(),
  };
}

export function serializeActivity(activity: Activity) {
  return {
    id: activity.id,
    challengeId: activity.challengeId,
    name: activity.name,
    category: activity.category,
    objective: activity.objective,
    requirement: activity.requirement,
    unit: activity.unit,
    points: activity.points,
    evidenceRequired: activity.evidenceRequired,
    verificationRequired: activity.verificationRequired,
    status: activity.status,
    deadline: activity.deadline ? toDateOnly(activity.deadline) : undefined,
    defaultQuantity: activity.defaultQuantity ?? undefined,
  };
}

export function serializeSubmission(
  submission: Submission,
  extras?: { guardName?: string; activityName?: string; cycleName?: string; reviewerName?: string | null },
) {
  return {
    id: submission.id,
    userId: submission.userId,
    guardUserId: submission.userId,
    activityId: submission.activityId,
    challengeId: submission.challengeId,
    cycleId: submission.cycleId,
    activityDate: toDateOnly(submission.activityDate),
    submittedAt: submission.submittedAt.toISOString(),
    submittedDate: toDateOnly(submission.submittedAt),
    durationMinutes: submission.durationMinutes,
    quantity: submission.quantity,
    notes: submission.notes,
    evidenceUri: publicFileUrl(submission.evidenceUri),
    status: submission.status,
    expectedPoints: submission.expectedPoints,
    awardedPoints: submission.awardedPoints,
    pointsIfApproved: submission.expectedPoints,
    verifierId: submission.verifierId,
    reviewerId: submission.verifierId,
    verifiedAt: submission.verifiedAt?.toISOString() ?? null,
    rejectionReason: submission.rejectionReason,
    activityName: extras?.activityName,
    guardName: extras?.guardName,
    cycleName: extras?.cycleName,
    reviewerName: extras?.reviewerName ?? null,
  };
}

export function serializePoints(tx: PointsTransaction, extras?: { guardName?: string }) {
  return {
    id: tx.id,
    userId: tx.userId,
    category: tx.category,
    amount: tx.amount,
    reason: tx.reason,
    submissionId: tx.submissionId,
    createdAt: tx.createdAt.toISOString(),
    guardName: extras?.guardName,
  };
}

export function serializeProgress(
  record: ProgressRecord,
  extras?: {
    guardName?: string;
    teamName?: string | null;
    cycleName?: string;
    challengeName?: string;
    category?: Challenge["category"];
  },
) {
  return {
    id: record.id,
    userId: record.userId,
    cycleId: record.cycleId,
    challengeId: record.challengeId,
    percent: record.percent,
    activitiesCompleted: record.activitiesCompleted,
    activitiesRequired: record.activitiesRequired,
    weeksParticipated: record.weeksParticipated,
    weeksRequired: record.weeksRequired,
    consecutiveWeeks: record.consecutiveWeeks,
    weekStatuses: record.weekStatuses,
    guardName: extras?.guardName,
    teamName: extras?.teamName ?? null,
    cycleName: extras?.cycleName,
    challengeName: extras?.challengeName,
    category: extras?.category,
    participationPercent: record.activitiesRequired
      ? Math.round((record.activitiesCompleted / record.activitiesRequired) * 100)
      : 0,
    consistencyPercent: record.weeksRequired
      ? Math.round((record.weeksParticipated / record.weeksRequired) * 100)
      : 0,
  };
}

export function serializeNotification(n: Notification) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.readAt !== null,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
    relatedSubmissionId: n.relatedSubmissionId ?? undefined,
  };
}

export function pickDefaultRole(roles: UserRole[], preferred?: UserRole): UserRole {
  if (preferred && roles.includes(preferred)) return preferred;
  const order: UserRole[] = ["SUPER_USER", "HR_ADMIN", "MANAGEMENT", "TEAM_LEADER", "GUARD"];
  return order.find((r) => roles.includes(r)) ?? roles[0] ?? "GUARD";
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function cycleStatusToCrm(status: Cycle["status"]) {
  return status === "UPCOMING" ? "DRAFT" : status;
}

export function crmStatusToCycle(status?: string) {
  if (status === "DRAFT") return "UPCOMING" as const;
  if (status === "ACTIVE" || status === "CLOSED" || status === "UPCOMING") return status;
  return undefined;
}
