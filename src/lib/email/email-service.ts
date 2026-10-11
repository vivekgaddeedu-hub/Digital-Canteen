import { getEmailConfig, getEmailTransporter } from './transporter';
import prisma from '@/lib/prisma';
import {
  renderWelcomeEmail,
  renderPasswordResetEmail,
} from './templates';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deduplicated?: boolean;
}

export interface SendEmailOptions {
  orderId?: string;
  templateType?: string;
}

/**
 * Sends a transactional email safely.
 * Checks for rapid duplicate sends and logs delivery attempts to NotificationLog.
 * Will not throw or crash caller processes if SMTP is unreachable or fails.
 */
export async function sendEmailSafe(
  to: string,
  subject: string,
  text: string,
  html: string,
  options?: SendEmailOptions
): Promise<SendMailResult> {
  const config = getEmailConfig();

  // Deduplication check: if orderId and templateType provided, avoid sending identical notification within 30s
  if (options?.orderId && options?.templateType) {
    try {
      const recent = await prisma.notificationLog.findFirst({
        where: {
          orderId: options.orderId,
          templateType: options.templateType,
          status: 'SENT',
          createdAt: { gte: new Date(Date.now() - 30 * 1000) },
        },
      });

      if (recent) {
        return { success: true, deduplicated: true, messageId: recent.id };
      }
    } catch {
      // Non-fatal if DB log read fails
    }
  }

  // If in automated test mode without mock transporter, return a mock success
  if (process.env.NODE_ENV === 'test' && !process.env.SMTP_HOST) {
    try {
      if (options?.orderId) {
        await prisma.notificationLog.create({
          data: {
            orderId: options.orderId,
            recipient: to,
            subject,
            templateType: options?.templateType || 'TEST',
            status: 'SENT',
            metadata: JSON.stringify({ mode: 'test-mock' }),
          },
        });
      }
    } catch {
      // non-fatal
    }
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

    // Record successful delivery attempt
    try {
      await prisma.notificationLog.create({
        data: {
          orderId: options?.orderId || null,
          recipient: to,
          subject,
          templateType: options?.templateType || 'GENERAL',
          status: 'SENT',
          metadata: JSON.stringify({ messageId: info.messageId }),
        },
      });
    } catch {
      // Non-fatal
    }

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn(`[QUICKBITE Email Service] Delivery failed to ${to}: ${errorMessage}`);

    // Record failed attempt
    try {
      await prisma.notificationLog.create({
        data: {
          orderId: options?.orderId || null,
          recipient: to,
          subject,
          templateType: options?.templateType || 'GENERAL',
          status: 'FAILED',
          errorMessage,
        },
      });
    } catch {
      // Non-fatal
    }

    return { success: false, error: errorMessage };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<SendMailResult> {
  const config = getEmailConfig();
  const { subject, text, html } = renderWelcomeEmail(name, config.appBaseUrl);
  return sendEmailSafe(to, subject, text, html, { templateType: 'WELCOME' });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const resetUrl = `${config.appBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const { subject, text, html } = renderPasswordResetEmail(name, resetUrl, 60);
  return sendEmailSafe(to, subject, text, html, { templateType: 'PASSWORD_RESET' });
}

// Re-export order email senders from dedicated module
export {
  sendOrderPlacedEmail,
  sendOrderReceivedEmail,
  sendOrderAcceptedEmail,
  sendOrderReadyEmail,
  sendOrderCancelledEmail,
  sendOrderStatusEmail,
} from './send-order-email';

// Backward compatibility alias
export async function sendOrderConfirmationEmail(
  to: string,
  orderData: any
): Promise<SendMailResult> {
  const { sendOrderPlacedEmail } = await import('./send-order-email');
  return sendOrderPlacedEmail(to, orderData);
}
