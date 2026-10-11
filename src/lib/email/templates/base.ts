/**
 * Reusable Base Email Layout and Components for QUICKBITE
 * Brand: QUICKBITE | Tagline: "Order Ahead. Skip the Queue."
 * Accent Color: #ea580c (Orange) | Background: Clean White / Stone Neutral
 */

export interface OrderEmailItem {
  name: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  subtotal: number;
  notes?: string | null;
}

export interface OrderEmailData {
  orderId: string; // Order UUID
  orderNumber: string; // E.g. QB-20261012-0042
  customerName: string;
  canteenName: string;
  canteenLocation?: string;
  pickupSlot: string; // Requested pickup time
  pickupToken: string; // Pickup ID
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
  createdAt?: string | Date;
  readyAt?: string | Date;
  estimatedMinutes?: number | null;
  pickupInstructions?: string | null;
  cancellationReason?: string | null;
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatCurrency(amount: number | undefined | null): string {
  const val = Number(amount || 0);
  return `₹${val.toFixed(2)}`;
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(date);
  }
}

export function getTrackingUrl(data: {
  appBaseUrl: string;
  orderId: string;
  guestTrackingToken?: string | null;
}): string {
  const baseUrl = (data.appBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  if (data.guestTrackingToken) {
    return `${baseUrl}/track-order/${data.orderId}?token=${encodeURIComponent(data.guestTrackingToken)}`;
  }
  return `${baseUrl}/track-order/${data.orderId}`;
}

export const emailStyles = {
  body: `
    margin: 0;
    padding: 0;
    background-color: #fafaf9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1c1917;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  `,
  container: `
    max-width: 600px;
    margin: 24px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e7e5e4;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  `,
  brandHeader: `
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
    color: #ffffff;
    padding: 28px 32px 24px;
    text-align: center;
  `,
  brandName: `
    margin: 0;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
    text-transform: uppercase;
  `,
  brandTagline: `
    margin: 4px 0 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.95);
  `,
  content: `
    padding: 32px 28px;
    background: #ffffff;
  `,
  badge: (bg: string, border: string, text: string) => `
    display: inline-block;
    background-color: ${bg};
    border: 1px solid ${border};
    color: ${text};
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  `,
  heading: `
    font-size: 22px;
    font-weight: 800;
    line-height: 1.3;
    margin: 0 0 12px;
    color: #1c1917;
  `,
  bodyText: `
    font-size: 15px;
    color: #44403c;
    margin: 0 0 20px;
    line-height: 1.6;
  `,
  metaCard: `
    background-color: #fafaf9;
    border: 1px solid #e7e5e4;
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 24px;
  `,
  button: `
    display: inline-block;
    background-color: #ea580c;
    color: #ffffff;
    text-decoration: none;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.5px;
    padding: 14px 32px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
  `,
  footer: `
    background-color: #f5f5f4;
    color: #78716c;
    padding: 24px 28px;
    text-align: center;
    font-size: 12px;
    border-top: 1px solid #e7e5e4;
    line-height: 1.6;
  `,
};

/**
 * Standard Email Shell
 */
export function renderEmailShell(options: {
  badgeLabel?: string;
  badgeBg?: string;
  badgeBorder?: string;
  badgeColor?: string;
  headerTitle: string;
  contentHtml: string;
  footerNote?: string;
}): string {
  const {
    badgeLabel,
    badgeBg = '#fff7ed',
    badgeBorder = '#fed7aa',
    badgeColor = '#c2410c',
    headerTitle,
    contentHtml,
    footerNote = 'Thank you for choosing QUICKBITE!',
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(headerTitle)}</title>
</head>
<body style="${emailStyles.body}">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafaf9; padding: 20px 10px;">
    <tr>
      <td align="center">
        <div style="${emailStyles.container}">
          <!-- Brand Header -->
          <div style="${emailStyles.brandHeader}">
            <h1 style="${emailStyles.brandName}">QUICKBITE</h1>
            <p style="${emailStyles.brandTagline}">Order Ahead. Skip the Queue.</p>
          </div>

          <!-- Main Body -->
          <div style="${emailStyles.content}">
            ${
              badgeLabel
                ? `<div style="${emailStyles.badge(badgeBg, badgeBorder, badgeColor)}">${escapeHtml(badgeLabel)}</div>`
                : ''
            }
            <h2 style="${emailStyles.heading}">${escapeHtml(headerTitle)}</h2>
            ${contentHtml}
          </div>

          <!-- Footer -->
          <div style="${emailStyles.footer}">
            <p style="margin: 0 0 6px; font-weight: 700; color: #44403c; font-size: 13px;">${escapeHtml(footerNote)}</p>
            <p style="margin: 0 0 4px;">QUICKBITE &bull; Digital Campus Food Ordering</p>
            <p style="margin: 0; color: #a8a29e; font-size: 11px;">Order Ahead. Skip the Queue.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Render items table
 */
export function renderItemsHtml(items: OrderEmailItem[]): string {
  if (!items || items.length === 0) return '';

  const rows = items
    .map((item) => {
      const unit = item.price ?? item.unitPrice ?? (item.quantity > 0 ? item.subtotal / item.quantity : 0);
      return `
        <tr style="border-bottom: 1px solid #f5f5f4;">
          <td style="padding: 10px 0; color: #1c1917; font-weight: 500;">
            ${escapeHtml(item.name)}
            ${item.notes ? `<br><small style="color: #a8a29e; font-style: italic;">${escapeHtml(item.notes)}</small>` : ''}
          </td>
          <td style="padding: 10px 0; text-align: center; color: #78716c; font-weight: 600;">x${item.quantity}</td>
          <td style="padding: 10px 0; text-align: right; color: #78716c;">${formatCurrency(unit)}</td>
          <td style="padding: 10px 0; text-align: right; color: #1c1917; font-weight: 600;">${formatCurrency(item.subtotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
      <thead>
        <tr style="border-bottom: 2px solid #e7e5e4; color: #78716c; font-size: 11px; text-transform: uppercase;">
          <th style="padding: 8px 0; text-align: left;">Item</th>
          <th style="padding: 8px 0; text-align: center;">Qty</th>
          <th style="padding: 8px 0; text-align: right;">Price</th>
          <th style="padding: 8px 0; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Render totals breakdown
 */
export function renderTotalsHtml(data: {
  subtotal: number;
  discount?: number;
  tax: number;
  convenienceFee: number;
  total: number;
}): string {
  const taxesAndFees = (Number(data.tax || 0) + Number(data.convenienceFee || 0));
  return `
    <div style="background: #f5f5f4; border-radius: 10px; padding: 14px 16px; font-size: 13px; margin: 16px 0 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
        <span>Subtotal</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${
        data.discount && data.discount > 0
          ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #16a34a; font-weight: 600;">
              <span>Promo Discount</span>
              <span>-${formatCurrency(data.discount)}</span>
            </div>`
          : ''
      }
      ${
        taxesAndFees > 0
          ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
              <span>Taxes &amp; Fees</span>
              <span>${formatCurrency(taxesAndFees)}</span>
            </div>`
          : ''
      }
      <div style="display: flex; justify-content: space-between; border-top: 1px solid #d6d3d1; padding-top: 8px; font-weight: 800; color: #1c1917; font-size: 15px;">
        <span>Total Amount</span>
        <span style="color: #ea580c;">${formatCurrency(data.total)}</span>
      </div>
    </div>
  `;
}
