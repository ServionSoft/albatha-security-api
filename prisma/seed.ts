import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_PASSWORD = "Abre@123";
const FIELD_PASSWORD = "password";

async function hash(plain: string) {
  return bcrypt.hash(plain, 10);
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.progressRecord.deleteMany();
  await prisma.pointsTransaction.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.team.updateMany({ data: { leaderId: null } });
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.location.deleteMany();

  await prisma.location.createMany({
    data: [
      { id: "loc_dubai_hills", name: "Dubai Hills Estate", code: "DHE", status: "ACTIVE", createdAt: new Date("2024-01-01T08:00:00.000Z") },
      { id: "loc_al_furjan", name: "Al Furjan", code: "FJN", status: "ACTIVE", createdAt: new Date("2024-01-01T08:00:00.000Z") },
      { id: "loc_nad_al_sheba", name: "Nad Al Sheba", code: "NAS", status: "ACTIVE", createdAt: new Date("2024-06-01T08:00:00.000Z") },
    ],
  });

  await prisma.team.createMany({
    data: [
      { id: "team_gold", name: "Gold Guards", code: "GOLD", locationId: "loc_dubai_hills", status: "ACTIVE", createdAt: new Date("2025-01-01T08:00:00.000Z") },
      { id: "team_platinum", name: "Platinum Guards", code: "PLAT", locationId: "loc_al_furjan", status: "ACTIVE", createdAt: new Date("2025-01-01T08:00:00.000Z") },
      { id: "team_silver", name: "Silver Guards", code: "SLVR", locationId: "loc_nad_al_sheba", status: "ACTIVE", createdAt: new Date("2025-03-01T08:00:00.000Z") },
    ],
  });

  const fieldHash = await hash(FIELD_PASSWORD);
  const adminHash = await hash(ADMIN_PASSWORD);
  const now = new Date("2026-09-02T08:00:00.000Z");

  const users: Array<Prisma.UserCreateInput & { roleList: Prisma.UserRoleAssignmentCreateManyUserInput[] }> = [
    { id: "user_ahmed_khan", employeeId: "ABRE-00125", firstName: "Ahmed", lastName: "Khan", phone: "+971501112125", email: "ahmed.khan@abre.ae", team: { connect: { id: "team_gold" } }, location: { connect: { id: "loc_dubai_hills" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2025-01-12T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }, { role: "TEAM_LEADER" }] },
    { id: "user_fatima_hashimi", employeeId: "ABRE-00126", firstName: "Fatima", lastName: "Al Hashimi", phone: "+971501112126", email: "fatima.hashimi@abre.ae", team: { connect: { id: "team_gold" } }, location: { connect: { id: "loc_dubai_hills" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2025-02-03T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }] },
    { id: "user_omar_suwaidi", employeeId: "ABRE-00127", firstName: "Omar", lastName: "Al Suwaidi", phone: "+971501112127", email: "omar.suwaidi@abre.ae", team: { connect: { id: "team_gold" } }, location: { connect: { id: "loc_dubai_hills" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2025-03-18T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }] },
    { id: "user_sara_ibrahim", employeeId: "ABRE-00128", firstName: "Sara", lastName: "Ibrahim", phone: "+971501112128", email: "sara.ibrahim@abre.ae", team: { connect: { id: "team_platinum" } }, location: { connect: { id: "loc_al_furjan" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2025-04-01T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }] },
    { id: "user_khalid_rahman", employeeId: "ABRE-00129", firstName: "Khalid", lastName: "Rahman", phone: "+971501112129", email: "khalid.rahman@abre.ae", team: { connect: { id: "team_platinum" } }, location: { connect: { id: "loc_al_furjan" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2024-11-20T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }, { role: "TEAM_LEADER" }] },
    { id: "user_layla_qasimi", employeeId: "ABRE-00131", firstName: "Layla", lastName: "Al Qasimi", phone: "+971501112131", email: "layla.qasimi@abre.ae", team: { connect: { id: "team_silver" } }, location: { connect: { id: "loc_nad_al_sheba" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2025-05-09T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }] },
    { id: "user_yousuf_nasser", employeeId: "ABRE-00132", firstName: "Yousuf", lastName: "Nasser", phone: "+971501112132", email: "yousuf.nasser@abre.ae", team: { connect: { id: "team_platinum" } }, location: { connect: { id: "loc_al_furjan" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2025-06-14T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }] },
    { id: "user_mariam_zaabi", employeeId: "ABRE-00133", firstName: "Mariam", lastName: "Al Zaabi", phone: "+971501112133", email: "mariam.zaabi@abre.ae", team: { connect: { id: "team_silver" } }, location: { connect: { id: "loc_nad_al_sheba" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2025-07-02T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }] },
    { id: "user_noura_hr", employeeId: "ABRE-00900", firstName: "Noura", lastName: "Al Ketbi", phone: "+971501119000", email: "noura.ketbi@abre.ae", location: { connect: { id: "loc_dubai_hills" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: adminHash, createdAt: new Date("2024-01-10T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "HR_ADMIN" }] },
    { id: "user_mohammed_mgmt", employeeId: "ABRE-00800", firstName: "Mohammed", lastName: "Albatha", phone: "+971501118000", email: "mohammed.albatha@abre.ae", location: { connect: { id: "loc_dubai_hills" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: adminHash, createdAt: new Date("2023-09-01T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "MANAGEMENT" }] },
    { id: "user_hessa_super", employeeId: "ABRE-00999", firstName: "Hessa", lastName: "Al Falasi", phone: "+971501119999", email: "hessa.falasi@abre.ae", location: { connect: { id: "loc_dubai_hills" } }, status: "ACTIVE", mustChangePassword: false, passwordHash: adminHash, createdAt: new Date("2023-01-15T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "SUPER_USER" }] },
    { id: "user_inactive_hassan", employeeId: "ABRE-00130", firstName: "Hassan", lastName: "Ali", phone: "+971501112130", email: "hassan.ali@abre.ae", team: { connect: { id: "team_gold" } }, location: { connect: { id: "loc_dubai_hills" } }, status: "INACTIVE", mustChangePassword: false, passwordHash: fieldHash, createdAt: new Date("2024-08-22T08:00:00.000Z"), updatedAt: now, roleList: [{ role: "GUARD" }] },
  ];

  for (const user of users) {
    const { roleList, ...data } = user;
    await prisma.user.create({
      data: {
        ...data,
        roles: { create: roleList },
      },
    });
  }

  await prisma.team.update({ where: { id: "team_gold" }, data: { leaderId: "user_ahmed_khan" } });
  await prisma.team.update({ where: { id: "team_platinum" }, data: { leaderId: "user_khalid_rahman" } });

  await prisma.cycle.createMany({
    data: [
      { id: "cycle_q2_2026", name: "Q2 2026 Guard Development Cycle", startDate: new Date("2026-04-01"), endDate: new Date("2026-06-30"), status: "CLOSED", createdAt: new Date("2026-03-15T08:00:00.000Z") },
      { id: "cycle_q3_2026", name: "Q3 2026 Guard Development Cycle", startDate: new Date("2026-08-01"), endDate: new Date("2026-09-14"), status: "ACTIVE", createdAt: new Date("2026-07-15T08:00:00.000Z") },
      { id: "cycle_q4_2026", name: "Q4 2026 Guard Development Cycle", startDate: new Date("2026-10-01"), endDate: new Date("2026-12-15"), status: "UPCOMING", createdAt: new Date("2026-08-20T08:00:00.000Z") },
    ],
  });

  await prisma.challenge.createMany({
    data: [
      { id: "challenge_move_q3", cycleId: "cycle_q3_2026", name: "Move Challenge", category: "MOVE", objective: "Stay active through approved physical activities and build a consistent weekly habit.", tagline: "Stay Active", startDate: new Date("2026-09-01"), endDate: new Date("2026-09-14"), status: "ACTIVE", createdAt: new Date("2026-08-20T08:00:00.000Z") },
      { id: "challenge_progress_q3", cycleId: "cycle_q3_2026", name: "Progress Challenge", category: "PROGRESS", objective: "Complete professional development activities that strengthen on-site performance.", startDate: new Date("2026-09-01"), endDate: new Date("2026-09-14"), status: "ACTIVE", createdAt: new Date("2026-08-20T08:00:00.000Z") },
      { id: "challenge_recognition_q3", cycleId: "cycle_q3_2026", name: "Recognition Challenge", category: "RECOGNITION", objective: "Recognise outstanding service, professionalism, and team contribution.", startDate: new Date("2026-09-01"), endDate: new Date("2026-09-14"), status: "ACTIVE", createdAt: new Date("2026-08-20T08:00:00.000Z") },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { id: "activity_walking", challengeId: "challenge_move_q3", name: "Walking", category: "MOVE", objective: "Complete a brisk walk to support daily movement and wellbeing.", requirement: "Minimum 30 minutes of walking", unit: "MINUTES", points: 100, evidenceRequired: true, verificationRequired: true, status: "ACTIVE", deadline: new Date("2026-09-14"), defaultQuantity: 30 },
      { id: "activity_gym", challengeId: "challenge_move_q3", name: "Gym / Fitness", category: "MOVE", objective: "Complete a structured gym or fitness session.", requirement: "Minimum 45 minutes of gym or fitness training", unit: "MINUTES", points: 150, evidenceRequired: true, verificationRequired: true, status: "ACTIVE", deadline: new Date("2026-09-14"), defaultQuantity: 45 },
      { id: "activity_stairs", challengeId: "challenge_move_q3", name: "Stair Climbing", category: "MOVE", objective: "Use stairs during shift or personal time as an approved activity.", requirement: "Minimum 15 minutes of stair climbing", unit: "MINUTES", points: 80, evidenceRequired: true, verificationRequired: true, status: "ACTIVE", deadline: new Date("2026-09-14"), defaultQuantity: 15 },
      { id: "activity_other_move", challengeId: "challenge_move_q3", name: "Other Approved Activity", category: "MOVE", objective: "Complete another activity approved by your Team Leader.", requirement: "Minimum 20 minutes of an approved physical activity", unit: "MINUTES", points: 90, evidenceRequired: true, verificationRequired: true, status: "ACTIVE", deadline: new Date("2026-09-14"), defaultQuantity: 20 },
      { id: "activity_toolbox", challengeId: "challenge_progress_q3", name: "Toolbox Talk", category: "PROGRESS", objective: "Attend and complete a site toolbox or professional briefing.", requirement: "One completed toolbox talk", unit: "COUNT", points: 120, evidenceRequired: true, verificationRequired: true, status: "ACTIVE", deadline: new Date("2026-09-14"), defaultQuantity: 1 },
      { id: "activity_drill", challengeId: "challenge_progress_q3", name: "Emergency Drill", category: "PROGRESS", objective: "Participate in an emergency or site readiness drill.", requirement: "One completed drill", unit: "COUNT", points: 140, evidenceRequired: true, verificationRequired: true, status: "ACTIVE", deadline: new Date("2026-09-14"), defaultQuantity: 1 },
      { id: "activity_peer_recognition", challengeId: "challenge_recognition_q3", name: "Peer Recognition", category: "RECOGNITION", objective: "Recognise a colleague for exceptional service or professionalism.", requirement: "Submit one recognition with notes", unit: "COUNT", points: 80, evidenceRequired: false, verificationRequired: true, status: "ACTIVE", deadline: new Date("2026-09-14"), defaultQuantity: 1 },
    ],
  });

  const gym = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80";

  await prisma.submission.createMany({
    data: [
      { id: "sub_ahmed_walk_1", userId: "user_ahmed_khan", activityId: "activity_walking", challengeId: "challenge_move_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-09-01"), submittedAt: new Date("2026-09-01T18:20:00.000Z"), durationMinutes: 30, notes: "Morning walk around Dubai Hills before shift.", status: "APPROVED", expectedPoints: 100, awardedPoints: 100, verifierId: "user_ahmed_khan", verifiedAt: new Date("2026-09-01T19:00:00.000Z") },
      { id: "sub_ahmed_gym_1", userId: "user_ahmed_khan", activityId: "activity_gym", challengeId: "challenge_move_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-08-26"), submittedAt: new Date("2026-08-26T20:10:00.000Z"), durationMinutes: 45, notes: "Strength session after duty.", evidenceUri: gym, status: "APPROVED", expectedPoints: 150, awardedPoints: 150, verifierId: "user_khalid_rahman", verifiedAt: new Date("2026-08-27T08:00:00.000Z") },
      { id: "sub_ahmed_stairs_1", userId: "user_ahmed_khan", activityId: "activity_stairs", challengeId: "challenge_move_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-08-20"), submittedAt: new Date("2026-08-20T16:40:00.000Z"), durationMinutes: 20, notes: "Tower stair patrol.", status: "APPROVED", expectedPoints: 80, awardedPoints: 80, verifierId: "user_ahmed_khan", verifiedAt: new Date("2026-08-20T17:10:00.000Z") },
      { id: "sub_fatima_walk_1", userId: "user_fatima_hashimi", activityId: "activity_walking", challengeId: "challenge_move_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-09-01"), submittedAt: new Date("2026-09-01T19:00:00.000Z"), durationMinutes: 35, notes: "Community loop walk.", status: "PENDING", expectedPoints: 100, awardedPoints: 0 },
      { id: "sub_omar_gym_1", userId: "user_omar_suwaidi", activityId: "activity_gym", challengeId: "challenge_move_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-09-01"), submittedAt: new Date("2026-09-01T21:20:00.000Z"), durationMinutes: 50, notes: "Cardio and mobility.", evidenceUri: gym, status: "PENDING", expectedPoints: 150, awardedPoints: 0 },
      { id: "sub_sara_walk_1", userId: "user_sara_ibrahim", activityId: "activity_walking", challengeId: "challenge_move_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-08-30"), submittedAt: new Date("2026-08-30T18:00:00.000Z"), durationMinutes: 30, notes: "Evening walk.", status: "APPROVED", expectedPoints: 100, awardedPoints: 100, verifierId: "user_khalid_rahman", verifiedAt: new Date("2026-08-31T09:00:00.000Z") },
      { id: "sub_yousuf_rejected", userId: "user_yousuf_nasser", activityId: "activity_gym", challengeId: "challenge_move_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-08-28"), submittedAt: new Date("2026-08-28T22:00:00.000Z"), durationMinutes: 15, notes: "Short session.", status: "REJECTED", expectedPoints: 150, awardedPoints: 0, verifierId: "user_khalid_rahman", verifiedAt: new Date("2026-08-29T08:30:00.000Z"), rejectionReason: "Duration is below the 45-minute gym requirement. Please resubmit a complete session." },
      { id: "sub_layla_toolbox", userId: "user_layla_qasimi", activityId: "activity_toolbox", challengeId: "challenge_progress_q3", cycleId: "cycle_q3_2026", activityDate: new Date("2026-09-01"), submittedAt: new Date("2026-09-01T14:00:00.000Z"), quantity: 1, notes: "Completed morning toolbox talk.", status: "APPROVED", expectedPoints: 120, awardedPoints: 120, verifierId: "user_ahmed_khan", verifiedAt: new Date("2026-09-01T15:00:00.000Z") },
    ],
  });

  await prisma.pointsTransaction.createMany({
    data: [
      { id: "pts_ahmed_walk_1", userId: "user_ahmed_khan", category: "MOVE", amount: 100, reason: "Walking", submissionId: "sub_ahmed_walk_1", createdAt: new Date("2026-09-01T19:00:00.000Z") },
      { id: "pts_ahmed_gym_1", userId: "user_ahmed_khan", category: "MOVE", amount: 150, reason: "Gym / Fitness", submissionId: "sub_ahmed_gym_1", createdAt: new Date("2026-08-27T08:00:00.000Z") },
      { id: "pts_ahmed_stairs_1", userId: "user_ahmed_khan", category: "MOVE", amount: 80, reason: "Stair Climbing", submissionId: "sub_ahmed_stairs_1", createdAt: new Date("2026-08-20T17:10:00.000Z") },
      { id: "pts_ahmed_consistency", userId: "user_ahmed_khan", category: "CONSISTENCY", amount: 200, reason: "Consistency Bonus", createdAt: new Date("2026-08-31T09:00:00.000Z") },
      { id: "pts_ahmed_recognition", userId: "user_ahmed_khan", category: "RECOGNITION", amount: 80, reason: "Recognition", createdAt: new Date("2026-08-18T11:00:00.000Z") },
      { id: "pts_ahmed_progress", userId: "user_ahmed_khan", category: "PROGRESS", amount: 120, reason: "Toolbox Talk", createdAt: new Date("2026-08-12T10:00:00.000Z") },
      { id: "pts_ahmed_bonus", userId: "user_ahmed_khan", category: "BONUS", amount: 520, reason: "Prior cycle carry-forward adjustment", createdAt: new Date("2026-08-01T08:00:00.000Z") },
      { id: "pts_fatima_1", userId: "user_fatima_hashimi", category: "MOVE", amount: 980, reason: "Approved Move activities", createdAt: new Date("2026-08-30T10:00:00.000Z") },
      { id: "pts_omar_1", userId: "user_omar_suwaidi", category: "MOVE", amount: 860, reason: "Approved Move activities", createdAt: new Date("2026-08-29T10:00:00.000Z") },
      { id: "pts_sara_1", userId: "user_sara_ibrahim", category: "MOVE", amount: 1420, reason: "Approved activities", submissionId: "sub_sara_walk_1", createdAt: new Date("2026-08-31T09:00:00.000Z") },
      { id: "pts_khalid_1", userId: "user_khalid_rahman", category: "MOVE", amount: 1680, reason: "Approved activities", createdAt: new Date("2026-08-28T09:00:00.000Z") },
      { id: "pts_layla_1", userId: "user_layla_qasimi", category: "PROGRESS", amount: 1100, reason: "Approved activities", submissionId: "sub_layla_toolbox", createdAt: new Date("2026-09-01T15:00:00.000Z") },
      { id: "pts_yousuf_1", userId: "user_yousuf_nasser", category: "MOVE", amount: 740, reason: "Approved activities", createdAt: new Date("2026-08-25T09:00:00.000Z") },
      { id: "pts_mariam_1", userId: "user_mariam_zaabi", category: "MOVE", amount: 1510, reason: "Approved activities", createdAt: new Date("2026-08-27T09:00:00.000Z") },
    ],
  });

  await prisma.progressRecord.createMany({
    data: [
      { id: "prg_ahmed_move", userId: "user_ahmed_khan", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 68, activitiesCompleted: 4, activitiesRequired: 6, weeksParticipated: 2, weeksRequired: 3, consecutiveWeeks: 2, weekStatuses: ["COMPLETED", "COMPLETED", "IN_PROGRESS"] },
      { id: "prg_fatima_move", userId: "user_fatima_hashimi", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 50, activitiesCompleted: 3, activitiesRequired: 6, weeksParticipated: 2, weeksRequired: 3, consecutiveWeeks: 2, weekStatuses: ["COMPLETED", "COMPLETED", "NOT_STARTED"] },
      { id: "prg_omar_move", userId: "user_omar_suwaidi", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 33, activitiesCompleted: 2, activitiesRequired: 6, weeksParticipated: 1, weeksRequired: 3, consecutiveWeeks: 1, weekStatuses: ["COMPLETED", "IN_PROGRESS", "NOT_STARTED"] },
      { id: "prg_sara_move", userId: "user_sara_ibrahim", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 83, activitiesCompleted: 5, activitiesRequired: 6, weeksParticipated: 3, weeksRequired: 3, consecutiveWeeks: 3, weekStatuses: ["COMPLETED", "COMPLETED", "IN_PROGRESS"] },
      { id: "prg_khalid_move", userId: "user_khalid_rahman", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 90, activitiesCompleted: 6, activitiesRequired: 6, weeksParticipated: 3, weeksRequired: 3, consecutiveWeeks: 3, weekStatuses: ["COMPLETED", "COMPLETED", "COMPLETED"] },
      { id: "prg_layla_move", userId: "user_layla_qasimi", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 40, activitiesCompleted: 2, activitiesRequired: 6, weeksParticipated: 1, weeksRequired: 3, consecutiveWeeks: 1, weekStatuses: ["COMPLETED", "NOT_STARTED", "NOT_STARTED"] },
      { id: "prg_yousuf_move", userId: "user_yousuf_nasser", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 17, activitiesCompleted: 1, activitiesRequired: 6, weeksParticipated: 1, weeksRequired: 3, consecutiveWeeks: 0, weekStatuses: ["IN_PROGRESS", "NOT_STARTED", "NOT_STARTED"] },
      { id: "prg_mariam_move", userId: "user_mariam_zaabi", cycleId: "cycle_q3_2026", challengeId: "challenge_move_q3", percent: 75, activitiesCompleted: 4, activitiesRequired: 6, weeksParticipated: 2, weeksRequired: 3, consecutiveWeeks: 2, weekStatuses: ["COMPLETED", "COMPLETED", "IN_PROGRESS"] },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { id: "ntf_ahmed_approved", userId: "user_ahmed_khan", type: "SUBMISSION_APPROVED", title: "Points awarded", body: "+100 Guard Points awarded for Walking.", createdAt: new Date("2026-09-01T19:00:00.000Z"), relatedSubmissionId: "sub_ahmed_walk_1" },
      { id: "ntf_ahmed_challenge", userId: "user_ahmed_khan", type: "CHALLENGE_STARTED", title: "Move Challenge is active", body: "Stay Active is now open. 12 days remaining.", readAt: new Date("2026-09-01T09:00:00.000Z"), createdAt: new Date("2026-09-01T08:00:00.000Z") },
      { id: "ntf_ahmed_team", userId: "user_ahmed_khan", type: "SYSTEM", title: "Pending team verification", body: "2 Gold Guards submissions are waiting for your review.", createdAt: new Date("2026-09-01T21:30:00.000Z") },
      { id: "ntf_fatima_pending", userId: "user_fatima_hashimi", type: "SUBMISSION_SUBMITTED", title: "Submitted for review", body: "Your Walking activity is pending Team Leader verification.", createdAt: new Date("2026-09-01T19:00:00.000Z"), relatedSubmissionId: "sub_fatima_walk_1" },
      { id: "ntf_yousuf_rejected", userId: "user_yousuf_nasser", type: "SUBMISSION_REJECTED", title: "Submission rejected", body: "Gym / Fitness was rejected. Duration is below the requirement.", createdAt: new Date("2026-08-29T08:30:00.000Z"), relatedSubmissionId: "sub_yousuf_rejected" },
      { id: "ntf_broadcast", userId: null, type: "SYSTEM", title: "Submission reminders", body: "Team Leaders, please verify pending submissions before end of day.", createdAt: new Date("2026-08-30T08:00:00.000Z") },
    ],
  });

  await prisma.notificationPreference.create({
    data: { userId: "user_ahmed_khan", submissions: true, approvals: true, challenges: true, points: true },
  });

  console.log("Seeded Albatha database.");
  console.log("Field users password: password");
  console.log("CRM admins (ABRE-00900 / 00800 / 00999) password: Abre@123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
