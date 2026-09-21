import { Router, type IRouter } from "express";
import { GetSessionResponse } from "@workspace/api-zod";
import { addActivity, demoUser } from "../lib/vault-store";

const router: IRouter = Router();

router.get("/auth/session", (_req, res) => {
  res.cookie("haven_session", "demo-persistent-session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
  });
  const data = GetSessionResponse.parse({ authenticated: true, user: demoUser });
  res.json(data);
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("haven_session", { path: "/" });
  addActivity("login", "Signed out of this browser");
  res.status(204).end();
});

export default router;