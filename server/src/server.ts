import app from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";

async function start() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});