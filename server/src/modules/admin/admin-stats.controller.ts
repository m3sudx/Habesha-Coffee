import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate.js";
import type { StatsQuery } from "./admin-stats.schema.js";
import { getSalesOverview } from "./admin-stats.service.js";

export const salesOverviewHandler: RequestHandler = async (_req, res) => {
  const query = getValidated<StatsQuery>(res, "query");
  const data = await getSalesOverview(query);

  res.status(200).json({ success: true, data });
};