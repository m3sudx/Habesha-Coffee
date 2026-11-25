import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { statsQuerySchema } from "./admin-stats.schema.js";
import { salesOverviewHandler } from "./admin-stats.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/overview", validate(statsQuerySchema, "query"), salesOverviewHandler);

export default router;