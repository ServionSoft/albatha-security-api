import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers.js";

describe("SFT-API-01 health", () => {
  it("returns ok envelope", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ok).toBe(true);
  });
});
