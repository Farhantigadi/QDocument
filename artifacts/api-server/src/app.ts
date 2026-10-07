import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import type { Options as PinoHttpOptions } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// require() sidesteps the ESM/CJS default-export mismatch that tsc hits
// with moduleResolution:bundler for these two CJS packages
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helmet = require("helmet") as (opts?: object) => express.RequestHandler;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pinoHttp = require("pino-http") as (opts?: PinoHttpOptions) => express.RequestHandler;

const app: Express = express();

// ── Security headers (A05) ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow Google Drive iframes
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["https://drive.google.com", "https://docs.google.com"],
      connectSrc: ["'self'"],
    },
  },
}));

// ── Global rate limit — 300 req / 15 min per IP (A04) ────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
}));

const pinoHttpOptions: PinoHttpOptions = {
  logger,
  serializers: {
    req(req: { id: string; method: string; url: string }) {
      return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
    },
    res(res: { statusCode: number }) {
      return { statusCode: res.statusCode };
    },
  },
};
app.use(pinoHttp(pinoHttpOptions));
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
