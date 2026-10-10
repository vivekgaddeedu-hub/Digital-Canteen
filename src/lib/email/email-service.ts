import { getEmailConfig, getEmailTransporter } from './transporter';
import {
  renderWelcomeEmail,
  renderPasswordResetEmail,
  renderOrderConfirmationEmail,
  renderOrderReadyEmail,
  renderOrderStatusEmail,
  OrderEmailData,
} from './templates';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a generic transactional email safely.
 * Will not throw or crash caller processes if SMTP is unreachable or fails.
 */
export async function sendEmailSafe(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<SendMailResult> {
  const config = getEmailConfig();

  // If in automated test mode without mock transporter, return a mock success
  if (process.env.NODE_ENV === 'test' && !process.env.SMTP_HOST) {
    return { success: true, messageId: `mock-msg-${Date.now()}` };
  }

  try {
    const transporter = getEmailTransporter();
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn(`[QUICKBITE Email Service] Delivery failed to ${to}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<SendMailResult> {
  const config = getEmailConfig();
  const { subject, text, html } = renderWelcomeEmail(name, config.appBaseUrl);
  return sendEmailSafe(to, subject, text, html);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const resetUrl = `${config.appBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const { subject, text, html } = renderPasswordResetEmail(name, resetUrl, 60);
  return sendEmailSafe(to, subject, text, html);
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderData: Omit<OrderEmailData, 'appBaseUrl'>
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    ...orderData,
    appBaseUrl: config.appBaseUrl,
  };
  const { subject, text, html } = renderOrderConfirmationEmail(fullData);
  return sendEmailSafe(to, subject, text, html);
}

export async function sendOrderReadyEmail(
  to: string,
  data: {
    orderNumber: string;
    customerName: string;
    canteenName: string;
    canteenLocation: string;
    pickupToken: string;
  }
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const { subject, text, html } = renderOrderReadyEmail({
    ...data,
    appBaseUrl: config.appBaseUrl,
  });
  return sendEmailSafe(to, subject, text, html);
}

export async function sendOrderStatusEmail(
  to: string,
  data: {
    orderNumber: string;
    customerName: string;
    canteenName: string;
    status: string;
    statusMessage: string;
    reason?: string | null;
  }
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const { subject, text, html } = renderOrderStatusEmail({
    ...data,
    appBaseUrl: config.appBaseUrl,
  });
  return sendEmailSafe(to, subject, text, html);
}
