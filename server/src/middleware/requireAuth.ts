import type { RequestHandler } from "express";
import { pool } from "../config/db.js";
import { AppError } from "../utils/error.js";
import { verifyToken } from "../utils/jwt.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }
  const token = header.slice("Bearer ".length).trim();
  let userId: string;
  try {
    userId = verifyToken(token).sub;
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const { rows } = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [userId],
  );

  const user = rows[0];
  if (!user) {
    throw new AppError("Invalid or expired token", 401);
  }

  req.user = user;
  next();
};