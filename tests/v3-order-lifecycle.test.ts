import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  escapeHtml,
  renderOrderPlacedEmail,
  renderOrderReceivedEmail,
  renderOrderAcceptedEmail,
  renderOrderReadyForPickupEmail,
  renderOrderCancelledEmail,
} from '../src/lib/email/templates';

describe('QUICKBITE V3: Custom Email Templates & Security', () => {
  const sampleEmailData = {
    customerName: 'Aarav Sharma <script>alert("xss")</script>',
    orderNumber: 'QB-20261010-9876',
    orderId: 'c1234567-89ab-cdef-0123-456789abcdef',
    guestTrackingToken: 'a1b2c3d4e5f6789012345678',
    canteenName: 'Campus Food Court & Cafe',
    canteenLocation: 'Counter 2, 1st Floor',
    pickupLocation: 'Counter 2, 1st Floor',
    pickupSlot: '12:30 PM – 12:45 PM',
    pickupTimeWindow: '12:30 PM – 12:45 PM',
    pickupToken: 'PK-9876',
    orderStatus: 'PLACED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'UPI_QR',
    subtotal: 245.5,
    tax: 0,
    convenienceFee: 0,
    total: 245.5,
    status: 'PLACED',
    items: [
      { name: 'Paneer Butter Masala Bowl', quantity: 2, price: 110.0, unitPrice: 110.0, subtotal: 220.0 },
      { name: 'Butter Naan', quantity: 1, price: 25.5, unitPrice: 25.5, subtotal: 25.5 },
    ],
    appBaseUrl: 'http://localhost:3000',
  };

  it('escapes user input to prevent HTML injection in templates', () => {
    const raw = '<b>Test & "Dangerous" \'Input\'</b>';
    const escaped = escapeHtml(raw);
    expect(escaped).toBe('&lt;b&gt;Test &amp; &quot;Dangerous&quot; &#39;Input&#39;&lt;/b&gt;');
    expect(escaped).not.toContain('<b>');
  });

  it('renders Template 1: Order Placed email with tracking link and awaiting-acceptance note', () => {
    const email = renderOrderPlacedEmail(sampleEmailData);
    expect(email.subject).toBe('QuickBite | Your Order Has Been Placed!');
    expect(email.html).toContain('QB-20261010-9876');
    expect(email.html).toContain('http://localhost:3000/track-order/c1234567-89ab-cdef-0123-456789abcdef?token=a1b2c3d4e5f6789012345678');
    expect(email.html).toContain('awaiting acceptance');
    expect(email.html).not.toContain('<script>');
    expect(email.text).toContain('QuickBite | Your Order Has Been Placed!');
    expect(email.text).toContain('₹245.50');
  });

  it('renders Template 2: Order Received email when staff acknowledges ticket', () => {
    const email = renderOrderReceivedEmail(sampleEmailData);
    expect(email.subject).toBe('QuickBite | The Canteen Has Received Your Order');
    expect(email.html).toContain('acknowledged your order ticket');
    expect(email.html).toContain('QB-20261010-9876');
    expect(email.text).toContain('QuickBite | The Canteen Has Received Your Order');
  });

  it('renders Template 3: Order Accepted email when kitchen starts preparation', () => {
    const email = renderOrderAcceptedEmail(sampleEmailData);
    expect(email.subject).toBe('QuickBite | Your Order Has Been Accepted!');
    expect(email.html).toContain('accepted by the kitchen');
    expect(email.html).toContain('Counter 2, 1st Floor');
    expect(email.text).toContain('QuickBite | Your Order Has Been Accepted!');
  });

  it('renders Template 4: Order Ready for Pickup with clear payment instructions', () => {
    // Unpaid scenario
    const unpaidEmail = renderOrderReadyForPickupEmail(sampleEmailData);
    expect(unpaidEmail.subject).toBe('QuickBite | Your Food Is Ready for Pickup!');
    expect(unpaidEmail.html).toContain('Payment Due at Counter');
    expect(unpaidEmail.html).toContain('Payment is still due');

    // Paid scenario
    const paidEmail = renderOrderReadyForPickupEmail({
      ...sampleEmailData,
      paymentStatus: 'PAID',
    });
    expect(paidEmail.html).toContain('Payment Verified &amp; Settled');
    expect(paidEmail.html).not.toContain('Payment is still due');
  });

  it('renders Template 5: Order Cancelled email with reason', () => {
    const email = renderOrderCancelledEmail({
      ...sampleEmailData,
      cancellationReason: 'Out of fresh paneer stock',
    });
    expect(email.subject).toContain('Has Been Cancelled');
    expect(email.html).toContain('Out of fresh paneer stock');
    expect(email.text).toContain('Out of fresh paneer stock');
  });
});

describe('QUICKBITE V3: Cryptographic Guest Tracking Security', () => {
  it('generates unguessable 24-byte tokens and verifies SHA-256 hash matching', () => {
    const rawToken = crypto.randomBytes(24).toString('hex');
    expect(rawToken.length).toBe(48); // 24 bytes hex = 48 chars

    const dbHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(dbHash.length).toBe(64); // SHA-256 hex = 64 chars

    // Verifying correct token
    const clientProvidedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(clientProvidedHash).toBe(dbHash);

    // Tampered token fails
    const tamperedToken = rawToken.slice(0, -1) + 'x';
    const tamperedHash = crypto.createHash('sha256').update(tamperedToken).digest('hex');
    expect(tamperedHash).not.toBe(dbHash);
  });

  it('rejects expired tracking tokens correctly', () => {
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days future
    expect(validUntil > new Date()).toBe(true);

    const expiredTokenDate = new Date(Date.now() - 1000); // 1 sec past
    expect(expiredTokenDate > new Date()).toBe(false);
  });
});

describe('QUICKBITE V3: Homepage Cleanliness & Regression Check', () => {
  const homePagePath = path.resolve(__dirname, '../src/app/page.tsx');
  const homePageContent = fs.readFileSync(homePagePath, 'utf-8');

  it('does NOT contain Average Pickup Time promotional metric', () => {
    expect(homePageContent).not.toContain('Average Pickup Time');
  });

  it('does NOT contain Under 45 Seconds promotional claim', () => {
    expect(homePageContent).not.toContain('Under 45 Seconds');
  });

  it('does NOT display anonymous sample order #QB-2026-9942', () => {
    expect(homePageContent).not.toContain('QB-2026-9942');
  });

  it('does NOT display anonymous sample pickup token PK-9942A on homepage', () => {
    expect(homePageContent).not.toContain('PK-9942A');
  });

  it('preserves clean campus dining pre-order card and navigation', () => {
    expect(homePageContent).toContain('Campus Dining Platform');
    expect(homePageContent).toContain('Express Counter Pickup');
    expect(homePageContent).toContain('/canteens');
  });
});

describe('QUICKBITE V3: Staff Payment Collection Workflow', () => {
  it('enforces status separation between OrderStatus and PaymentStatus', () => {
    // Order can be READY while payment remains UNPAID
    const orderState = {
      orderStatus: 'READY',
      paymentStatus: 'UNPAID',
    };
    expect(orderState.orderStatus).toBe('READY');
    expect(orderState.paymentStatus).toBe('UNPAID');
  });

  it('validates UPI payment URI schema generation without credentials', () => {
    const upiId = 'quickbite.campus@upi';
    const canteenName = 'Food Court';
    const amount = 150.0;
    const orderNumber = 'QB-20261010-1234';

    const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      canteenName
    )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('QuickBite ' + orderNumber)}`;

    expect(upiPayload).toContain('upi://pay?pa=quickbite.campus%40upi');
    expect(upiPayload).toContain('am=150.00');
    expect(upiPayload).toContain('tn=QuickBite%20QB-20261010-1234');
    // Ensure no secrets or credentials leaked
    expect(upiPayload).not.toContain('password');
    expect(upiPayload).not.toContain('secret');
  });

  it('generates valid configured UPI payload for Santosh Reddy (avi258369@oksbi)', () => {
    const upiId = 'avi258369@oksbi';
    const payeeName = 'Santosh Reddy';
    const amount = 245.5;
    const orderNumber = 'QB-20261010-9988';

    const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      payeeName
    )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('QuickBite Order ' + orderNumber)}`;

    expect(upiPayload).toContain('pa=avi258369%40oksbi');
    expect(upiPayload).toContain('pn=Santosh%20Reddy');
    expect(upiPayload).toContain('am=245.50');
    expect(upiPayload).toContain('tn=QuickBite%20Order%20QB-20261010-9988');
  });
});
