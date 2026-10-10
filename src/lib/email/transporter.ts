import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
  appBaseUrl: string;
}

export function getEmailConfig(): EmailConfig {
  const host = process.env.SMTP_HOST || 'localhost';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@quickbite.campus.edu';
  const fromName = process.env.SMTP_FROM_NAME || 'QUICKBITE Campus Canteen';
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

  const config: EmailConfig = {
    host,
    port,
    secure,
    fromEmail,
    fromName,
    appBaseUrl,
  };

  if (user && pass) {
    config.auth = { user, pass };
  }

  return config;
}

// Global cached transporter to prevent connection exhaustion
let transporterInstance: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (transporterInstance) {
    return transporterInstance;
  }

  const config = getEmailConfig();

  // If in test environment or no remote SMTP server is configured,
  // use jsonTransport to verify templates and prevent connection failures
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.SMTP_HOST === 'test' ||
    process.env.SMTP_HOST === 'mock' ||
    (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'production')
  ) {
    transporterInstance = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporterInstance;
  }

  transporterInstance = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  return transporterInstance;
}
