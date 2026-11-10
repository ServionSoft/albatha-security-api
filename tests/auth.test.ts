import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, auth, FIELD_USER, HR_ADMIN, TEAM_LEADER, loginAs } from "./helpers.js";

describe("SFT-API auth", () => {
  it("SFT-API-02 field login succeeds", async () => {
    const res = await request(app).post("/auth/login").send(TEAM_LEADER);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.token).toBeTruthy();
    expect(res.body.data.user.employeeId).toBe(TEAM_LEADER.employeeId);
    expect(res.body.data.user.roles).toEqual(expect.arrayContaining(["GUARD"]));
  });

  it("SFT-API-03 rejects bad password", async () => {
    const res = await request(app).post("/auth/login").send({
      employeeId: TEAM_LEADER.employeeId,
      password: "wrong-password",
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toBeTruthy();
  });

  it("SFT-API-04 /auth/me with token", async () => {
    const { token, userId } = await loginAs(FIELD_USER);
    const res = await request(app).get("/auth/me").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(userId);
    expect(res.body.data.employeeId).toBe(FIELD_USER.employeeId);
  });

  it("SFT-API-05 /auth/me without token is 401", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("SFT-API-11 HR admin login", async () => {
    const res = await request(app).post("/auth/login").send(HR_ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data.user.roles).toEqual(expect.arrayContaining(["HR_ADMIN"]));
  });

  it("SFT-API-12 change password then restore", async () => {
    const tempPassword = "TempPass12";
    const { token } = await loginAs(FIELD_USER);

    const change = await request(app)
      .post("/auth/change-password")
      .set(auth(token))
      .send({ currentPassword: FIELD_USER.password, newPassword: tempPassword });
    expect(change.status).toBe(200);
    expect(change.body.success).toBe(true);

    const withTemp = await loginAs({ employeeId: FIELD_USER.employeeId, password: tempPassword });
    expect(withTemp.user.mustChangePassword).toBe(false);

    const restore = await request(app)
      .post("/auth/change-password")
      .set(auth(withTemp.token))
      .send({ currentPassword: tempPassword, newPassword: FIELD_USER.password });
    expect(restore.status).toBe(200);

    await loginAs(FIELD_USER);
  });
});
