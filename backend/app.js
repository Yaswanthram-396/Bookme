import express from "express";
import root from "./routes/routes.js";
import morgan from "morgan";
import cors from "cors";

const app = express();

app.use(morgan("dev"));

app.use(cors("*"));

app.use(express.json());
app.use("/api", root);

export default app;
