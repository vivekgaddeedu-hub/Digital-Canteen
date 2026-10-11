import {
  OrderEmailData,
  OrderEmailItem,
  escapeHtml,
  formatCurrency,
  formatDate,
  getTrackingUrl,
  renderEmailShell,
  renderItemsHtml,
  renderTotalsHtml,
  emailStyles,
} from './templates/base';
import { renderOrderPlacedEmail } from './templates/order-placed';
import { renderOrderReceivedEmail } from './templates/order-received';
import { renderOrderAcceptedEmail } from './templates/order-accepted';
import { renderOrderReadyForPickupEmail } from './templates/order-ready';

// Re-export core types and individual template renderers
export * from './templates/base';
export * from './templates/order-placed';
export * from './templates/order-received';
export * from './templates/order-accepted';
export * from './templates/order-ready';

// -------------------------------------------------------------
// Backwards-compatible aliases & legacy renderers
// -------------------------------------------------------------

/**
 * Backward compatibility: renderOrderConfirmationEmail
 */
export function renderOrderConfirmationEmail(data: any) {
  const rendered = renderOrderPlacedEmail(data);
  // Enhance subject with order number hashtag for legacy tests
  return {
    ...rendered,
    subject: `QuickBite | Your Order Has Been Placed! (#${data.orderNumber})`,
  };
}

/**
 * Backward compatibility: renderOrderReadyEmail
 */
export function renderOrderReadyEmail(data: any) {
  const rendered = renderOrderReadyForPickupEmail(data);
  return {
    ...rendered,
    subject: `QuickBite — Order #${data.orderNumber} is READY for pickup!`,
    html: rendered.html.replace(
      'Pickup ID / Counter Code',
      'Counter Pickup Code'
    ),
    text: `${rendered.text}\nCounter Pickup Code: ${data.pickupToken || ''}`,
  };
}

/**
 * Order Status Lifecycle update (e.g. Preparing or Cancelled)
 */
export function renderOrderStatusEmail(data: any) {
  if (data.status === 'CANCELLED' || data.status === 'REJECTED') {
    return renderOrderCancelledEmail({
      ...data,
      cancellationReason: data.reason || data.statusMessage,
    });
  }
  if (data.status === 'ACCEPTED') {
    return renderOrderAcceptedEmail(data);
  }
  const trackingUrl = getTrackingUrl(data);
  const statusMsg = data.statusMessage || `Order #${data.orderNumber} status changed to ${data.status}.`;
  const subject = `QuickBite — Order #${data.orderNumber} Status: ${data.status}`;
  const text = `Hello ${data.customerName || 'Customer'},\nOrder status: ${data.status}. ${statusMsg}\nTrack: ${trackingUrl}`;
  const html = `<p>Hello ${escapeHtml(data.customerName || 'Customer')},</p><p>Status: ${escapeHtml(data.status)}. ${escapeHtml(statusMsg)}</p><p><a href="${trackingUrl}">Track Live</a></p>`;
  return { subject, text, html };
}

/**
 * Order Cancelled Email
 */
export function renderOrderCancelledEmail(data: OrderEmailData) {
  const subject = `QuickBite | Order #${data.orderNumber} Has Been Cancelled`;
  const trackingUrl = getTrackingUrl(data);
  const safeCustomer = escapeHtml(data.customerName || 'Customer');
  const safeCanteen = escapeHtml(data.canteenName);
  const safeReason = escapeHtml(data.cancellationReason || 'Order was cancelled or could not be fulfilled by the kitchen.');
  const isRefunded = data.paymentStatus === 'REFUNDED' || data.paymentStatus === 'PARTIALLY_REFUNDED';

  const text = `
QuickBite | Order #${data.orderNumber} Has Been Cancelled

Hi ${data.customerName || 'Customer'},

This email is to notify you that order #${data.orderNumber} at ${data.canteenName} has been cancelled.

Order Reference: ${data.orderNumber}
Order UUID: ${data.orderId}
Canteen: ${data.canteenName}
Reason: ${data.cancellationReason || 'Order could not be fulfilled.'}
${isRefunded ? `Refund Status: A refund of ${formatCurrency(data.total)} has been processed.\n` : `Payment Status: ${data.paymentStatus}\n`}

View details:
${trackingUrl}

Thank you for choosing QUICKBITE!
`.trim();

  const contentHtml = `
    <div style="${emailStyles.bodyText}">
      <p style="margin: 0 0 12px; font-size: 16px;">Hi <strong>${safeCustomer}</strong>,</p>
      <p style="margin: 0 0 16px;">
        Your order at <strong>${safeCanteen}</strong> has been cancelled.
      </p>
    </div>

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: #991b1b;">
      <strong>Cancellation Reason:</strong> ${safeReason}
    </div>

    <div style="${emailStyles.metaCard}">
      <p style="margin: 0 0 6px;"><strong>Order #:</strong> ${escapeHtml(data.orderNumber)}</p>
      <p style="margin: 0 0 6px;"><strong>Order UUID:</strong> ${escapeHtml(data.orderId)}</p>
      <p style="margin: 0 0 6px;"><strong>Total:</strong> ${formatCurrency(data.total)}</p>
      <p style="margin: 0;"><strong>Payment/Refund:</strong> <span style="font-weight: 700; color: #b91c1c;">${escapeHtml(data.paymentStatus)}</span></p>
    </div>

    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${trackingUrl}" style="${emailStyles.button}; background-color: #57534e;">
        VIEW ORDER DETAILS
      </a>
    </div>
  `;

  const html = renderEmailShell({
    badgeLabel: 'Order Cancelled',
    badgeBg: '#fef2f2',
    badgeBorder: '#fecaca',
    badgeColor: '#b91c1c',
    headerTitle: `Order #${data.orderNumber} Cancelled`,
    contentHtml,
    footerNote: 'Thank you for choosing QUICKBITE!',
  });

  return { subject, text, html };
}

/**
 * Welcome Email
 */
export function renderWelcomeEmail(name: string, appBaseUrl: string) {
  const safeName = escapeHtml(name);
  const subject = `Welcome to QUICKBITE, ${name}! Skip the campus queue 🍔`;
  const text = `
Hello ${name},
Welcome to QUICKBITE — the digital canteen pre-order system for your campus!
Log in: ${appBaseUrl}/login
The QUICKBITE Team
`.trim();

  const contentHtml = `
    <div style="${emailStyles.bodyText}">
      <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 12px; color: #1c1917;">Welcome, ${safeName}!</h3>
      <p style="margin: 0 0 16px;">Pre-order your favorite campus meals, skip the line, and pick up fresh food right on time.</p>
    </div>
    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${appBaseUrl}/login" style="${emailStyles.button}">Log In to QUICKBITE</a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #78716c; margin: 12px 0 0;">
      View your orders anytime at <a href="${appBaseUrl}/customer/dashboard" style="color: #ea580c; text-decoration: underline;">/customer/dashboard</a>
    </p>
  `;

  const html = renderEmailShell({
    badgeLabel: 'Welcome',
    headerTitle: `Welcome to QUICKBITE, ${name}!`,
    contentHtml,
    footerNote: 'Thank you for choosing QUICKBITE!',
  });

  return { subject, text, html };
}

/**
 * Password Reset Email
 */
export function renderPasswordResetEmail(name: string, resetUrl: string, expiresInMinutes = 60) {
  const safeName = escapeHtml(name);
  const subject = `Reset your QUICKBITE password`;
  const text = `Hello ${name},\nReset your password here: ${resetUrl}\nExpires in ${expiresInMinutes} minutes.`.trim();

  const contentHtml = `
    <div style="${emailStyles.bodyText}">
      <p style="margin: 0 0 12px;">Hello <strong>${safeName}</strong>,</p>
      <p style="margin: 0 0 16px;">We received a request to reset your password. Click the button below to choose a new password. This link expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    </div>
    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${resetUrl}" style="${emailStyles.button}">Reset Password</a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #78716c; margin: 12px 0 0; word-break: break-all;">
      Or paste this link into your browser: <br>
      <a href="${resetUrl}" style="color: #ea580c; text-decoration: underline;">${escapeHtml(resetUrl)}</a>
    </p>
  `;

  const html = renderEmailShell({
    badgeLabel: 'Security Notice',
    headerTitle: 'Reset Your Password',
    contentHtml,
    footerNote: 'If you did not request this, you can safely ignore this email.',
  });

  return { subject, text, html };
}
