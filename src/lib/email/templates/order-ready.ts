import {
  OrderEmailData,
  escapeHtml,
  formatCurrency,
  formatDate,
  getTrackingUrl,
  renderEmailShell,
  renderItemsHtml,
  emailStyles,
} from './base';

/**
 * EMAIL TEMPLATE 4: ORDER READY FOR PICKUP
 *
 * Subject: "QuickBite | Your Food Is Ready for Pickup!"
 * Header: "Your food is ready!"
 * Primary Button: "VIEW PICKUP DETAILS"
 */
export function renderOrderReadyForPickupEmail(data: OrderEmailData) {
  const subject = 'QuickBite | Your Food Is Ready for Pickup!';
  const trackingUrl = getTrackingUrl(data);
  const customerName = data.customerName || 'Customer';
  const safeCustomer = escapeHtml(customerName);
  const safeCanteen = escapeHtml(data.canteenName);
  const safeLocation = escapeHtml(data.canteenLocation || data.canteenName);
  const safeOrderNumber = escapeHtml(data.orderNumber);
  const safeOrderUuid = escapeHtml(data.orderId);
  const safePickupId = escapeHtml(data.pickupToken || 'Pending Assignment');
  const safePaymentStatus = escapeHtml(data.paymentStatus || 'UNPAID');
  const isPaid = safePaymentStatus === 'PAID' || safePaymentStatus === 'COMPLETED';
  const readyTimeFormatted = data.readyAt ? formatDate(data.readyAt) : formatDate(new Date());
  const items = data.items || [];
  const defaultInstructions = data.pickupInstructions ||
    `Proceed to ${data.canteenName} counter. Show your pickup ID (${data.pickupToken || ''}) or the pickup QR code to authorized canteen staff.`;

  // Payment policy copy as explicitly required
  const paymentNotice = isPaid
    ? 'Payment confirmed. Payment Verified & Settled — No further payment required.'
    : "Payment Due at Counter: Payment is still due. Payment must be completed and verified according to the canteen's payment policy before collection.";

  // Plain-text version
  const itemsText = items.map((item) => `- ${item.name} x${item.quantity}`).join('\n');

  const text = `
QuickBite | Your Food Is Ready for Pickup!

Your food is ready!

Hi ${customerName},

Your QUICKBITE order is ready for collection.

Please visit the pickup counter at the location shown below.

PICKUP DETAILS:
----------------------------------------
Order Number: ${data.orderNumber}
Order UUID: ${data.orderId}
Pickup ID: ${data.pickupToken || 'Pending Assignment'}
Pickup Location: ${data.canteenLocation ? `${data.canteenName} (${data.canteenLocation})` : data.canteenName}
Ready Time: ${readyTimeFormatted}
Payment Status: ${data.paymentStatus}
${paymentNotice}

PICKUP INFORMATION:
Show your pickup ID or the pickup QR code to authorized canteen staff when collecting your order.

Pickup Instructions:
${defaultInstructions}

FOOD ITEMS:
${itemsText}

Order Total: ${formatCurrency(data.total)}

VIEW PICKUP DETAILS:
${trackingUrl}

Thank you for choosing QUICKBITE!
Order Ahead. Skip the Queue.
`.trim();

  // HTML content body
  const contentHtml = `
    <div style="${emailStyles.bodyText}">
      <p style="margin: 0 0 12px; font-size: 16px;">Hi <strong>${safeCustomer}</strong>,</p>
      <p style="margin: 0 0 12px;">
        Your <strong>QUICKBITE</strong> order is ready for collection.
      </p>
      <p style="margin: 0 0 16px;">
        Please visit the pickup counter at the location shown below.
      </p>
    </div>

    <!-- Pickup ID Hero Card -->
    <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Pickup ID / Counter Code</span>
      <div style="font-size: 38px; font-weight: 900; color: #15803d; font-family: monospace; letter-spacing: 3px; margin: 8px 0;">
        ${safePickupId}
      </div>
      <div style="font-size: 13px; color: #14532d; font-weight: 600;">
        Location: <strong>${safeLocation}</strong>
      </div>
    </div>

    <!-- Payment Notice Card -->
    <div style="background-color: ${isPaid ? '#f0fdf4' : '#fffbeb'}; border-left: 4px solid ${isPaid ? '#22c55e' : '#f59e0b'}; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: ${isPaid ? '#166534' : '#92400e'};">
      <strong>Payment Status:</strong> ${escapeHtml(paymentNotice)}
    </div>

    <!-- Order Metadata Box -->
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
          <td style="text-align: right; font-weight: 700; font-family: monospace; color: #15803d; font-size: 14px;">${safePickupId}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Pickup Location:</td>
          <td style="text-align: right; font-weight: 600; color: #1c1917;">${safeLocation}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Ready Time:</td>
          <td style="text-align: right; font-weight: 600; color: #15803d;">${readyTimeFormatted}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Payment Status:</td>
          <td style="text-align: right; font-weight: 700; color: ${isPaid ? '#16a34a' : '#d97706'};">
            ${safePaymentStatus}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e7e5e4;">
          <td style="color: #1c1917; padding: 8px 0 0; font-weight: 700;">Order Total:</td>
          <td style="text-align: right; font-weight: 800; color: #ea580c; font-size: 15px; padding: 8px 0 0;">${formatCurrency(data.total)}</td>
        </tr>
      </table>
    </div>

    <!-- Pickup Information -->
    <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #44403c;">
      <h4 style="margin: 0 0 6px; font-size: 13px; text-transform: uppercase; color: #1c1917; letter-spacing: 0.5px;">Pickup Instructions</h4>
      <p style="margin: 0 0 8px;">Show your pickup ID or the pickup QR code to authorized canteen staff when collecting your order.</p>
      <p style="margin: 0; font-size: 12px; color: #78716c;">${escapeHtml(defaultInstructions)}</p>
    </div>

    <!-- Food Items -->
    <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1c1917;">Food Items</h3>
    ${renderItemsHtml(items)}

    <!-- Primary Button -->
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${trackingUrl}" style="${emailStyles.button}">
        VIEW PICKUP DETAILS
      </a>
    </div>

    <!-- Plain-text Tracking Link -->
    <p style="text-align: center; font-size: 12px; color: #78716c; margin: 12px 0 0; word-break: break-all;">
      Tracking URL: <br>
      <a href="${trackingUrl}" style="color: #ea580c; text-decoration: underline;">${escapeHtml(trackingUrl)}</a>
    </p>
  `;

  const html = renderEmailShell({
    badgeLabel: 'Ready for Pickup',
    badgeBg: '#ecfdf5',
    badgeBorder: '#86efac',
    badgeColor: '#15803d',
    headerTitle: 'Your food is ready!',
    contentHtml,
    footerNote: 'Thank you for choosing QUICKBITE!',
  });

  return { subject, text, html };
}
