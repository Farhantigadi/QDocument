import nodemailer from "nodemailer";

// Read credentials lazily so env is always fully loaded
function getSmtp() {
  const user = process.env.SMTP_USER ?? "";
  const pass = (process.env.SMTP_PASS ?? "").replace(/\s/g, "");
  return { user, pass };
}

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

async function sendEmail(to: string, subject: string, html: string, code: string): Promise<void> {
  const { user, pass } = getSmtp();

  // Always log so OTP is visible in server console regardless of SMTP
  console.log(`\n✉️  OTP for ${to} — Code: ${code}\n`);

  if (!user || !pass) {
    console.warn("SMTP_USER/SMTP_PASS not set — email not sent.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({ from: `Haven <${user}>`, to, subject, html });
  } catch (err) {
    // Log but don't throw — OTP was already logged above so dev flow still works
    console.error("SMTP send failed:", err instanceof Error ? err.message : err);
  }
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
    code,
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
    code,
  );
}

export async function sendFeedbackEmail({ fromName, fromEmail, message }: {
  fromName: string;
  fromEmail: string;
  message: string;
}): Promise<void> {
  const { user, pass } = getSmtp();
  console.log(`\n📬 Feedback from ${fromName} <${fromEmail}>:\n${message}\n`);
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;max-width:600px">
    <h2 style="margin:0 0 4px">New Haven Feedback</h2>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px">From <strong>${fromName}</strong> &lt;${fromEmail}&gt;</p>
    <div style="background:#f4f4f5;border-radius:10px;padding:16px 20px;font-size:15px;line-height:1.6;white-space:pre-wrap">${message}</div>
  </body></html>`;

  try {
    await transporter.sendMail({
      from: `Haven Feedback <${user}>`,
      to: user,
      replyTo: fromEmail,
      subject: `Haven feedback from ${fromName}`,
      html,
    });
  } catch (err) {
    console.error("Feedback email failed:", err instanceof Error ? err.message : err);
  }
}
