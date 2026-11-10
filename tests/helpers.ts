import request from "supertest";
import { createApp } from "../src/app.js";

export const app = createApp();

export const FIELD_USER = {
  employeeId: "ABRE-00126",
  password: "password",
};

export const TEAM_LEADER = {
  employeeId: "ABRE-00125",
  password: "password",
};

export const HR_ADMIN = {
  employeeId: "ABRE-00900",
  password: "Abre@123",
};

export type LoginResult = {
  token: string;
  userId: string;
  user: Record<string, unknown>;
};

export async function loginAs(creds: { employeeId: string; password: string }): Promise<LoginResult> {
  const res = await request(app).post("/auth/login").send(creds);
  if (res.status !== 200 || !res.body?.success) {
    throw new Error(`Login failed for ${creds.employeeId}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const token = res.body.data.session.token as string;
  const userId = res.body.data.session.userId as string;
  return { token, userId, user: res.body.data.user };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
