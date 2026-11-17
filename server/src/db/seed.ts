import fs from "fs";
import path from "path";
import { pool } from "../config/db.js"; 

async function runSeed() {
  try {
    const sqlFilePath = path.join(process.cwd(), "src", "db", "seed.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");
    
    console.log("Running seed file...");
    
    await pool.query(sql);
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

runSeed();