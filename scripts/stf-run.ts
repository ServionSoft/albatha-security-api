/**
 * STF automated runner — hits the live local API.
 * Usage: npm run test:stf  (API must be running on PORT or 4000)
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const BASE = `http://localhost:${process.env.PORT || 4000}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = resolve(__dirname, "../../docs/STF-RESULTS.md");

type Result = {
  id: string;
  title: string;
  pass: boolean;
  detail: string;
};

const results: Result[] = [];

async function request(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {},
) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as any;
  return { status: res.status, json };
}

function record(id: string, title: string, pass: boolean, detail: string) {
  results.push({ id, title, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${id}  ${title}${pass ? "" : ` — ${detail}`}`);
}

function assert(id: string, title: string, condition: boolean, detail: string) {
  record(id, title, condition, detail);
  return condition;
}

async function main() {
  console.log(`STF runner → ${BASE}\n`);

  // STF-01
  {
    const { status, json } = await request("GET", "/health");
    assert(
      "STF-01",
      "API health responds OK",
      status === 200 && json?.success === true && json?.data?.ok === true,
      `status=${status} body=${JSON.stringify(json)}`,
    );
  }

  // STF-02
  let guardToken = "";
  let guardUserId = "";
  {
    const { status, json } = await request("POST", "/auth/login", {
      body: { employeeId: "ABRE-00125", password: "password" },
    });
    const ok =
      status === 200 &&
      json?.success === true &&
      !!json?.data?.session?.token &&
      !!json?.data?.user?.id;
    if (ok) {
      guardToken = json.data.session.token;
      guardUserId = json.data.user.id;
    }
    assert("STF-02", "Guard login with valid credentials", ok, `status=${status} message=${json?.error?.message ?? json?.message}`);
  }

  // STF-03
  {
    const { status, json } = await request("POST", "/auth/login", {
      body: { employeeId: "ABRE-00125", password: "wrong-password" },
    });
    assert(
      "STF-03",
      "Login rejects wrong password",
      status === 401 &&
        json?.success === false &&
        json?.error?.code === "INVALID_CREDENTIALS" &&
        typeof json?.error?.message === "string" &&
        json.error.message.length > 0,
      `status=${status} error=${JSON.stringify(json?.error)}`,
    );
  }

  // STF-04
  {
    const { status, json } = await request("POST", "/auth/login", {
      body: { employeeId: "ABRE-NOPE", password: "password" },
    });
    assert(
      "STF-04",
      "Login rejects unknown employee with clear error",
      status === 401 &&
        json?.success === false &&
        !!json?.error?.code &&
        !!json?.error?.message,
      `status=${status} error=${JSON.stringify(json?.error)}`,
    );
  }

  // STF-05
  {
    const { status, json } = await request("GET", "/auth/me", { token: guardToken });
    assert(
      "STF-05",
      "/auth/me returns current user",
      status === 200 && json?.success === true && json?.data?.id === guardUserId,
      `status=${status} id=${json?.data?.id}`,
    );
  }

  // STF-06
  {
    const { status, json } = await request("GET", "/auth/me");
    assert(
      "STF-06",
      "Unauthorized without token",
      status === 401 && json?.success === false && !!json?.error?.message,
      `status=${status} error=${JSON.stringify(json?.error)}`,
    );
  }

  // STF-07
  {
    const { status, json } = await request("POST", "/auth/change-password", {
      token: guardToken,
      body: { currentPassword: "not-the-password", newPassword: "NewPass123" },
    });
    assert(
      "STF-07",
      "Change password rejects wrong current password",
      status === 422 &&
        json?.success === false &&
        json?.error?.code === "VALIDATION_ERROR" &&
        /current password/i.test(json?.error?.message ?? ""),
      `status=${status} error=${JSON.stringify(json?.error)}`,
    );
  }

  // STF-08
  let cycleId = "";
  {
    const { status, json } = await request("GET", "/cycles/current", { token: guardToken });
    const ok = status === 200 && json?.success === true && !!json?.data?.id;
    if (ok) cycleId = json.data.id;
    assert("STF-08", "Current cycle is available", ok, `status=${status} data=${JSON.stringify(json?.data ?? json?.error)}`);
  }

  // STF-09
  let challenges: any[] = [];
  {
    const { status, json } = await request("GET", "/challenges", { token: guardToken });
    challenges = Array.isArray(json?.data) ? json.data : [];
    const cats = new Set(challenges.map((c) => c.category));
    assert(
      "STF-09",
      "Challenges include Move / Progress / Recognition",
      status === 200 &&
        cats.has("MOVE") &&
        cats.has("PROGRESS") &&
        cats.has("RECOGNITION"),
      `status=${status} categories=${[...cats].join(",")}`,
    );
  }

  // STF-10
  let activities: any[] = [];
  {
    const { status, json } = await request("GET", "/activities", { token: guardToken });
    activities = Array.isArray(json?.data) ? json.data : [];
    assert(
      "STF-10",
      "Activities list is non-empty",
      status === 200 && activities.length > 0,
      `status=${status} count=${activities.length}`,
    );
  }

  // STF-11
  {
    const swimming = activities.find((a) => /swim/i.test(a.name ?? ""));
    const moveMinutes = activities.find((a) => a.category === "MOVE" && a.unit === "MINUTES");
    const target = swimming ?? moveMinutes;
    assert(
      "STF-11",
      "MOVE duration activity uses unit MINUTES",
      !!target && target.unit === "MINUTES",
      swimming
        ? `swimming unit=${swimming.unit}`
        : moveMinutes
          ? `moveMinutes id=${moveMinutes.id}`
          : "no swimming or MOVE/MINUTES activity found",
    );
  }

  // STF-12
  let submissions: any[] = [];
  {
    const { status, json } = await request("GET", `/submissions?userId=${encodeURIComponent(guardUserId)}`, {
      token: guardToken,
    });
    submissions = Array.isArray(json?.data) ? json.data : Array.isArray(json?.data?.items) ? json.data.items : [];
    assert(
      "STF-12",
      "Guard can list own submissions",
      status === 200 && json?.success === true,
      `status=${status} count=${submissions.length}`,
    );
  }

  // STF-13 — try to resubmit a locked activity if one exists; otherwise create then retry
  {
    const locked = submissions.find((s) => s.status === "PENDING" || s.status === "APPROVED");
    let activityId = locked?.activityId as string | undefined;
    if (!activityId) {
      const candidate = activities.find((a) => a.status === "ACTIVE" && a.category === "MOVE");
      activityId = candidate?.id;
      if (activityId) {
        await request("POST", "/submissions", {
          token: guardToken,
          body: {
            activityId,
            activityDate: new Date().toISOString().slice(0, 10),
            notes: "STF bootstrap submit",
            evidenceUri: candidate?.evidenceRequired ? "stf://evidence.jpg" : null,
            durationMinutes: candidate?.unit === "MINUTES" ? 30 : null,
          },
        });
      }
    }

    if (!activityId) {
      record("STF-13", "Duplicate PENDING/APPROVED activity is blocked", false, "No activity available to test");
    } else {
      const activity = activities.find((a) => a.id === activityId);
      const { status, json } = await request("POST", "/submissions", {
        token: guardToken,
        body: {
          activityId,
          activityDate: new Date().toISOString().slice(0, 10),
          notes: "STF duplicate attempt",
          evidenceUri: activity?.evidenceRequired ? "stf://evidence.jpg" : null,
          durationMinutes: activity?.unit === "MINUTES" ? 30 : null,
        },
      });
      assert(
        "STF-13",
        "Duplicate PENDING/APPROVED activity is blocked with clear message",
        status === 409 &&
          json?.success === false &&
          (json?.error?.code === "ACTIVITY_ALREADY_SUBMITTED" ||
            json?.error?.code === "ACTIVITY_ALREADY_APPROVED") &&
          typeof json?.error?.message === "string" &&
          json.error.message.length > 10,
        `status=${status} error=${JSON.stringify(json?.error)}`,
      );
    }
  }

  // STF-14
  {
    const { status, json } = await request("GET", "/points/me", { token: guardToken });
    const total =
      typeof json?.data === "number"
        ? json.data
        : typeof json?.data?.total === "number"
          ? json.data.total
          : null;
    // Accept either shape used by API
    const alt = await request("GET", `/points?userId=${encodeURIComponent(guardUserId)}`, { token: guardToken });
    const altTotal =
      typeof alt.json?.data === "number"
        ? alt.json.data
        : typeof alt.json?.data?.total === "number"
          ? alt.json.data.total
          : Array.isArray(alt.json?.data)
            ? alt.json.data.reduce((s: number, t: any) => s + (t.amount ?? 0), 0)
            : null;
    const ok =
      (status === 200 && total !== null) || (alt.status === 200 && altTotal !== null && Number.isFinite(altTotal));
    assert("STF-14", "Points endpoint returns numeric total", ok, `me=${status}/${total} alt=${alt.status}/${altTotal}`);
  }

  // STF-15
  {
    const { status, json } = await request("POST", "/auth/login", {
      body: { employeeId: "ABRE-00900", password: "Abre@123" },
    });
    assert(
      "STF-15",
      "HR Admin login works",
      status === 200 && json?.success === true && !!json?.data?.session?.token,
      `status=${status} message=${json?.error?.message ?? json?.message}`,
    );
  }

  // STF-16
  {
    const { status, json } = await request("POST", "/auth/login", {
      body: { employeeId: "ABRE-00800", password: "Abre@123" },
    });
    assert(
      "STF-16",
      "Management login works",
      status === 200 && json?.success === true && !!json?.data?.session?.token,
      `status=${status} message=${json?.error?.message ?? json?.message}`,
    );
  }

  // STF-17 — already proven by STF-03/06/07; assert envelope shape explicitly
  {
    const { status, json } = await request("POST", "/auth/login", {
      body: { employeeId: "ABRE-00125", password: "bad" },
    });
    assert(
      "STF-17",
      "Failed requests use success:false + error{code,message}",
      status >= 400 &&
        json?.success === false &&
        typeof json?.error?.code === "string" &&
        typeof json?.error?.message === "string",
      `status=${status} body=${JSON.stringify(json)}`,
    );
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const stamp = new Date().toISOString();

  const md = [
    `# STF Results`,
    ``,
    `- **Ran at:** ${stamp}`,
    `- **Base URL:** ${BASE}`,
    `- **Summary:** ${passed}/${results.length} passed` + (failed ? ` (${failed} failed)` : ``),
    ``,
    `| ID | Result | Title | Detail |`,
    `|----|--------|-------|--------|`,
    ...results.map(
      (r) =>
        `| ${r.id} | ${r.pass ? "PASS" : "**FAIL**"} | ${r.title} | ${r.detail.replace(/\|/g, "\\|")} |`,
    ),
    ``,
    failed === 0
      ? `All automated STF cases passed.`
      : `Review failed cases above. Manual UI cases remain in \`docs/STF.md\`.`,
    ``,
  ].join("\n");

  writeFileSync(RESULTS_PATH, md, "utf8");
  console.log(`\n${passed}/${results.length} passed`);
  console.log(`Wrote ${RESULTS_PATH}`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
