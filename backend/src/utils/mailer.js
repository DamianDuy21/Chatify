import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

function isLoggerTrue(v, def = false) {
  if (v == null) return def;
  return String(v).toLowerCase() === "true";
}

const host = process.env.MAIL_HOST || "smtp.gmail.com";
const port = Number(process.env.MAIL_PORT || 465);
const secure = port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },

  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 15_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  tls: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
  logger: isLoggerTrue(process.env.MAIL_DEBUG, false),
});

export async function sendOtpMail({ to, code, type, expiresInMin }) {
  const fromAddress = process.env.MAIL_FROM || process.env.MAIL_USER;
  const fromName = process.env.MAIL_FROM_NAME || "Chatify";
  const subject = `Your OTP code for ${type}`;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    text: `Your OTP code is ${code}. It will expire in ${expiresInMin} minutes.`,
    html: `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;line-height:1.6">
        <p>Your OTP code is <b style="font-size:16px">${code}</b>.</p>
        <p>It will expire in <b>${expiresInMin} minutes</b>.</p>
      </div>
    `,
    headers: {
      "X-Entity-Ref-ID": `otp-${Date.now()}`,
    },
  });

  return info;
}
