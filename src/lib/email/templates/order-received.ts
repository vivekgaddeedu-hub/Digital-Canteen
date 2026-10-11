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
 * EMAIL TEMPLATE 2: ORDER RECEIVED
 *
 * Subject: "QuickBite | The Canteen Has Received Your Order"
 * Header: "Your order has reached the canteen!"
 * Primary Button: "CHECK ORDER STATUS"
 */
export function renderOrderReceivedEmail(data: OrderEmailData) {
  const subject = 'QuickBite | The Canteen Has Received Your Order';
  const trackingUrl = getTrackingUrl(data);
  const customerName = data.customerName || 'Customer';
  const safeCustomer = escapeHtml(customerName);
  const safeCanteen = escapeHtml(data.canteenName);
  const safeLocation = escapeHtml(data.canteenLocation || data.canteenName);
  const safeSlot = escapeHtml(data.pickupSlot || 'As Scheduled');
  const safeOrderNumber = escapeHtml(data.orderNumber);
  const safeOrderUuid = escapeHtml(data.orderId);
  const safePickupId = escapeHtml(data.pickupToken || 'Pending Assignment');
  const safeStatus = escapeHtml(data.status || 'RECEIVED');
  const safePaymentStatus = escapeHtml(data.paymentStatus || 'UNPAID');
  const items = data.items || [];

  // Plain text version
  const itemsText = items
    .map((item) => `- ${item.name} x${item.quantity}`)
    .join('\n');

  const text = `
QuickBite | The Canteen Has Received Your Order

Your order has reached the canteen!

Hi ${customerName},

The canteen has received your order and is reviewing it.

You can check the latest status using the tracking link below.

ORDER DETAILS:
----------------------------------------
Order Number: ${data.orderNumber}
Order UUID: ${data.orderId}
Pickup ID: ${data.pickupToken || 'Pending Assignment'}
Pickup Location: ${data.canteenLocation ? `${data.canteenName} (${data.canteenLocation})` : data.canteenName}
Pickup Time: ${data.pickupSlot}
Current Order Status: ${data.status}
Payment Status: ${data.paymentStatus}

FOOD ITEMS & QUANTITIES:
${itemsText}

Order Total: ${formatCurrency(data.total)}

CHECK ORDER STATUS:
${trackingUrl}

Thank you for choosing QUICKBITE!
Order Ahead. Skip the Queue.
`.trim();

  // HTML content body
  const contentHtml = `
    <div style="${emailStyles.bodyText}">
      <p style="margin: 0 0 12px; font-size: 16px;">Hi <strong>${safeCustomer}</strong>,</p>
      <p style="margin: 0 0 12px;">
        The canteen has received your order and is reviewing it.
      </p>
      <p style="margin: 0 0 16px;">
        You can check the latest status using the tracking link below.
      </p>
    </div>

    <!-- Acknowledgement Notice -->
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #1e40af;">
      <strong>Kitchen Acknowledged:</strong> Authorized staff at <strong>${safeCanteen}</strong> have received and acknowledged your order ticket and are reviewing preparation capacity.
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
          <td style="text-align: right; font-weight: 700; font-family: monospace; color: #ea580c; font-size: 14px;">${safePickupId}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Pickup Location:</td>
          <td style="text-align: right; font-weight: 600; color: #1c1917;">${safeLocation}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Pickup Time:</td>
          <td style="text-align: right; font-weight: 600; color: #ea580c;">${safeSlot}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Current Order Status:</td>
          <td style="text-align: right; font-weight: 700; color: #2563eb;">${safeStatus}</td>
        </tr>
        <tr>
          <td style="color: #78716c; padding: 5px 0;">Payment Status:</td>
          <td style="text-align: right; font-weight: 700; color: ${safePaymentStatus === 'PAID' || safePaymentStatus === 'COMPLETED' ? '#16a34a' : '#d97706'};">
            ${safePaymentStatus}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e7e5e4;">
          <td style="color: #1c1917; padding: 8px 0 0; font-weight: 700;">Order Total:</td>
          <td style="text-align: right; font-weight: 800; color: #ea580c; font-size: 15px; padding: 8px 0 0;">${formatCurrency(data.total)}</td>
        </tr>
      </table>
    </div>

    <!-- Items List -->
    <h3 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #1c1917;">Food Items &amp; Quantities</h3>
    ${renderItemsHtml(items)}

    <!-- Primary Button -->
    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${trackingUrl}" style="${emailStyles.button}">
        CHECK ORDER STATUS
      </a>
    </div>

    <!-- Plain-text Tracking Link -->
    <p style="text-align: center; font-size: 12px; color: #78716c; margin: 12px 0 0; word-break: break-all;">
      Tracking URL: <br>
      <a href="${trackingUrl}" style="color: #ea580c; text-decoration: underline;">${escapeHtml(trackingUrl)}</a>
    </p>
  `;

  const html = renderEmailShell({
    badgeLabel: 'Order Received',
    badgeBg: '#eff6ff',
    badgeBorder: '#bfdbfe',
    badgeColor: '#1d4ed8',
    headerTitle: 'Your order has reached the canteen!',
    contentHtml,
    footerNote: 'Thank you for choosing QUICKBITE!',
  });

  return { subject, text, html };
}
