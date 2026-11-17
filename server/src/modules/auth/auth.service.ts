import bcrypt from "bcrypt";
import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";
import { signToken } from "../../utils/jwt.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const SALT_ROUNDS = 12;

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

type Role = "customer" | "admin";

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: Date;
};

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

export async function registerUser(
  input: RegisterInput,
): Promise<{ user: PublicUser; token: string }> {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const { rows } = await pool.query<PublicUser>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [input.name, input.email, passwordHash],
    );

    const user = rows[0]!;
    return { user, token: signToken(user) };
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError("Email already registered", 409);
    }
    throw err;
  }
}

export async function loginUser(
  input: LoginInput,
): Promise<{ user: PublicUser; token: string }> {
  const { rows } = await pool.query<PublicUser & { password_hash: string }>(
    `SELECT id, name, email, role, created_at, password_hash
     FROM users
     WHERE email = $1`,
    [input.email],
  );

  const found = rows[0];

  // Always run one bcrypt comparison, even when the user doesn't exist.
  const passwordMatches = await bcrypt.compare(
    input.password,
    found?.password_hash ?? DUMMY_HASH,
  );

  if (!found || !passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  // Never send password_hash back to the client.
  const { password_hash: _omit, ...user } = found;

  return { user, token: signToken(user) };
}