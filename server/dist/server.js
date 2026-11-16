import "dotenv/config";
import express from "express";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";
const app = express();
const apiRouter = express.Router();
const notFound = (_req, _res, next) => {
    next();
};
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, message: "Working..." });
});
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
const port = Number(process.env.PORT) || 5005;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
