import nodemailer from "nodemailer";
import { env } from "./env.js";

// null when SMTP isn't configured: the app still works, emails are just skipped.
export const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // Port 465 uses implicit TLS; the other ports upgrade with STARTTLS.
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;