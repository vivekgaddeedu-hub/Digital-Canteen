import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  renderOrderPlacedEmail,
  renderOrderReceivedEmail,
  renderOrderAcceptedEmail,
  renderOrderReadyForPickupEmail,
  renderOrderCancelledEmail,
  renderOrderConfirmationEmail,
  renderOrderReadyEmail,
  renderOrderStatusEmail,
  renderWelcomeEmail,
  renderPasswordResetEmail,
  escapeHtml,
  getTrackingUrl,
  OrderEmailData,
} from '../src/lib/email/templates';
import { getEmailConfig } from '../src/lib/email/transporter';
import { sendEmailSafe } from '../src/lib/email/email-service';

describe('Nodemailer Email Infrastructure & Configuration', () => {
  it('reads SMTP configuration from environment with secure defaults', () => {
    const config = getEmailConfig();
    expect(config.host).toBeDefined();
    expect(config.port).toBeTypeOf('number');
    expect(config.fromEmail).toContain('@');
    expect(config.fromName).toBe('QUICKBITE');
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
});

describe('Email Template 1: Order Placed', () => {
  const baseOrderData: OrderEmailData = {
    orderId: 'c7c6888c-e692-411a-b615-56faea2f6542',
    orderNumber: 'QB-20261012-0001',
    customerName: 'Ananya Sharma',
    canteenName: 'North Campus Hub',
    canteenLocation: 'Block A, Ground Floor',
    pickupSlot: '12:30 PM - 12:45 PM',
    pickupToken: 'PK-8821',
    items: [
      { name: 'Paneer Butter Masala Bowl', quantity: 2, price: 150, subtotal: 300, notes: 'Less spicy' },
      { name: 'Mango Lassi', quantity: 1, price: 60, subtotal: 60 },
    ],
    subtotal: 360,
    discount: 36,
    tax: 18,
    convenienceFee: 5,
    total: 347,
    status: 'PLACED',
    paymentStatus: 'UNPAID',
    createdAt: '2026-10-12T06:30:00.000Z',
    appBaseUrl: 'https://quickbite.campus.edu',
    guestTrackingToken: 'sec-tok-9918273645',
  };

  it('renders exact subject, header, customer name, and primary button', () => {
    const { subject, text, html } = renderOrderPlacedEmail(baseOrderData);

    expect(subject).toBe('QuickBite | Your Order Has Been Placed!');
    expect(text).toContain('Your order is on its way to the kitchen!');
    expect(html).toContain('Your order is on its way to the kitchen!');
    expect(text).toContain('Hi Ananya Sharma');
    expect(html).toContain('Ananya Sharma');
    expect(text).toContain("We've received your order request.");
    expect(html).toContain("We've received your order request");
    expect(html).toContain('TRACK MY ORDER');
    expect(text).toContain('TRACK MY ORDER');
  });

  it('displays complete required order summary metadata', () => {
    const { text, html } = renderOrderPlacedEmail(baseOrderData);

    // Order number & UUID
    expect(text).toContain('QB-20261012-0001');
    expect(html).toContain('QB-20261012-0001');
    expect(text).toContain('c7c6888c-e692-411a-b615-56faea2f6542');
    expect(html).toContain('c7c6888c-e692-411a-b615-56faea2f6542');

    // Pickup ID & Canteen
    expect(text).toContain('PK-8821');
    expect(html).toContain('PK-8821');
    expect(text).toContain('North Campus Hub');
    expect(html).toContain('North Campus Hub');

    // Food items, quantities, item prices, total amount
    expect(text).toContain('Paneer Butter Masala Bowl x2');
    expect(text).toContain('Mango Lassi x1');
    expect(text).toContain('₹347.00');
    expect(html).toContain('₹347.00');

    // Requested pickup time & statuses
    expect(text).toContain('12:30 PM - 12:45 PM');
    expect(html).toContain('12:30 PM - 12:45 PM');
    expect(text).toContain('Current Order Status: PLACED');
    expect(text).toContain('Payment Status: UNPAID');

    // Footer
    expect(text).toContain('Thank you for choosing QUICKBITE!');
    expect(html).toContain('Thank you for choosing QUICKBITE!');
  });

  it('embeds secure tracking URL as clickable link and plain-text URL', () => {
    const { text, html } = renderOrderPlacedEmail(baseOrderData);
    const expectedUrl =
      'https://quickbite.campus.edu/track-order/c7c6888c-e692-411a-b615-56faea2f6542?token=sec-tok-9918273645';

    expect(text).toContain(expectedUrl);
    expect(html).toContain(`href="${expectedUrl}"`);
  });
});

describe('Email Template 2: Order Received', () => {
  const orderData: OrderEmailData = {
    orderId: 'b5b55555-4444-3333-2222-111111111111',
    orderNumber: 'QB-20261012-0002',
    customerName: 'Dev Patel',
    canteenName: 'Student Centre Cafeteria',
    canteenLocation: 'Food Pavilion 2',
    pickupSlot: '1:00 PM - 1:15 PM',
    pickupToken: 'PK-4029',
    items: [
      { name: 'Veg Hakka Noodles', quantity: 1, price: 120, subtotal: 120 },
      { name: 'Chilli Paneer Dry', quantity: 1, price: 160, subtotal: 160 },
    ],
    subtotal: 280,
    tax: 14,
    convenienceFee: 5,
    total: 299,
    status: 'RECEIVED',
    paymentStatus: 'PAID',
    appBaseUrl: 'http://localhost:3000',
  };

  it('renders exact subject, header, customer greeting, and button', () => {
    const { subject, text, html } = renderOrderReceivedEmail(orderData);

    expect(subject).toBe('QuickBite | The Canteen Has Received Your Order');
    expect(text).toContain('Your order has reached the canteen!');
    expect(html).toContain('Your order has reached the canteen!');
    expect(text).toContain('Hi Dev Patel');
    expect(html).toContain('Dev Patel');
    expect(text).toContain('The canteen has received your order and is reviewing it.');
    expect(html).toContain('The canteen has received your order and is reviewing it.');
    expect(html).toContain('CHECK ORDER STATUS');
    expect(text).toContain('CHECK ORDER STATUS');
  });

  it('displays required order metadata and items', () => {
    const { text, html } = renderOrderReceivedEmail(orderData);

    expect(text).toContain('QB-20261012-0002');
    expect(text).toContain('b5b55555-4444-3333-2222-111111111111');
    expect(text).toContain('PK-4029');
    expect(text).toContain('Veg Hakka Noodles x1');
    expect(text).toContain('₹299.00');
    expect(text).toContain('1:00 PM - 1:15 PM');
    expect(text).toContain('Food Pavilion 2');
    expect(html).toContain('Food Pavilion 2');
    expect(text).toContain('Payment Status: PAID');
    expect(html).toContain('http://localhost:3000/track-order/b5b55555-4444-3333-2222-111111111111');
  });
});

describe('Email Template 3: Order Accepted', () => {
  const acceptedDataWithPrepTime: OrderEmailData = {
    orderId: 'a1a1a1a1-2222-3333-4444-555555555555',
    orderNumber: 'QB-20261012-0003',
    customerName: 'Priya Verma',
    canteenName: 'Central Food Court',
    canteenLocation: 'Counter 3',
    pickupSlot: '1:30 PM - 1:45 PM',
    pickupToken: 'PK-7744',
    items: [{ name: 'Masala Dosa', quantity: 2, price: 90, subtotal: 180 }],
    subtotal: 180,
    tax: 9,
    convenienceFee: 5,
    total: 194,
    status: 'ACCEPTED',
    paymentStatus: 'UNPAID',
    estimatedMinutes: 15,
    appBaseUrl: 'http://localhost:3000',
  };

  it('renders exact subject, header, body copy, and button', () => {
    const { subject, text, html } = renderOrderAcceptedEmail(acceptedDataWithPrepTime);

    expect(subject).toBe('QuickBite | Your Order Has Been Accepted!');
    expect(text).toContain('Great news! Your order has been accepted.');
    expect(html).toContain('Great news! Your order has been accepted.');
    expect(text).toContain('The canteen has accepted your QUICKBITE order.');
    expect(html).toContain('The canteen has accepted your <strong>QUICKBITE</strong> order.');
    expect(html).toContain('TRACK YOUR ORDER');
    expect(text).toContain('TRACK YOUR ORDER');
  });

  it('displays estimated prep time when provided', () => {
    const { text, html } = renderOrderAcceptedEmail(acceptedDataWithPrepTime);
    expect(text).toContain('Estimated Preparation Time: ~15 minutes');
    expect(html).toContain('~15 mins');
  });

  it('omits estimated prep time when unavailable without inventing estimates', () => {
    const noPrepTimeData: OrderEmailData = {
      ...acceptedDataWithPrepTime,
      estimatedMinutes: null,
    };
    const { text, html } = renderOrderAcceptedEmail(noPrepTimeData);
    expect(text).not.toContain('Estimated Preparation Time');
    expect(html).not.toContain('Estimated Prep Time');
  });

  it('displays "Payment is still pending." when payment is unpaid', () => {
    const { text, html } = renderOrderAcceptedEmail(acceptedDataWithPrepTime);
    expect(text).toContain('Payment is still pending.');
    expect(html).toContain('Payment is still pending.');
  });

  it('does not display payment pending notice when payment is completed', () => {
    const paidData: OrderEmailData = {
      ...acceptedDataWithPrepTime,
      paymentStatus: 'PAID',
    };
    const { text, html } = renderOrderAcceptedEmail(paidData);
    expect(text).not.toContain('Payment is still pending.');
    expect(html).not.toContain('Payment is still pending.');
  });
});

describe('Email Template 4: Order Ready For Pickup', () => {
  const readyDataUnpaid: OrderEmailData = {
    orderId: 'f9f9f9f9-8888-7777-6666-555555555555',
    orderNumber: 'QB-20261012-0004',
    customerName: 'Karan Mehra',
    canteenName: 'Engineering Cafe',
    canteenLocation: 'Dispatch Counter 1',
    pickupSlot: '2:00 PM - 2:15 PM',
    pickupToken: 'PK-9912',
    items: [{ name: 'Chicken Biryani Box', quantity: 1, price: 220, subtotal: 220 }],
    subtotal: 220,
    tax: 11,
    convenienceFee: 5,
    total: 236,
    status: 'READY',
    paymentStatus: 'UNPAID',
    readyAt: '2026-10-12T08:15:00.000Z',
    appBaseUrl: 'http://localhost:3000',
  };

  it('renders exact subject, header, body copy, and button', () => {
    const { subject, text, html } = renderOrderReadyForPickupEmail(readyDataUnpaid);

    expect(subject).toBe('QuickBite | Your Food Is Ready for Pickup!');
    expect(text).toContain('Your food is ready!');
    expect(html).toContain('Your food is ready!');
    expect(text).toContain('Your QUICKBITE order is ready for collection.');
    expect(html).toContain('Your <strong>QUICKBITE</strong> order is ready for collection.');
    expect(html).toContain('VIEW PICKUP DETAILS');
    expect(text).toContain('VIEW PICKUP DETAILS');
  });

  it('displays pickup ID, counter instructions, and pending payment policy notice', () => {
    const { text, html } = renderOrderReadyForPickupEmail(readyDataUnpaid);

    expect(text).toContain('PK-9912');
    expect(html).toContain('PK-9912');
    expect(text).toContain(
      'Show your pickup ID or the pickup QR code to authorized canteen staff when collecting your order.'
    );
    expect(html).toContain(
      'Show your pickup ID or the pickup QR code to authorized canteen staff when collecting your order.'
    );
    expect(text).toContain(
      "Payment must be completed and verified according to the canteen's payment policy before collection."
    );
    expect(html).toContain(
      "Payment must be completed and verified according to the canteen&#39;s payment policy before collection."
    );
  });

  it('displays "Payment confirmed." when payment status is paid', () => {
    const readyDataPaid: OrderEmailData = {
      ...readyDataUnpaid,
      paymentStatus: 'PAID',
    };
    const { text, html } = renderOrderReadyForPickupEmail(readyDataPaid);
    expect(text).toContain('Payment confirmed.');
    expect(html).toContain('Payment confirmed.');
    expect(text).not.toContain(
      "Payment must be completed and verified according to the canteen's payment policy"
    );
  });
});

describe('Security, Edge Cases & Data Sanitization', () => {
  it('escapes dangerous HTML special characters to prevent XSS injection', () => {
    const maliciousInput = '<script>alert("hacked")</script>&"\'';
    const escaped = escapeHtml(maliciousInput);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&#39;');
  });

  it('safely handles missing optional order fields without crashing', () => {
    const minimalOrder: OrderEmailData = {
      orderId: 'uuid-1234',
      orderNumber: 'QB-MIN',
      customerName: '',
      canteenName: 'Main Canteen',
      pickupSlot: '',
      pickupToken: '',
      items: [],
      subtotal: 0,
      tax: 0,
      convenienceFee: 0,
      total: 0,
      status: 'PLACED',
      paymentStatus: 'PENDING',
      appBaseUrl: 'http://localhost:3000',
    };

    const placed = renderOrderPlacedEmail(minimalOrder);
    expect(placed.subject).toBeDefined();
    expect(placed.html).toContain('Customer');

    const received = renderOrderReceivedEmail(minimalOrder);
    expect(received.subject).toBeDefined();

    const accepted = renderOrderAcceptedEmail(minimalOrder);
    expect(accepted.subject).toBeDefined();

    const ready = renderOrderReadyForPickupEmail(minimalOrder);
    expect(ready.subject).toBeDefined();
  });

  it('properly generates guest tracking URL with token parameter', () => {
    const url = getTrackingUrl({
      appBaseUrl: 'https://campus.quickbite.io/',
      orderId: '1234-5678',
      guestTrackingToken: 'secret_token_abc123',
    });
    expect(url).toBe('https://campus.quickbite.io/track-order/1234-5678?token=secret_token_abc123');
  });

  it('properly generates authenticated tracking URL without token parameter', () => {
    const url = getTrackingUrl({
      appBaseUrl: 'https://campus.quickbite.io',
      orderId: '1234-5678',
    });
    expect(url).toBe('https://campus.quickbite.io/track-order/1234-5678');
  });

  it('validates guest tracking token hashing with SHA-256', () => {
    const rawToken = 'guest_tracking_secure_token_xyz_9988';
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

    expect(hash).toHaveLength(64);
    const verifyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(verifyHash).toBe(hash);

    const wrongHash = crypto.createHash('sha256').update('wrong_token').digest('hex');
    expect(wrongHash).not.toBe(hash);
  });

  it('renders order cancelled template with reason', () => {
    const cancelled = renderOrderCancelledEmail({
      orderId: 'cancel-uuid-1',
      orderNumber: 'QB-20261012-9999',
      customerName: 'Samir',
      canteenName: 'Central Hub',
      pickupSlot: '12:00',
      pickupToken: 'PK-0001',
      items: [],
      subtotal: 100,
      tax: 5,
      convenienceFee: 2,
      total: 107,
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      cancellationReason: 'Kitchen out of fresh dairy ingredients.',
      appBaseUrl: 'http://localhost:3000',
    });

    expect(cancelled.subject).toContain('Has Been Cancelled');
    expect(cancelled.text).toContain('Kitchen out of fresh dairy ingredients.');
    expect(cancelled.html).toContain('Kitchen out of fresh dairy ingredients.');
  });
});

describe('Lifecycle Simulation & Backward Compatibility', () => {
  it('preserves backwards-compatible renderOrderConfirmationEmail and renderOrderReadyEmail aliases', () => {
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

    const confirmation = renderOrderConfirmationEmail(orderData);
    expect(confirmation.subject).toContain('#QB-20261010-0042');
    expect(confirmation.text).toContain('Paneer Rice Bowl x1');
    expect(confirmation.text).toContain('PK-4491');

    const ready = renderOrderReadyEmail({
      ...orderData,
      canteenLocation: 'Student Union, Counter 2',
    });
    expect(ready.subject).toContain('READY for pickup');
    expect(ready.text).toContain('Student Union, Counter 2');
    expect(ready.html).toContain('Counter Pickup Code');
  });

  it('safely dispatches emails without throwing even if transport experiences an issue', async () => {
    const result = await sendEmailSafe(
      'customer@campus.edu',
      'QuickBite | Safe Test Dispatch',
      'Test message content',
      '<p>Test message content</p>'
    );
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
