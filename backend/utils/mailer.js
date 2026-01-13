import nodemailer from "nodemailer";

let transporter;
let usingTestAccount = false;

const createTransporter = async () => {
  // Prefer explicit SMTP config from env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    usingTestAccount = false;
    return transporter;
  }

  // Fallback: create an Ethereal test account for development
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  usingTestAccount = true;
  console.warn("No SMTP config provided — using Ethereal test account for email (dev only). Preview URL will be logged.");
  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) await createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || (usingTestAccount ? "no-reply@jobportal.test" : undefined);
  const info = await transporter.sendMail({ from, to, subject, text, html });

  if (usingTestAccount) {
    // log preview URL for Ethereal
    try {
      const preview = nodemailer.getTestMessageUrl(info);
      console.info("Ethereal preview URL:", preview);
    } catch (err) {
      // ignore
    }
  }

  return info;
};

export default sendEmail;
