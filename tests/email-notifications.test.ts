import { describe, it, expect } from 'vitest';
import {
  renderWelcomeEmail,
  renderPasswordResetEmail,
  renderOrderConfirmationEmail,
  renderOrderReadyEmail,
  renderOrderStatusEmail,
} from '../src/lib/email/templates';
import { getEmailConfig } from '../src/lib/email/transporter';
import { sendEmailSafe } from '../src/lib/email/email-service';

describe('Nodemailer Email Infrastructure & Templates', () => {
  it('reads SMTP configuration from environment with secure defaults', () => {
    const config = getEmailConfig();
    expect(config.host).toBeDefined();
    expect(config.port).toBeTypeOf('number');
    expect(config.fromEmail).toContain('@');
    expect(config.appBaseUrl).toBeDefined();
  });

  it('renders brand-aligned welcome email with HTML and plain text', () => {
    const { subject, text, html } = renderWelcomeEmail('Alex', 'http://localhost:3000');
    expect(subject).toContain('Welcome to QUICKBITE');
    expect(text).toContain('Hello Alex');
    expect(text).toContain('http://localhost:3000/login');
    expect(html).toContain('QUICKBITE');
    expect(html).toContain('Alex');
    expect(html).toContain('/customer/dashboard');
  });

  it('renders password reset email with secure single-use URL', () => {
    const resetUrl = 'http://localhost:3000/reset-password?token=abcdef123456';
    const { subject, text, html } = renderPasswordResetEmail('Sarah', resetUrl, 60);

    expect(subject).toContain('Reset your QUICKBITE password');
    expect(text).toContain(resetUrl);
    expect(text).toContain('60 minutes');
    expect(html).toContain(resetUrl);
    expect(html).toContain('Reset Password');
  });

  it('renders complete order confirmation with line items and pickup token', () => {
    const orderData = {
      orderNumber: 'QB-20261010-0042',
      customerName: 'Marcus',
      canteenName: 'Central Food Court',
      pickupSlot: '12:30 - 12:45',
      pickupToken: 'PK-4491',
      items: [
        { name: 'Paneer Rice Bowl', quantity: 1, price: 180, subtotal: 180 },
        { name: 'Cold Brew Coffee', quantity: 2, price: 60, subtotal: 120 },
      ],
      subtotal: 300,
      discount: 30,
      tax: 13.5,
      convenienceFee: 5,
      total: 288.5,
      status: 'PLACED',
      appBaseUrl: 'http://localhost:3000',
    };

    const { subject, text, html } = renderOrderConfirmationEmail(orderData);

    expect(subject).toContain('#QB-20261010-0042');
    expect(text).toContain('Paneer Rice Bowl x1');
    expect(text).toContain('Cold Brew Coffee x2');
    expect(text).toContain('PK-4491');
    expect(text).toContain('288.50');
    expect(html).toContain('PK-4491');
    expect(html).toContain('Central Food Court');
    expect(html).toContain('-₹30.00');
  });

  it('renders ready-for-pickup email with pickup token code and instructions', () => {
    const { subject, text, html } = renderOrderReadyEmail({
      orderNumber: 'QB-20261010-0042',
      customerName: 'Marcus',
      canteenName: 'Central Food Court',
      canteenLocation: 'Student Union, Counter 2',
      pickupToken: 'PK-4491',
      appBaseUrl: 'http://localhost:3000',
    });

    expect(subject).toContain('READY for pickup');
    expect(text).toContain('PK-4491');
    expect(text).toContain('Student Union, Counter 2');
    expect(html).toContain('PK-4491');
    expect(html).toContain('Counter Pickup Code');
  });

  it('renders order status updates for kitchen states', () => {
    const { subject, text, html } = renderOrderStatusEmail({
      orderNumber: 'QB-20261010-0042',
      customerName: 'Marcus',
      canteenName: 'Central Food Court',
      status: 'PREPARING',
      statusMessage: 'The kitchen chefs are actively preparing your hot meal.',
      appBaseUrl: 'http://localhost:3000',
    });

    expect(subject).toContain('PREPARING');
    expect(text).toContain('actively preparing');
    expect(html).toContain('PREPARING');
  });

  it('safe email dispatch handles transport gracefully without throwing', async () => {
    const result = await sendEmailSafe(
      'student@campus.edu',
      'Test Subject',
      'Test plain text',
      '<p>Test HTML</p>'
    );
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
