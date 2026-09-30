import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/tokens.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // role is NOT in this query: the database default ('customer') applies
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id::int AS id, name, email, role`,
      [name, email, passwordHash]
    );
    const user = rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    // 23505 = unique violation (our unique index on lower(email))
    if (err.code === '23505') {
      throw new ApiError(409, 'An account with this email already exists');
    }
    throw err;
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await pool.query(
    `SELECT id::int AS id, name, email, role, password_hash
     FROM users WHERE lower(email) = $1`,
    [email]
  );
  const row = rows[0];

  // Same error for "no such email" and "wrong password"
  const ok = row && (await bcrypt.compare(password, row.password_hash));
  if (!ok) throw new ApiError(401, 'Invalid email or password');

  const { password_hash, ...user } = row; // remove the hash before sending
  res.json({ user, token: signToken(user) });
};

// requireAuth already loaded the user into req.user
export const me = (req, res) => {
  res.json({ user: req.user });
};