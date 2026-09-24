import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp, { type Options as PinoHttpOptions } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

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
