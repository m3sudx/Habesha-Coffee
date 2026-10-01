import pool from "../config/db.js";

export const categories = async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id::int AS id, name, slug FROM categories ORDER BY name"
  );
  res.status(200).json({ success: true, data: rows });
};