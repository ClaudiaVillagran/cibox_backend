import nodemailer from "nodemailer";

const getTransporter = () => {
  console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM);

  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    !process.env.EMAIL_FROM
  ) {
    throw new Error("Faltan variables EMAIL_* en el entorno");
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  console.log("try");
  if (!to) return;

  const transporter = getTransporter();

  try {
    await transporter.verify();
    console.log("SMTP OK");
  } catch (error) {
    console.error("SMTP VERIFY ERROR:", error);
    throw error;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    console.log("EMAIL SENT");
  } catch (error) {
    console.error("SEND MAIL ERROR:", error);
    throw error;
  }
};