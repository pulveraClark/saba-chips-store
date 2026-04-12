const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || "live.smtp.mailtrap.io",
  port: Number(process.env.MAILTRAP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAILTRAP_USER || "api",
    pass: process.env.MAILTRAP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@sabachips.com",
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;