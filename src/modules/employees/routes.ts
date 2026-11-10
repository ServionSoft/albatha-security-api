import { Router } from "express";
import { z } from "zod";
import { ok } from "../../lib/response.js";
import { idParam } from "../../lib/params.js";
import { parsePage } from "../../lib/pagination.js";
import { requireAuth, requireWrite } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { EmployeeService } from "./service.js";

export const employeeRouter = Router();
employeeRouter.use(requireAuth);

const rolesSchema = z.enum(["GUARD", "TEAM_LEADER", "HR_ADMIN", "MANAGEMENT", "SUPER_USER"]);

const createSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  roles: z.array(rolesSchema).optional(),
  role: rolesSchema.optional(),
  teamId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

function splitName(body: { firstName?: string; lastName?: string; name?: string }) {
  if (body.firstName) {
    return { firstName: body.firstName, lastName: body.lastName ?? "" };
  }
  const parts = (body.name ?? "").trim().split(/\s+/);
  return { firstName: parts[0] ?? "Guard", lastName: parts.slice(1).join(" ") };
}

employeeRouter.get("/", async (req, res, next) => {
  try {
    const { page, pageSize, skip } = parsePage(req);
    const data = await EmployeeService.list({
      query: typeof req.query.query === "string" ? req.query.query : typeof req.query.q === "string" ? req.query.q : undefined,
      role: typeof req.query.role === "string" ? req.query.role : undefined,
      teamId: typeof req.query.teamId === "string" ? req.query.teamId : undefined,
      locationId: typeof req.query.locationId === "string" ? req.query.locationId : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
      fieldOnly: req.query.fieldOnly === "true",
      page,
      pageSize,
      skip,
    });
    return ok(res, data);
  } catch (err) {
    next(err);
  }
});

employeeRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await EmployeeService.getById(idParam(req)));
  } catch (err) {
    next(err);
  }
});

employeeRouter.post("/", requireWrite, validateBody(createSchema), async (req, res, next) => {
  try {
    const names = splitName(req.body);
    const roles = req.body.roles ?? (req.body.role ? [req.body.role] : ["GUARD"]);
    const result = await EmployeeService.create({
      employeeId: req.body.employeeId,
      firstName: names.firstName,
      lastName: names.lastName,
      phone: req.body.phone,
      email: req.body.email || undefined,
      roles,
      teamId: req.body.teamId,
      locationId: req.body.locationId,
    });
    return ok(res, { ...result.user, temporaryPassword: result.temporaryPassword }, "Employee created", 201);
  } catch (err) {
    next(err);
  }
});

employeeRouter.patch("/:id", requireWrite, validateBody(updateSchema), async (req, res, next) => {
  try {
    const names = req.body.firstName || req.body.name ? splitName(req.body) : {};
    return ok(
      res,
      await EmployeeService.update(idParam(req), {
        ...names,
        phone: req.body.phone,
        email: req.body.email,
        teamId: req.body.teamId,
        locationId: req.body.locationId,
        roles: req.body.roles ?? (req.body.role ? [req.body.role] : undefined),
        status: req.body.status,
      }),
      "Employee updated",
    );
  } catch (err) {
    next(err);
  }
});

employeeRouter.post("/:id/deactivate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await EmployeeService.setStatus(idParam(req), "INACTIVE"), "Employee deactivated");
  } catch (err) {
    next(err);
  }
});

employeeRouter.post("/:id/reactivate", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await EmployeeService.setStatus(idParam(req), "ACTIVE"), "Employee reactivated");
  } catch (err) {
    next(err);
  }
});

employeeRouter.post("/:id/reset-password", requireWrite, async (req, res, next) => {
  try {
    return ok(res, await EmployeeService.resetPassword(idParam(req)), "Password reset");
  } catch (err) {
    next(err);
  }
});
