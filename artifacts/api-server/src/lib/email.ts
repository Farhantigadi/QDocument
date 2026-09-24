import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `Haven <${process.env.SMTP_USER}>`;
const isDev = process.env.NODE_ENV !== "production";

function otpEmailHtml(heading: string, body: string, code: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <tr><td style="background:#18181b;padding:28px 40px">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px">🔐 Haven</p>
        </td></tr>
        <tr><td style="padding:36px 40px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b">${heading}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#71717a;line-height:1.6">${body}</p>
          <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#71717a;letter-spacing:.08em;text-transform:uppercase">Your code</p>
            <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:.25em;color:#18181b;font-family:monospace">${code}</p>
          </div>
          <p style="margin:0;font-size:13px;color:#a1a1aa">This code expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #f4f4f5">
          <p style="margin:0;font-size:12px;color:#a1a1aa">Haven · Your personal document vault</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (isDev && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    console.log(`\n[DEV] ✉️  Would send to ${to}\nSubject: ${subject}\n`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  await sendEmail(
    email,
    `${code} is your Haven verification code`,
    otpEmailHtml(
      "Verify your email",
      "Enter this code to complete your Haven account setup. It expires in 15 minutes.",
      code,
    ),
  );
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  await sendEmail(
    email,
    `${code} is your Haven password reset code`,
    otpEmailHtml(
      "Reset your password",
      "Enter this code to reset your Haven password. It expires in 15 minutes.",
      code,
    ),
  );
}
