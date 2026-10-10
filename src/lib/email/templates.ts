export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  canteenName: string;
  pickupSlot: string;
  pickupToken: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  convenienceFee: number;
  total: number;
  status: string;
  specialInstructions?: string | null;
  appBaseUrl: string;
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
  padding: 24px 32px;
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

// 1. Welcome Email
export function renderWelcomeEmail(name: string, appBaseUrl: string) {
  const subject = `Welcome to QUICKBITE, ${name}! Skip the campus queue 🍔`;
  const text = `
Hello ${name},

Welcome to QUICKBITE — the digital canteen pre-order system for your campus!

With QUICKBITE, you can:
- Browse menus across all campus canteens in real time.
- Pre-order your meals and customize your items.
- Reserve a dedicated pickup time slot.
- Skip lunch rush lines and pick up your hot food using your unique pickup code.

Log in to your account and explore today's menu:
${appBaseUrl}/login

Bon Appétit!
The QUICKBITE Campus Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Campus Digital Canteen</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #1c1917;">Welcome aboard, ${name}!</h2>
      <p style="color: #44403c; font-size: 15px;">We are excited to have you on QUICKBITE. Say goodbye to waiting in long queues between classes!</p>
      
      <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 8px; font-size: 15px; color: #9a3412;">What you can do with QUICKBITE:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #7c2d12; font-size: 14px;">
          <li style="margin-bottom: 6px;">Browse real-time menus across all campus canteens</li>
          <li style="margin-bottom: 6px;">Pre-order artisanal meals and specialty beverages</li>
          <li style="margin-bottom: 6px;">Pick up your food at your chosen slot with zero queueing</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${appBaseUrl}/customer/dashboard" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);">
          Go to Your Dashboard
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0 0 6px;">QUICKBITE Campus Pre-Order System</p>
      <p style="margin: 0;">This email was sent to ${name}. If you did not create this account, please contact campus support.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// 2. Password Reset Email
export function renderPasswordResetEmail(name: string, resetUrl: string, expiresInMinutes = 60) {
  const subject = `Reset your QUICKBITE password`;
  const text = `
Hello ${name},

We received a request to reset the password for your QUICKBITE account.

Click the following link to set a new password:
${resetUrl}

This link is valid for ${expiresInMinutes} minutes and can only be used once.

If you did not request this password reset, you can safely ignore this email. Your current password remains secure.

The QUICKBITE Security Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Password Reset Request</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #1c1917;">Reset Your Password</h2>
      <p style="color: #44403c; font-size: 15px;">Hello ${name}, we received a request to reset your QUICKBITE password. Click the button below to choose a new password:</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(234, 88, 12, 0.3);">
          Reset Password
        </a>
      </div>

      <p style="color: #78716c; font-size: 13px; line-height: 1.5;">
        This link will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request a password reset, no further action is required.
      </p>
      <p style="color: #a8a29e; font-size: 12px; word-break: break-all;">
        Alternative link: <a href="${resetUrl}" style="color: #ea580c;">${resetUrl}</a>
      </p>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">QUICKBITE Security &bull; campus canteen</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// 3. Order Confirmation Email
export function renderOrderConfirmationEmail(data: OrderEmailData) {
  const subject = `Order Confirmed #${data.orderNumber} - ${data.canteenName}`;
  const trackingUrl = `${data.appBaseUrl}/orders/${data.orderNumber}`;

  const itemsText = data.items
    .map((item) => `- ${item.name} x${item.quantity} (₹${item.subtotal.toFixed(2)})`)
    .join('\n');

  const text = `
Order Confirmation #${data.orderNumber}
Canteen: ${data.canteenName}
Customer: ${data.customerName}
Pickup Slot: ${data.pickupSlot}
Pickup Token: ${data.pickupToken}

Items:
${itemsText}

Subtotal: ₹${data.subtotal.toFixed(2)}
${data.discount ? `Discount: -₹${data.discount.toFixed(2)}\n` : ''}Tax: ₹${data.tax.toFixed(2)}
Convenience Fee: ₹${data.convenienceFee.toFixed(2)}
Total Amount: ₹${data.total.toFixed(2)}

Track your order: ${trackingUrl}

Thank you for choosing QUICKBITE!
  `.trim();

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #f5f5f4;">
        <td style="padding: 10px 0; color: #1c1917; font-weight: 500;">${item.name}</td>
        <td style="padding: 10px 0; text-align: center; color: #78716c;">x${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; color: #1c1917; font-weight: 600;">₹${item.subtotal.toFixed(2)}</td>
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
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Order Confirmed &bull; #${data.orderNumber}</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #1c1917;">Thank you, ${data.customerName}!</h2>
      <p style="color: #44403c; font-size: 14px;">Your order has been received by <strong>${data.canteenName}</strong>.</p>

      <!-- Pickup Card -->
      <div style="background: #fff7ed; border: 1px dashed #ea580c; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
        <div style="font-size: 12px; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px;">Pickup Verification Token</div>
        <div style="font-size: 32px; font-weight: 900; color: #ea580c; letter-spacing: 3px; margin: 6px 0;">${data.pickupToken}</div>
        <div style="font-size: 13px; color: #7c2d12;">Reserved Slot: <strong>${data.pickupSlot}</strong></div>
      </div>

      <!-- Item Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
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
      <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin-top: 16px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
          <span>Subtotal</span>
          <span>₹${data.subtotal.toFixed(2)}</span>
        </div>
        ${
          data.discount
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #16a34a; font-weight: 600;">
                <span>Discount</span>
                <span>-₹${data.discount.toFixed(2)}</span>
              </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
          <span>Taxes & Fees</span>
          <span>₹${(data.tax + data.convenienceFee).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #d6d3d1; padding-top: 8px; font-weight: 700; color: #1c1917; font-size: 16px;">
          <span>Total Paid</span>
          <span>₹${data.total.toFixed(2)}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
          View Live Order Status
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">Show your pickup token <strong>${data.pickupToken}</strong> at the counter when your food is ready.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// 4. Order Ready for Pickup Email
export function renderOrderReadyEmail(data: {
  orderNumber: string;
  customerName: string;
  canteenName: string;
  canteenLocation: string;
  pickupToken: string;
  appBaseUrl: string;
}) {
  const subject = `Your order is READY for pickup! #${data.orderNumber} - ${data.canteenName}`;
  const trackingUrl = `${data.appBaseUrl}/orders/${data.orderNumber}`;

  const text = `
Good news ${data.customerName}!

Your order #${data.orderNumber} is freshly prepared and READY for collection.

Canteen: ${data.canteenName}
Location: ${data.canteenLocation}
Your Pickup Token: ${data.pickupToken}

Please head over to the counter and show your pickup token (${data.pickupToken}) to collect your food.

Track details: ${trackingUrl}

Enjoy your meal!
The QUICKBITE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 24px 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.95; font-size: 15px; font-weight: 600;">🔔 ORDER READY FOR PICKUP</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #1c1917;">Your Food is Hot & Ready!</h2>
      <p style="color: #44403c; font-size: 15px;">Hello ${data.customerName}, the kitchen at <strong>${data.canteenName}</strong> has completed your order.</p>

      <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <div style="font-size: 13px; font-weight: 700; color: #15803d; text-transform: uppercase;">Counter Pickup Code</div>
        <div style="font-size: 36px; font-weight: 900; color: #16a34a; letter-spacing: 4px; margin: 8px 0;">${data.pickupToken}</div>
        <div style="font-size: 14px; color: #166534; font-weight: 500;">
          Pickup Counter: <strong>${data.canteenLocation}</strong>
        </div>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
          Open Order Pass
        </a>
      </div>
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">QUICKBITE &bull; Fresh &bull; Fast &bull; Campus Pre-Order</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

// 5. Order Status Update Email (Accepted, Preparing, Cancelled)
export function renderOrderStatusEmail(data: {
  orderNumber: string;
  customerName: string;
  canteenName: string;
  status: string;
  statusMessage: string;
  reason?: string | null;
  appBaseUrl: string;
}) {
  const isCancelled = data.status === 'CANCELLED' || data.status === 'REJECTED';
  const subject = `Order #${data.orderNumber} Update: ${data.status}`;
  const trackingUrl = `${data.appBaseUrl}/orders/${data.orderNumber}`;

  const text = `
Hello ${data.customerName},

Update on order #${data.orderNumber} at ${data.canteenName}:
Status: ${data.status}
${data.statusMessage}
${data.reason ? `Reason: ${data.reason}\n` : ''}

View details: ${trackingUrl}

The QUICKBITE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${baseStyles}">
  <div style="${containerStyles}">
    <div style="${isCancelled ? 'background: #dc2626; color: #ffffff;' : headerStyles}">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">QUICKBITE</h1>
      <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Order Status Update &bull; #${data.orderNumber}</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #1c1917;">Status: ${data.status}</h2>
      <p style="color: #44403c; font-size: 15px;">${data.statusMessage}</p>
      ${
        data.reason
          ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0; color: #991b1b; font-size: 14px;">
              <strong>Note / Reason:</strong> ${data.reason}
            </div>`
          : ''
      }

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
          View Order
        </a>
      </div>
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
