import { z } from "zod";

export const statsQuerySchema = z.object({
  // How many days back the sales numbers cover (including today).
  days: z.coerce.number().int().min(1).max(365).default(30),
  // Variants with this much stock or less are listed as "low stock".
  lowStock: z.coerce.number().int().min(0).max(1000).default(10),
});
export type StatsQuery = z.infer<typeof statsQuerySchema>;