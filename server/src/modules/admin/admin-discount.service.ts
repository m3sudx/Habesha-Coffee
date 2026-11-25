import { pool } from "../../config/db.js";
import { AppError } from "../../utils/error.js";
import type {
  AdminDiscountListQuery,
  CreateDiscountInput,
  UpdateDiscountInput,
} from "./admin-discount.schema.js";

// ---------- helpers ----------

// The caught value in a catch block is `unknown`, so check its shape safely.
function pgCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null ? (err as { code?: string }).code : undefined;
}

// Escape LIKE wildcards so a search for "100%" doesn't match everything.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Request field name -> database column. Column names only ever come from this map
// (never from user input), so building the SET clause is safe.
const DISCOUNT_COLUMNS: Record<string, string> = {
  type: "type",
  value: "value",
  expiresAt: "expires_at",
  usageLimit: "usage_limit",
  isActive: "is_active",
};

// Builds "col = $1, col2 = $2" only for the fields that were sent (null is a real value:
// it clears the expiry or the limit).
function buildSet(input: Record<string, unknown>) {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(input)) {
    const column = DISCOUNT_COLUMNS[key];
    if (value === undefined || !column) continue;
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }
  return { sets, values };
}

function throwDiscountWriteError(err: unknown): never {
  const code = pgCode(err);
  if (code === "23505") throw new AppError("A discount code with this name already exists", 409);
  // The database CHECK (a percent discount can't be above 100), for example when only
  // the value of an existing percent code is changed.
  if (code === "23514") throw new AppError("A percent discount must be between 1 and 100", 400);
  throw err;
}

// The same rules the shop uses in findValidDiscount, so the admin sees what customers experience.
const STATUS_SQL = `(CASE
  WHEN NOT d.is_active THEN 'inactive'
  WHEN d.expires_at IS NOT NULL AND d.expires_at <= now() THEN 'expired'
  WHEN d.usage_limit IS NOT NULL AND d.times_used >= d.usage_limit THEN 'used_up'
  ELSE 'active'
END)`;

const DISCOUNT_SELECT = `d.id, d.code, d.type, d.value, d.expires_at, d.usage_limit,
  d.times_used, d.is_active, ${STATUS_SQL} AS status, d.created_at, d.updated_at`;

type DiscountRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expires_at: Date | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
  status: "active" | "inactive" | "expired" | "used_up";
  created_at: Date;
  updated_at: Date;
};

function toDiscount(r: DiscountRow) {
  return {
    id: r.id,
    code: r.code,
    type: r.type,
    value: r.value, // percent: 1 to 100. fixed: cents.
    expiresAt: r.expires_at,
    usageLimit: r.usage_limit,
    timesUsed: r.times_used,
    isActive: r.is_active,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ---------- reads ----------

export async function listDiscounts({ page, limit, q, status }: AdminDiscountListQuery) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Pushes a value and returns its placeholder ($1, $2, ...), so conditions
  // and parameters are always built together and stay in sync.
  const add = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  if (q) {
    conditions.push(`d.code ILIKE ${add(`%${escapeLike(q)}%`)}`);
  }
  if (status) {
    conditions.push(`${STATUS_SQL} = ${add(status)}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countParams = [...params]; // before LIMIT/OFFSET are added

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM discount_codes d ${whereSql}`,
      countParams,
    ),
    pool.query<DiscountRow>(
      `SELECT ${DISCOUNT_SELECT}
       FROM discount_codes d
       ${whereSql}
       ORDER BY d.created_at DESC, d.id
       LIMIT ${add(limit)} OFFSET ${add((page - 1) * limit)}`,
      params,
    ),
  ]);

  const total = countResult.rows[0]!.total;

  return {
    items: dataResult.rows.map(toDiscount),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDiscount(discountId: string) {
  const { rows } = await pool.query<DiscountRow>(
    `SELECT ${DISCOUNT_SELECT} FROM discount_codes d WHERE d.id = $1`,
    [discountId],
  );

  const row = rows[0];
  if (!row) {
    throw new AppError("Discount code not found", 404);
  }
  return toDiscount(row);
}

// ---------- writes ----------

export async function createDiscount(input: CreateDiscountInput) {
  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO discount_codes (code, type, value, expires_at, usage_limit, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        input.code,
        input.type,
        input.value,
        input.expiresAt ?? null,
        input.usageLimit ?? null,
        input.isActive,
      ],
    );
    return getDiscount(rows[0]!.id);
  } catch (err) {
    return throwDiscountWriteError(err);
  }
}

export async function updateDiscount(discountId: string, input: UpdateDiscountInput) {
  const { sets, values } = buildSet(input);

  try {
    const result = await pool.query(
      `UPDATE discount_codes SET ${sets.join(", ")} WHERE id = $${values.length + 1} RETURNING id`,
      [...values, discountId],
    );
    if (result.rowCount === 0) {
      throw new AppError("Discount code not found", 404);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    return throwDiscountWriteError(err);
  }

  return getDiscount(discountId);
}