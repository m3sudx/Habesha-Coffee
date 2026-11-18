import type { RequestHandler } from "express";
import { pool } from "../config/db.js";
import { AppError } from "../utils/error.js";
import { verifyToken } from "../utils/jwt.js";

type AuthUser = NonNullable<Express.Request["user"]>;

// Returns the token from "Authorization: Bearer <token>", or null if there isn't one.
function extractBearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

// Verifies the token and loads the user from the database, so a deleted user or a
// changed role takes effect immediately. Always throws the same 401 on any failure.
async function userFromToken(token: string): Promise<AuthUser> {
  let userId: string;
  try {
    userId = verifyToken(token).sub;
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const { rows } = await pool.query<AuthUser>(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [userId],
  );

  const user = rows[0];
  if (!user) {
    throw new AppError("Invalid or expired token", 401);
  }
  return user;
}

// The request must be logged in.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  req.user = await userFromToken(token);
  next();
};

// Guests are allowed (req.user stays undefined). A token that is sent but invalid
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (token) {
    req.user = await userFromToken(token);
  }
  next();
};