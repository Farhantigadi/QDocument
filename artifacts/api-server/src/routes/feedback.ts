import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { sendFeedbackEmail } from "../lib/email";

const router: IRouter = Router();

router.post("/feedback", requireAuth, async (req, res) => {
  const { message } = req.body as Record<string, string>;
  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required." }); return;
  }
  if (message.trim().length > 2000) {
    res.status(400).json({ error: "Message must be under 2000 characters." }); return;
  }

  await sendFeedbackEmail({
    fromName: req.session!.name,
    fromEmail: req.session!.email,
    message: message.trim(),
  });

  res.json({ message: "Feedback sent. Thank you!" });
});

export default router;
