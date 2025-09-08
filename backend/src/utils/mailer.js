import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendOtpMail({ to, code, type, expiresInMin }) {
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Your OTP code for ${type}`,
    text: `Your OTP code is ${code}. It will expire in ${expiresInMin} minutes.`,
    html: `<b>Your OTP code is ${code}. It will expire in ${expiresInMin} minutes.</b>`,
  });

  console.log("OTP email sent:", info.messageId);
}
