import nodemailer from "nodemailer";
import logger from "./logger.js";

// Create reusable transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP service)
  // For production, use real SMTP service (Gmail, SendGrid, etc.)
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Log email to console instead of sending
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || "test@ethereal.email",
        pass: process.env.ETHEREAL_PASS || "test123",
      },
    });
  }
};

export async function sendVerificationEmail(email, token, fullName) {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "Streamify <noreply@streamify.com>",
      to: email,
      subject: "Verify Your Email - Streamify",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to Streamify!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea;">Hi ${fullName},</h2>
              <p>Thank you for signing up! Please verify your email address to get started with language exchange.</p>
              <p>Click the button below to verify your email:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #667eea; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
              <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>&copy; 2025 Streamify. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${fullName},\n\nThank you for signing up! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production") {
      logger.info(`Verification email sent to ${email}`);
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(email, token, fullName) {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "Streamify <noreply@streamify.com>",
      to: email,
      subject: "Reset Your Password - Streamify",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Password Reset</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea;">Hi ${fullName},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #667eea; word-break: break-all; font-size: 14px;">${resetUrl}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>&copy; 2025 Streamify. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${fullName},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production") {
      logger.info(`Password reset email sent to ${email}`);
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
}
