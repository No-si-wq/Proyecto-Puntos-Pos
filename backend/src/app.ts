import express from "express";
import routes from "./routes";
import { logger } from "./config/logger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { ENV } from "./config/env";
import cors from "cors";

export const app = express();

app.use(
  cors({
    origin:
      ENV.NODE_ENV === "development"
        ? "http://localhost:5173"
        : undefined,
    credentials: true,
  })
);

app.use(express.json());

if (ENV.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url }, "Incoming request");
    next();
  });
}

app.use("/api", routes);

app.use(errorMiddleware);