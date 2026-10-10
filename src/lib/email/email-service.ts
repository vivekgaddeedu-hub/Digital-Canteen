import { getEmailConfig, getEmailTransporter } from './transporter';
import prisma from '@/lib/prisma';
import {
  renderWelcomeEmail,
  renderPasswordResetEmail,
  renderOrderPlacedEmail,
  renderOrderReceivedEmail,
  renderOrderAcceptedEmail,
  renderOrderReadyForPickupEmail,
  renderOrderCancelledEmail,
  renderOrderStatusEmail,
  OrderEmailData,
} from './templates';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deduplicated?: boolean;
}

interface SendEmailOptions {
  orderId?: string;
  templateType?: string;
}

/**
 * Sends a generic transactional email safely.
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

export async function sendOrderPlacedEmail(
  to: string,
  orderData: Omit<OrderEmailData, 'appBaseUrl'>
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    ...orderData,
    appBaseUrl: config.appBaseUrl,
  };
  const { subject, text, html } = renderOrderPlacedEmail(fullData);
  return sendEmailSafe(to, subject, text, html, {
    orderId: fullData.orderId,
    templateType: 'ORDER_PLACED',
  });
}

export async function sendOrderReceivedEmail(
  to: string,
  orderData: Omit<OrderEmailData, 'appBaseUrl'>
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    ...orderData,
    appBaseUrl: config.appBaseUrl,
  };
  const { subject, text, html } = renderOrderReceivedEmail(fullData);
  return sendEmailSafe(to, subject, text, html, {
    orderId: fullData.orderId,
    templateType: 'ORDER_RECEIVED',
  });
}

export async function sendOrderAcceptedEmail(
  to: string,
  orderData: Omit<OrderEmailData, 'appBaseUrl'>
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    ...orderData,
    appBaseUrl: config.appBaseUrl,
  };
  const { subject, text, html } = renderOrderAcceptedEmail(fullData);
  return sendEmailSafe(to, subject, text, html, {
    orderId: fullData.orderId,
    templateType: 'ORDER_ACCEPTED',
  });
}

export async function sendOrderReadyEmail(
  to: string,
  orderData: Partial<OrderEmailData> & { orderNumber: string }
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    orderId: orderData.orderNumber,
    customerName: 'Customer',
    canteenName: 'QuickBite Canteen',
    canteenLocation: 'Counter 1',
    pickupSlot: 'Ready Now',
    pickupToken: '',
    items: [],
    subtotal: 0,
    tax: 0,
    convenienceFee: 0,
    total: 0,
    status: 'READY',
    paymentStatus: 'PAID',
    appBaseUrl: config.appBaseUrl,
    ...orderData,
  };
  const { subject, text, html } = renderOrderReadyForPickupEmail(fullData);
  return sendEmailSafe(to, subject, text, html, {
    orderId: fullData.orderId,
    templateType: 'ORDER_READY',
  });
}

export async function sendOrderCancelledEmail(
  to: string,
  orderData: Omit<OrderEmailData, 'appBaseUrl'>
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    ...orderData,
    appBaseUrl: config.appBaseUrl,
  };
  const { subject, text, html } = renderOrderCancelledEmail(fullData);
  return sendEmailSafe(to, subject, text, html, {
    orderId: fullData.orderId,
    templateType: 'ORDER_CANCELLED',
  });
}

// Backward compatibility helper
export async function sendOrderConfirmationEmail(
  to: string,
  orderData: any
): Promise<SendMailResult> {
  return sendOrderPlacedEmail(to, orderData);
}

export async function sendOrderStatusEmail(
  to: string,
  data: any
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const { subject, text, html } = renderOrderStatusEmail({
    ...data,
    appBaseUrl: config.appBaseUrl,
  });
  return sendEmailSafe(to, subject, text, html, {
    orderId: data.orderId || data.orderNumber,
    templateType: `ORDER_STATUS_${data.status}`,
  });
}
