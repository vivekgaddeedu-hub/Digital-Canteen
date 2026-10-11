import {
  OrderEmailData,
  escapeHtml,
  formatCurrency,
  getTrackingUrl,
  renderEmailShell,
  renderItemsHtml,
  emailStyles,
} from './base';

/**
 * EMAIL TEMPLATE 3: ORDER ACCEPTED
 *
 * Subject: "QuickBite | Your Order Has Been Accepted!"
 * Header: "Great news! Your order has been accepted."
 * Primary Button: "TRACK YOUR ORDER"
 */
export function renderOrderAcceptedEmail(data: OrderEmailData) {
  const subject = 'QuickBite | Your Order Has Been Accepted!';
  const trackingUrl = getTrackingUrl(data);
  const customerName = data.customerName || 'Customer';
  const safeCustomer = escapeHtml(customerName);
  const safeCanteen = escapeHtml(data.canteenName);
  const safeLocation = escapeHtml(data.canteenLocation || data.canteenName);
  const safeSlot = escapeHtml(data.pickupSlot || 'As Scheduled');
  const safeOrderNumber = escapeHtml(data.orderNumber);
  const safeOrderUuid = escapeHtml(data.orderId);
  const safePickupId = escapeHtml(data.pickupToken || 'Pending Assignment');
  const safeStatus = escapeHtml(data.status || 'ACCEPTED');
  const safePaymentStatus = escapeHtml(data.paymentStatus || 'UNPAID');
  const isPaid = safePaymentStatus === 'PAID' || safePaymentStatus === 'COMPLETED';
  const items = data.items || [];

  // Plain-text version
  const itemsText = items
    .map((item) => `- ${item.name} x${item.quantity}`)
    .join('\n');

  const prepTimeText =
    data.estimatedMinutes != null && data.estimatedMinutes > 0
      ? `Estimated Preparation Time: ~${data.estimatedMinutes} minutes\n`
      : '';

  const paymentPendingNotice = !isPaid ? '\nPayment Notice: Payment is still pending.\n' : '';

  const text = `
QuickBite | Your Order Has Been Accepted!

Great news! Your order has been accepted.

Hi ${customerName},

The canteen has accepted your QUICKBITE order.

Your food will be prepared for collection at the selected pickup location.

ORDER DETAILS:
----------------------------------------
Order Number: ${data.orderNumber}
Order UUID: ${data.orderId}
Pickup ID: ${data.pickupToken || 'Pending Assignment'}
Pickup Location: ${data.canteenLocation ? `${data.canteenName} (${data.canteenLocation})` : data.canteenName}
${prepTimeText}Requested Pickup Time: ${data.pickupSlot}
Current Order Status: ${data.status}
Payment Status: ${data.paymentStatus}${paymentPendingNotice}
FOOD ITEMS & QUANTITIES:
${itemsText}

Order Total: ${formatCurrency(data.total)}

TRACK YOUR ORDER:
${trackingUrl}

Thank you for choosing QUICKBITE!
Order Ahead. Skip the Queue.
`.trim();

  // HTML content body
  const contentHtml = `
    <div style="${emailStyles.bodyText}">
      <p style="margin: 0 0 12px; font-size: 16px;">Hi <strong>${safeCustomer}</strong>,</p>
      <p style="margin: 0 0 12px;">
        The canteen has accepted your <strong>QUICKBITE</strong> order. Your meal has been accepted by the kitchen and will be prepared for collection at the selected pickup location.
      </p>
    </div>

    ${
      !isPaid
        ? `<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e;">
            <strong>Payment Notice:</strong> Payment is still pending. You can complete payment upon arrival or follow canteen checkout guidelines.
          </div>`
        : ''
    }

    <!-- Order Summary Box -->
    <div style="${emailStyles.metaCard}">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Order Number:</td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; color: #1c1917;">${safeOrderNumber}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Order UUID:</td>
          <td style="text-align: right; font-weight: 600; font-family: monospace; font-size: 11px; color: #57534e;">${safeOrderUuid}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Pickup ID:</td>
          <td style="text-align: right; font-weight: 700; font-family: monospace; color: #ea580c; font-size: 14px;">${safePickupId}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Pickup Location:</td>
          <td style="text-align: right; font-weight: 600; color: #1c1917;">${safeLocation}</td>
        </tr>
        ${
          data.estimatedMinutes != null && data.estimatedMinutes > 0
            ? `<tr>
                <td style="color: #78716c; padding: 5px 0;">Estimated Prep Time:</td>
                <td style="text-align: right; font-weight: 600; color: #047857;">~${data.estimatedMinutes} mins</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Requested Pickup Time:</td>
          <td style="text-align: right; font-weight: 600; color: #ea580c;">${safeSlot}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Current Order Status:</td>
          <td style="text-align: right; font-weight: 700; color: #047857;">${safeStatus}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Payment Status:</td>
          <td style="text-align: right; font-weight: 700; color: ${isPaid ? '#16a34a' : '#d97706'};">
            ${safePaymentStatus}${!isPaid ? ' (Payment is still pending.)' : ''}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e7e5e4;">
          <td style="color: #1c1917; padding: 8px 0 0; font-weight: 700;">Order Total:</td>
          <td style="text-align: right; font-weight: 800; color: #ea580c; font-size: 15px; padding: 8px 0 0;">${formatCurrency(data.total)}</td>
        </tr>
      </table>
    </div>

    <!-- Items Section -->
    <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1c1917;">Food Items &amp; Quantities</h3>
    ${renderItemsHtml(items)}

    <!-- Primary Button -->
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${trackingUrl}" style="${emailStyles.button}">
        TRACK YOUR ORDER
      </a>
    </div>

    <!-- Plain-text Tracking Link -->
    <p style="text-align: center; font-size: 12px; color: #78716c; margin: 12px 0 0; word-break: break-all;">
      Tracking URL: <br>
      <a href="${trackingUrl}" style="color: #ea580c; text-decoration: underline;">${escapeHtml(trackingUrl)}</a>
    </p>
  `;

  const html = renderEmailShell({
    badgeLabel: 'Order Accepted',
    badgeBg: '#ecfdf5',
    badgeBorder: '#a7f3d0',
    badgeColor: '#047857',
    headerTitle: 'Great news! Your order has been accepted.',
    contentHtml,
    footerNote: 'Thank you for choosing QUICKBITE!',
  });

  return { subject, text, html };
}
