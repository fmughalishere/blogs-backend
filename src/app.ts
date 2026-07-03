import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app: Application = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://blogs-frontend-admin.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
