import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import pinoHttp, { type Options as PinoHttpOptions } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// require() is intentional — helmet@8 ships CJS-only types that are
// incompatible with moduleResolution:bundler used by this workspace.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helmetFn = require("helmet").default as (opts?: object) => (req: Request, res: Response, next: NextFunction) => void;
// Same issue with pino-http — unwrap the default export at runtime
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pinoHttpFn = (require("pino-http").default ?? require("pino-http")) as (opts?: PinoHttpOptions) => (req: Request, res: Response, next: NextFunction) => void;

const app: Express = express();

// ── Security headers (A05) ────────────────────────────────────────────────────
app.use(helmetFn({
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
app.use(pinoHttpFn(pinoHttpOptions));
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
