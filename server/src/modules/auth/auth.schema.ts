import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, "Email is too long")
  .email("Invalid email address");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name is too long"),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password must be at most 72 characters long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  // No length rule on login: only require that something was sent.
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;