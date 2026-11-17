import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(5005),
  })
  .parse(process.env);