import app from "./app.js";
import { env } from "node:process";
import { connectDb } from "./config/db.js";

connectDb()
app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});