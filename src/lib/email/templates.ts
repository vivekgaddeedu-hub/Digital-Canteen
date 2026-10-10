export interface OrderEmailItem {
  name: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  subtotal: number;
  notes?: string | null;
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  canteenName: string;
  canteenLocation: string;
  pickupSlot: string;
  pickupToken: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  convenienceFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  specialInstructions?: string | null;
  guestTrackingToken?: string | null;
  appBaseUrl: string;
  cancellationReason?: string | null;
  estimatedMinutes?: number | null;
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1c1917;
  background-color: #fafaf9;
  margin: 0;
  padding: 0;
  line-height: 1.5;
`;

const containerStyles = `
  max-width: 600px;
  margin: 20px auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e7e5e4;
`;

const headerStyles = `
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  color: #ffffff;
  padding: 28px 32px;
  text-align: center;
`;

const footerStyles = `
  background-color: #f5f5f4;
  color: #78716c;
  padding: 20px 32px;
  text-align: center;
  font-size: 12px;
  border-top: 1px solid #e7e5e4;
`;

function getTrackingUrl(data: { appBaseUrl: string; orderId: string; guestTrackingToken?: string | null }): string {
  if (data.guestTrackingToken) {
    return `${data.appBaseUrl}/track-order/${data.orderId}?token=${encodeURIComponent(data.guestTrackingToken)}`;
  }
  return `${data.appBaseUrl}/track-order/${data.orderId}`;
}

// -------------------------------------------------------------
// 1. ORDER PLACED (Submitted & awaiting kitchen acceptance)
// -------------------------------------------------------------
export function renderOrderPlacedEmail(data: OrderEmailData) {
  const subject = `QuickBite — Your Order Has Been Placed`;
  const trackingUrl = getTrackingUrl(data);
  const safeCustomer = escapeHtml(data.customerName || 'Customer');
  const safeCanteen = escapeHtml(data.canteenName);
  const safeLocation = escapeHtml(data.canteenLocation || (data as any).pickupLocation || '');
  const safeSlot = escapeHtml(data.pickupSlot || (data as any).pickupTimeWindow || '');
  const items = data.items || [];

  const itemsText = items
    .map((item) => `- ${item.name} x${item.quantity} (₹${(item.subtotal ?? (item.price ? item.price * item.quantity : 0)).toFixed(2)})`)
    .join('\n');

  const text = `
QuickBite — Your Order Has Been Placed

Hello ${data.customerName || 'Customer'},

Thank you for your order! Your order has been placed successfully and has been submitted to the kitchen at ${data.canteenName}.
Please note: Your order is currently awaiting acceptance by canteen staff. We will notify you once the kitchen accepts and starts preparing your meal.

Order Reference: ${data.orderNumber} (ID: ${data.orderId})
Canteen: ${data.canteenName} (${safeLocation})
Requested Pickup Time: ${safeSlot}
Current Status: Submitted (Awaiting Kitchen Acceptance)
Payment Status: ${data.paymentStatus}

Order Summary:
${itemsText}

Subtotal: ₹${Number(data.subtotal || 0).toFixed(2)}
${data.discount ? `Discount: -₹${Number(data.discount).toFixed(2)}\n` : ''}Taxes & Fees: ₹${(Number(data.tax || 0) + Number(data.convenienceFee || 0)).toFixed(2)}
Total Amount: ₹${Number(data.total || 0).toFixed(2)}

Secure Order Tracking:
${trackingUrl}

QUICKBITE — Order Ahead. Skip the Queue.
  `.trim();

  const itemsHtml = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f5f5f4;">
        <td style="padding: 10px 0; color: #1c1917; font-weight: 500;">
          ${escapeHtml(item.name)}
          ${item.notes ? `<br><small style="color: #a8a29e; font-style: italic;">${escapeHtml(item.notes)}</small>` : ''}
        </td>
        <td style="padding: 10px 0; text-align: center; color: #78716c;">x${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; color: #1c1917; font-weight: 600;">₹${Number(item.subtotal ?? (item.price ? item.price * item.quantity : 0)).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.95; font-size: 13px; font-weight: 600;">Order Ahead. Skip the Queue.</p>
    </div>
    <div style="padding: 32px;">
      <div style="display: inline-block; background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
        Order Placed
      </div>
      <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #1c1917;">Your Order Has Been Placed!</h2>
      <p style="color: #44403c; font-size: 14px; margin: 0 0 20px;">
        Hello <strong>${safeCustomer}</strong>, your order has been received by our system and is currently <strong>awaiting acceptance by the kitchen staff</strong> at <strong>${safeCanteen}</strong>.
      </p>

      <!-- Order Metadata Box -->
      <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Order Number:</td>
            <td style="text-align: right; font-weight: 700; font-family: monospace; color: #1c1917;">${escapeHtml(data.orderNumber)}</td>
          </tr>
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Pickup Location:</td>
            <td style="text-align: right; font-weight: 600; color: #1c1917;">${safeCanteen} (${safeLocation})</td>
          </tr>
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Pickup Time:</td>
            <td style="text-align: right; font-weight: 600; color: #ea580c;">${safeSlot}</td>
          </tr>
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Payment Status:</td>
            <td style="text-align: right; font-weight: 700; color: ${data.paymentStatus === 'PAID' || data.paymentStatus === 'COMPLETED' ? '#16a34a' : '#d97706'};">
              ${escapeHtml(data.paymentStatus)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Notice: Awaiting acceptance -->
      <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 13px; color: #166534;">
        <strong>Status:</strong> Your order is queued for review. You will receive an immediate notification as soon as the kitchen staff accepts it.
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 2px solid #e7e5e4; color: #78716c; font-size: 12px; text-transform: uppercase;">
            <th style="padding: 8px 0; text-align: left;">Item</th>
            <th style="padding: 8px 0; text-align: center;">Qty</th>
            <th style="padding: 8px 0; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Order Totals -->
      <div style="background: #f5f5f4; border-radius: 10px; padding: 16px; font-size: 13px; margin-bottom: 28px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
          <span>Subtotal</span>
          <span>₹${data.subtotal.toFixed(2)}</span>
        </div>
        ${data.discount ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #16a34a; font-weight: 600;"><span>Promo Discount</span><span>-₹${data.discount.toFixed(2)}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
          <span>Taxes &amp; Packaging</span>
          <span>₹${(data.tax + data.convenienceFee).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #d6d3d1; padding-top: 8px; font-weight: 800; color: #1c1917; font-size: 16px;">
          <span>Total Amount</span>
          <span style="color: #ea580c;">₹${data.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Tracking Button -->
      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.25);">
          Track Live Order Status &rarr;
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0 0 4px; font-weight: 600;">QUICKBITE &bull; Campus Pre-Order System</p>
      <p style="margin: 0;">Order Reference: ${escapeHtml(data.orderNumber)} | ID: ${escapeHtml(data.orderId)}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// -------------------------------------------------------------
// 2. ORDER RECEIVED BY CANTEEN
// -------------------------------------------------------------
export function renderOrderReceivedEmail(data: OrderEmailData) {
  const subject = `QuickBite — Your Order Has Been Received`;
  const trackingUrl = getTrackingUrl(data);
  const safeCustomer = escapeHtml(data.customerName || 'Customer');
  const safeCanteen = escapeHtml(data.canteenName);

  const itemsText = data.items
    .map((item) => `- ${item.name} x${item.quantity}`)
    .join('\n');

  const text = `
QuickBite — Your Order Has Been Received

Hello ${data.customerName || 'Customer'},

Great news! Authorized staff at ${data.canteenName} have explicitly received and acknowledged your order ticket.

Order Number: ${data.orderNumber}
Items:
${itemsText}
Total: ₹${data.total.toFixed(2)}
Scheduled Pickup Time: ${data.pickupSlot}
Payment Status: ${data.paymentStatus}

Please note: Your order has been acknowledged by the canteen and is preparing to enter the kitchen queue. It is NOT ready for pickup yet. We will send you another update once your food is hot and ready.

Track your order: ${trackingUrl}

QUICKBITE — Order Ahead. Skip the Queue.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.95; font-size: 13px; font-weight: 600;">Order Ahead. Skip the Queue.</p>
    </div>
    <div style="padding: 32px;">
      <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
        Order Received
      </div>
      <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #1c1917;">Canteen Staff Acknowledged Your Order</h2>
      <p style="color: #44403c; font-size: 14px; margin: 0 0 20px;">
        Hello <strong>${safeCustomer}</strong>, authorized canteen staff at <strong>${safeCanteen}</strong> have acknowledged your order ticket.
      </p>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #92400e;">
        <strong>Kitchen Note:</strong> This confirms staff receipt of your order. It is <em>not yet ready for pickup</em>. Please wait for the ready notification before heading to the counter.
      </div>

      <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
        <p style="margin: 0 0 6px;"><strong>Order #:</strong> ${escapeHtml(data.orderNumber)}</p>
        <p style="margin: 0 0 6px;"><strong>Total:</strong> ₹${data.total.toFixed(2)}</p>
        <p style="margin: 0 0 6px;"><strong>Scheduled Pickup Time:</strong> ${escapeHtml(data.pickupSlot)}</p>
        <p style="margin: 0;"><strong>Payment Status:</strong> <span style="font-weight: 700; color: ${data.paymentStatus === 'PAID' ? '#16a34a' : '#d97706'};">${escapeHtml(data.paymentStatus)}</span></p>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
          View Live Tracking
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">QUICKBITE &bull; Campus Pre-Order System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// -------------------------------------------------------------
// 3. ORDER ACCEPTED (Kitchen accepted & preparing)
// -------------------------------------------------------------
export function renderOrderAcceptedEmail(data: OrderEmailData) {
  const subject = `QuickBite — Your Order Has Been Accepted`;
  const trackingUrl = getTrackingUrl(data);
  const safeCustomer = escapeHtml(data.customerName || 'Customer');
  const safeCanteen = escapeHtml(data.canteenName);
  const safeLocation = escapeHtml(data.canteenLocation || (data as any).pickupLocation || '');
  const safeSlot = escapeHtml(data.pickupSlot || (data as any).pickupTimeWindow || '');

  const text = `
QuickBite — Your Order Has Been Accepted

Hello ${data.customerName || 'Customer'},

Your order #${data.orderNumber} has been accepted by the kitchen team at ${data.canteenName}.
The chefs are preparing your meal now.

Pickup Location: ${data.canteenName} (${safeLocation})
Scheduled Slot: ${safeSlot}
${data.estimatedMinutes ? `Estimated Prep Time: ~${data.estimatedMinutes} minutes\n` : ''}Payment Status: ${data.paymentStatus}
Total Amount: ₹${Number(data.total || 0).toFixed(2)}

Track your progress live:
${trackingUrl}

QUICKBITE — Order Ahead. Skip the Queue.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.95; font-size: 13px; font-weight: 600;">Order Ahead. Skip the Queue.</p>
    </div>
    <div style="padding: 32px;">
      <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
        Order Accepted
      </div>
      <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #1c1917;">Order Accepted by Kitchen!</h2>
      <p style="color: #44403c; font-size: 14px; margin: 0 0 20px;">
        Hello <strong>${safeCustomer}</strong>, your order has been accepted by the kitchen team at <strong>${safeCanteen}</strong> and queued for preparation.
      </p>

      <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Order #:</td>
            <td style="text-align: right; font-weight: 700; font-family: monospace;">${escapeHtml(data.orderNumber)}</td>
          </tr>
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Pickup Counter:</td>
            <td style="text-align: right; font-weight: 600;">${safeLocation ? `${safeCanteen} (${safeLocation})` : safeCanteen}</td>
          </tr>
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Pickup Window:</td>
            <td style="text-align: right; font-weight: 600; color: #ea580c;">${safeSlot}</td>
          </tr>
          <tr>
            <td style="color: #78716c; padding: 4px 0;">Payment:</td>
            <td style="text-align: right; font-weight: 700; color: ${data.paymentStatus === 'PAID' ? '#16a34a' : '#d97706'};">
              ${escapeHtml(data.paymentStatus)}
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
          Track Preparation Live
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">QUICKBITE &bull; Campus Pre-Order System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// -------------------------------------------------------------
// 4. ORDER READY FOR PICKUP
// -------------------------------------------------------------
export function renderOrderReadyForPickupEmail(data: OrderEmailData) {
  const subject = `QuickBite — Your Food Is Ready for Pickup!`;
  const trackingUrl = getTrackingUrl(data);
  const safeCustomer = escapeHtml(data.customerName || 'Customer');
  const safeCanteen = escapeHtml(data.canteenName);
  const safeLocation = escapeHtml(data.canteenLocation || (data as any).pickupLocation || '');
  const isPaid = data.paymentStatus === 'PAID' || data.paymentStatus === 'COMPLETED';
  const items = data.items || [];

  const itemsList = items.map((i) => `- ${i.name} x${i.quantity}`).join('\n');

  const paymentInstructionText = isPaid
    ? 'Payment Status: PAID (Payment Verified & Settled. No further payment required.)'
    : 'Payment Status: UNPAID (Payment Due at Counter. Payment is still due before pickup.)';

  const text = `
QuickBite — Your Food Is Ready for Pickup!

Hello ${data.customerName || 'Customer'},

Your food is hot, freshly packaged, and READY for pickup!

Order Number: ${data.orderNumber}
Counter Location: ${data.canteenName} (${safeLocation})
Pickup Verification Code: ${data.pickupToken || ''}

Items Ready:
${itemsList}

${paymentInstructionText}

Pickup Instructions:
1. Proceed to ${safeLocation || data.canteenName}.
2. Present your Counter Pickup Code: ${data.pickupToken || ''}.
3. ${isPaid ? 'Collect your fresh meal with zero wait time!' : 'Complete your outstanding payment (₹' + Number(data.total || 0).toFixed(2) + ') and collect your meal!'}

Important Note: Do not display a payment QR code as proof of payment. Counter staff will verify payment or verify your pickup code.

Open Live Order Pass:
${trackingUrl}

QUICKBITE — Order Ahead. Skip the Queue.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.95; font-size: 14px; font-weight: 700;">🔔 FOOD IS READY FOR PICKUP</p>
    </div>
    <div style="padding: 32px;">
      <div style="display: inline-block; background: #ecfdf5; border: 1px solid #86efac; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
        Ready at Counter
      </div>
      <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #1c1917;">Your Order is Hot &amp; Ready!</h2>
      <p style="color: #44403c; font-size: 14px; margin: 0 0 20px;">
        Hello <strong>${safeCustomer}</strong>, head over to <strong>${safeCanteen}</strong> to collect your order.
      </p>

      <!-- Pickup Token Card -->
      <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Counter Pickup Code</span>
        <div style="font-size: 38px; font-weight: 900; color: #15803d; font-family: monospace; letter-spacing: 4px; margin: 8px 0;">${escapeHtml(data.pickupToken || '')}</div>
        <div style="font-size: 13px; color: #14532d; font-weight: 600;">
          Pickup Counter: <strong>${safeLocation}</strong>
        </div>
      </div>

      <!-- Payment Status Alert Banner -->
      ${
        isPaid
          ? `<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #166534;">
              <strong>&#10003; Payment Verified &amp; Settled: PAID</strong> — No further payment required. Simply present your pickup code!
            </div>`
          : `<div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #92400e;">
              <strong>&#9888; Payment Due at Counter: UNPAID (₹${Number(data.total || 0).toFixed(2)})</strong><br>
              Payment is still due. Payment must be completed and verified at the counter via UPI or Cash before collecting your meal, according to canteen policy.
            </div>`
      }

      <!-- Pickup Instructions -->
      <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
        <h4 style="margin: 0 0 8px; font-size: 13px; color: #1c1917; text-transform: uppercase; letter-spacing: 0.5px;">Pickup Instructions:</h4>
        <ol style="margin: 0; padding-left: 20px; color: #57534e;">
          <li style="margin-bottom: 4px;">Walk up to <strong>${safeLocation || safeCanteen}</strong>.</li>
          <li style="margin-bottom: 4px;">Present your pickup code <strong>${escapeHtml(data.pickupToken || '')}</strong> to staff.</li>
          <li style="margin-bottom: 4px;">${isPaid ? 'Collect your fresh order and enjoy!' : 'Verify and pay ₹' + Number(data.total || 0).toFixed(2) + ' to receive your food.'}</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.25);">
          Open Live Pickup Pass &rarr;
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0 0 4px;">QUICKBITE &bull; Campus Pre-Order System</p>
      <p style="margin: 0; color: #a8a29e;">Please note: A payment QR code is not proof of payment. Counter staff verify transactions directly.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// -------------------------------------------------------------
// 5. ORDER CANCELLED / REJECTED
// -------------------------------------------------------------
export function renderOrderCancelledEmail(data: OrderEmailData) {
  const subject = `QuickBite — Your Order Has Been Cancelled`;
  const trackingUrl = getTrackingUrl(data);
  const safeCustomer = escapeHtml(data.customerName || 'Customer');
  const safeCanteen = escapeHtml(data.canteenName);
  const safeReason = escapeHtml(data.cancellationReason || 'Order was cancelled or could not be fulfilled by the kitchen.');
  const isRefunded = data.paymentStatus === 'REFUNDED' || data.paymentStatus === 'PARTIALLY_REFUNDED';

  const text = `
QuickBite — Your Order Has Been Cancelled

Hello ${data.customerName || 'Customer'},

This email is to notify you that order #${data.orderNumber} at ${data.canteenName} has been cancelled.

Order Reference: ${data.orderNumber}
Canteen: ${data.canteenName}
Reason: ${data.cancellationReason || 'Order was cancelled or could not be fulfilled by the kitchen.'}
${isRefunded ? 'Refund Status: A full refund of ₹' + data.total.toFixed(2) + ' has been processed.\n' : 'Payment Status: ' + data.paymentStatus + '\n'}
Any reserved inventory portions have been restored.

View cancellation details:
${trackingUrl}

If you have any questions, please contact campus support or the canteen desk.

The QUICKBITE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.95; font-size: 13px; font-weight: 600;">Order Status Notice</p>
    </div>
    <div style="padding: 32px;">
      <div style="display: inline-block; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
        Order Cancelled
      </div>
      <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #1c1917;">Order #${escapeHtml(data.orderNumber)} Cancelled</h2>
      <p style="color: #44403c; font-size: 14px; margin: 0 0 20px;">
        Hello <strong>${safeCustomer}</strong>, your order at <strong>${safeCanteen}</strong> has been cancelled.
      </p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #991b1b;">
        <strong>Reason:</strong> ${safeReason}
      </div>

      <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
        <p style="margin: 0 0 6px;"><strong>Order Reference:</strong> ${escapeHtml(data.orderNumber)}</p>
        <p style="margin: 0 0 6px;"><strong>Order Amount:</strong> ₹${data.total.toFixed(2)}</p>
        <p style="margin: 0;"><strong>Payment/Refund Status:</strong> <span style="font-weight: 700; color: #b91c1c;">${escapeHtml(data.paymentStatus)}</span></p>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #57534e; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">
          View Order Record
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">QUICKBITE &bull; Campus Pre-Order System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// -------------------------------------------------------------
// Legacy & Compatibility Email Renderers
// -------------------------------------------------------------
export function renderWelcomeEmail(name: string, appBaseUrl: string) {
  const safeName = escapeHtml(name);
  const subject = `Welcome to QUICKBITE, ${name}! Skip the campus queue 🍔`;
  const text = `
Hello ${name},
Welcome to QUICKBITE — the digital canteen pre-order system for your campus!
Log in: ${appBaseUrl}/login
The QUICKBITE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Campus Digital Canteen</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #1c1917;">Welcome, ${safeName}!</h2>
      <p style="color: #44403c; font-size: 15px;">Pre-order campus meals and skip the lunch lines.</p>
      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${appBaseUrl}/login" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600;">Log In to QUICKBITE</a>
      </div>
      <p style="text-align: center; margin: 12px 0 0; font-size: 13px; color: #78716c;">
        Access your orders anytime: <a href="${appBaseUrl}/customer/dashboard" style="color: #ea580c; text-decoration: underline;">/customer/dashboard</a>
      </p>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">QUICKBITE Campus Pre-Order System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

export function renderPasswordResetEmail(name: string, resetUrl: string, expiresInMinutes = 60) {
  const safeName = escapeHtml(name);
  const subject = `Reset your QUICKBITE password`;
  const text = `Hello ${name},\nReset your password here: ${resetUrl}\nExpires in ${expiresInMinutes} minutes.`.trim();
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #1c1917;">Reset Your Password</h2>
      <p style="color: #44403c; font-size: 15px;">Hello ${safeName}, click below to reset your password:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600;">Reset Password</a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">QUICKBITE Security</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

export function renderOrderConfirmationEmail(data: any) {
  const rendered = renderOrderPlacedEmail(data);
  const tokenStr = data.pickupToken ? `Pickup Token: ${data.pickupToken}` : '';
  return {
    ...rendered,
    subject: `QuickBite — Your Order Has Been Placed (#${data.orderNumber})`,
    text: `${rendered.text}\n${tokenStr}`,
    html: rendered.html.replace(
      '</body>',
      data.pickupToken ? `<p style="text-align:center;font-size:12px;color:#78716c;">Pickup Token: <strong>${escapeHtml(data.pickupToken)}</strong></p></body>` : '</body>'
    ),
  };
}

export function renderOrderReadyEmail(data: any) {
  const rendered = renderOrderReadyForPickupEmail(data);
  return {
    ...rendered,
    subject: `QuickBite — Order #${data.orderNumber} is READY for pickup!`,
  };
}

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
  const html = `<p>Hello ${data.customerName || 'Customer'},</p><p>Status: ${data.status}. ${statusMsg}</p><p><a href="${trackingUrl}">Track Live</a></p>`;
  return { subject, text, html };
}
