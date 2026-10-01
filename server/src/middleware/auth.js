import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/tokens.js';

export async function requireAuth(req, res, next) {
  // 1. Read the header:  Authorization: Bearer <token>
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Login required');
  }

  // 2. Check the signature and the expiry date
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  // 3. Load the user from the database
  const { rows } = await pool.query(
    'SELECT id::int AS id, name, email, role FROM users WHERE id = $1',
    [payload.id]
  );
  if (!rows[0]) throw new ApiError(401, 'User no longer exists');

  // 4. Attach the user to the request and continue
  req.user = rows[0];
  next();
}

export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return requireAuth(req, res, next);
}