import app from "./app.js";
import { env } from "node:process";

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});