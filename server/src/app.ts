import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import {errorHandler} from "./middleware/errorHandler.js";
import apiRouter from "./router/index.js";
import notFound from "./middleware/notFound.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Working..." });
});

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);



export default app;