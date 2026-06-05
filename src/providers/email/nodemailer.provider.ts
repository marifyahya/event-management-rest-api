import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

/**
 * Singleton Nodemailer transporter configured from SMTP env vars.
 * Supports Gmail with App Password or any generic SMTP server.
 */
export const emailTransporter = nodemailer.createTransport({
  pool: true,
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});
