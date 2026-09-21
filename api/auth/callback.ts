import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { getOrCreateVaultFolder } from "../lib/drive";
import { signSession, cookieHeader } from "../lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
  const { data: profile } = await oauth2Api.userinfo.get();

  const folderId = await getOrCreateVaultFolder(tokens.access_token!);

  const token = await signSession({
    sub: profile.id!,
    name: profile.name ?? "",
    email: profile.email ?? "",
    picture: profile.picture ?? "",
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? "",
    folderId,
  });

  res.setHeader("Set-Cookie", cookieHeader(token));
  res.redirect(302, "/dashboard");
}
