import { getEmailConfig } from './transporter';
import { sendEmailSafe, SendMailResult } from './email-service';
import {
  renderOrderPlacedEmail,
  renderOrderReceivedEmail,
  renderOrderAcceptedEmail,
  renderOrderReadyForPickupEmail,
  renderOrderCancelledEmail,
  renderOrderStatusEmail,
  OrderEmailData,
} from './templates';

/**
 * Sends Order Placed email notification
 */
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

/**
 * Sends Order Received email notification
 */
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

/**
 * Sends Order Accepted email notification
 */
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

/**
 * Sends Order Ready for Pickup email notification
 */
export async function sendOrderReadyEmail(
  to: string,
  orderData: Partial<OrderEmailData> & { orderNumber: string }
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    orderId: orderData.orderId || orderData.orderNumber,
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
    paymentStatus: 'UNPAID',
    appBaseUrl: config.appBaseUrl,
    readyAt: new Date(),
    ...orderData,
  };
  const { subject, text, html } = renderOrderReadyForPickupEmail(fullData);
  return sendEmailSafe(to, subject, text, html, {
    orderId: fullData.orderId,
    templateType: 'ORDER_READY',
  });
}

/**
 * Sends Order Cancelled email notification
 */
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

/**
 * Sends Order Status transition email notification
 */
export async function sendOrderStatusEmail(
  to: string,
  orderData: any
): Promise<SendMailResult> {
  const config = getEmailConfig();
  const fullData: OrderEmailData = {
    ...orderData,
    appBaseUrl: config.appBaseUrl,
  };
  const { subject, text, html } = renderOrderStatusEmail(fullData);
  return sendEmailSafe(to, subject, text, html, {
    orderId: fullData.orderId,
    templateType: `ORDER_STATUS_${orderData.status || 'UPDATE'}`,
  });
}
