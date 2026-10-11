import {
  OrderEmailData,
  escapeHtml,
  formatCurrency,
  formatDate,
  getTrackingUrl,
  renderEmailShell,
  renderItemsHtml,
  renderTotalsHtml,
  emailStyles,
} from './base';

/**
 * EMAIL TEMPLATE 1: ORDER PLACED
 *
 * Subject: "QuickBite | Your Order Has Been Placed!"
 * Header: "Your order is on its way to the kitchen!"
 * Primary Button: "TRACK MY ORDER"
 * Footer: "Thank you for choosing QUICKBITE!"
 */
export function renderOrderPlacedEmail(data: OrderEmailData) {
  const subject = 'QuickBite | Your Order Has Been Placed!';
  const trackingUrl = getTrackingUrl(data);
  const customerName = data.customerName || 'Customer';
  const safeCustomer = escapeHtml(customerName);
  const safeCanteen = escapeHtml(data.canteenName);
  const safeLocation = escapeHtml(data.canteenLocation || '');
  const safeSlot = escapeHtml(data.pickupSlot || 'As Scheduled');
  const safeOrderNumber = escapeHtml(data.orderNumber);
  const safeOrderUuid = escapeHtml(data.orderId);
  const safePickupId = escapeHtml(data.pickupToken || 'Pending Assignment');
  const safeStatus = escapeHtml(data.status || 'PLACED');
  const safePaymentStatus = escapeHtml(data.paymentStatus || 'UNPAID');
  const items = data.items || [];
  const createdAtFormatted = data.createdAt ? formatDate(data.createdAt) : formatDate(new Date());

  // Plain-text version
  const itemsText = items
    .map((item) => {
      const price = item.price ?? item.unitPrice ?? (item.quantity > 0 ? item.subtotal / item.quantity : 0);
      return `- ${item.name} x${item.quantity} (${formatCurrency(price)} each) = ${formatCurrency(item.subtotal)}`;
    })
    .join('\n');

  const text = `
QuickBite | Your Order Has Been Placed!

Your order is on its way to the kitchen!

Hi ${customerName},

Thank you for ordering with QUICKBITE!

We've received your order request. The canteen will review your order and update its status shortly.

ORDER SUMMARY:
----------------------------------------
Order Number: ${data.orderNumber}
Order UUID: ${data.orderId}
Pickup ID: ${data.pickupToken || 'Pending Assignment'}
Canteen Name: ${data.canteenName}${data.canteenLocation ? ` (${data.canteenLocation})` : ''}
Order Creation Time: ${createdAtFormatted}
Requested Pickup Time: ${data.pickupSlot}
Current Order Status: ${data.status}
Payment Status: ${data.paymentStatus}

FOOD ITEMS:
${itemsText}

Subtotal: ${formatCurrency(data.subtotal)}
${data.discount ? `Discount: -${formatCurrency(data.discount)}\n` : ''}Taxes & Fees: ${formatCurrency((data.tax || 0) + (data.convenienceFee || 0))}
Total Amount: ${formatCurrency(data.total)}

TRACK MY ORDER:
Click the tracking link below to follow your order in real-time:
${trackingUrl}

Thank you for choosing QUICKBITE!
Order Ahead. Skip the Queue.
`.trim();

  // HTML content body
  const contentHtml = `
    <div style="${emailStyles.bodyText}">
      <p style="margin: 0 0 12px; font-size: 16px;">Hi <strong>${safeCustomer}</strong>,</p>
      <p style="margin: 0 0 12px;">Thank you for ordering with <strong>QUICKBITE</strong>!</p>
      <p style="margin: 0 0 16px;">
        We've received your order request. The canteen will review your order and update its status shortly.
      </p>
    </div>

    <!-- Order Awaiting Kitchen Review Banner -->
    <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #9a3412;">
      <strong>Note:</strong> Your order has been placed and transmitted to <strong>${safeCanteen}</strong>. It is currently awaiting acceptance while kitchen staff review and acknowledge it shortly.
    </div>

    <!-- Order Summary Table -->
    <div style="${emailStyles.metaCard}">
      <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1c1917;">Order Details</h3>
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
          <td style="color: #78716c; padding: 5px 0;">Canteen Name:</td>
          <td style="text-align: right; font-weight: 600; color: #1c1917;">${safeCanteen}${safeLocation ? ` (${safeLocation})` : ''}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Order Creation Time:</td>
          <td style="text-align: right; font-weight: 500; color: #44403c;">${createdAtFormatted}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Requested Pickup Time:</td>
          <td style="text-align: right; font-weight: 600; color: #ea580c;">${safeSlot}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Current Order Status:</td>
          <td style="text-align: right; font-weight: 700; color: #c2410c;">${safeStatus}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Payment Status:</td>
          <td style="text-align: right; font-weight: 700; color: ${safePaymentStatus === 'PAID' || safePaymentStatus === 'COMPLETED' ? '#16a34a' : '#d97706'};">
            ${safePaymentStatus}
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Section -->
    <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1c1917;">Food Items</h3>
    ${renderItemsHtml(items)}

    <!-- Totals Breakdown -->
    ${renderTotalsHtml(data)}

    <!-- Primary Action Button -->
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${trackingUrl}" style="${emailStyles.button}">
        TRACK MY ORDER
      </a>
    </div>

    <!-- Plain-text Tracking URL fallback -->
    <p style="text-align: center; font-size: 12px; color: #78716c; margin: 12px 0 0; word-break: break-all;">
      Or track your order at: <br>
      <a href="${trackingUrl}" style="color: #ea580c; text-decoration: underline;">${escapeHtml(trackingUrl)}</a>
    </p>
  `;

  const html = renderEmailShell({
    badgeLabel: 'Order Placed',
    headerTitle: 'Your order is on its way to the kitchen!',
    contentHtml,
    footerNote: 'Thank you for choosing QUICKBITE!',
  });

  return { subject, text, html };
}
