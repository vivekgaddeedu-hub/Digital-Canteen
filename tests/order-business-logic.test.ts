import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  calculateOrderTotals,
  generateOrderNumber,
  generatePickupToken,
  TAX_RATE,
  CONVENIENCE_FEE,
} from '../src/lib/order-utils';
import { OrderStatus } from '../src/types/database';

describe('Order Business Logic & State Machine', () => {
  it('allows valid progressive status transitions', () => {
    // Placed can go to Accepted
    expect(isValidStatusTransition(OrderStatus.PLACED, OrderStatus.ACCEPTED)).toBe(true);
    // Accepted can go to Preparing
    expect(isValidStatusTransition(OrderStatus.ACCEPTED, OrderStatus.PREPARING)).toBe(true);
    // Preparing can go to Ready
    expect(isValidStatusTransition(OrderStatus.PREPARING, OrderStatus.READY)).toBe(true);
    // Ready can go to Collected
    expect(isValidStatusTransition(OrderStatus.READY, OrderStatus.COLLECTED)).toBe(true);
  });

  it('allows cancellation and rejection from appropriate initial states', () => {
    // Placed can be cancelled or rejected
    expect(isValidStatusTransition(OrderStatus.PLACED, OrderStatus.CANCELLED)).toBe(true);
    expect(isValidStatusTransition(OrderStatus.PLACED, OrderStatus.REJECTED)).toBe(true);
    // Accepted can still be cancelled if kitchen has not started cooking
    expect(isValidStatusTransition(OrderStatus.ACCEPTED, OrderStatus.CANCELLED)).toBe(true);
  });

  it('strictly rejects invalid or skipping transitions', () => {
    // Cannot jump directly from Placed to Ready (must be accepted & prepped)
    expect(isValidStatusTransition(OrderStatus.PLACED, OrderStatus.READY)).toBe(false);
    // Cannot jump from Placed to Collected
    expect(isValidStatusTransition(OrderStatus.PLACED, OrderStatus.COLLECTED)).toBe(false);
    // Cannot cancel after preparation has started
    expect(isValidStatusTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED)).toBe(false);
    // Cannot cancel after order is ready
    expect(isValidStatusTransition(OrderStatus.READY, OrderStatus.CANCELLED)).toBe(false);
  });

  it('enforces terminal states: COLLECTED, CANCELLED, REJECTED cannot transition further', () => {
    expect(isValidStatusTransition(OrderStatus.COLLECTED, OrderStatus.PREPARING)).toBe(false);
    expect(isValidStatusTransition(OrderStatus.COLLECTED, OrderStatus.READY)).toBe(false);
    expect(isValidStatusTransition(OrderStatus.COLLECTED, OrderStatus.CANCELLED)).toBe(false);

    expect(isValidStatusTransition(OrderStatus.CANCELLED, OrderStatus.PLACED)).toBe(false);
    expect(isValidStatusTransition(OrderStatus.CANCELLED, OrderStatus.READY)).toBe(false);

    expect(isValidStatusTransition(OrderStatus.REJECTED, OrderStatus.ACCEPTED)).toBe(false);
  });

  it('calculates order financial totals with precision and fixed fees', () => {
    const subtotal = 200.0;
    const totals = calculateOrderTotals(subtotal);

    expect(totals.subtotal).toBe(200.0);
    expect(totals.tax).toBe(10.0); // 5% GST
    expect(totals.convenienceFee).toBe(CONVENIENCE_FEE); // 5.00
    expect(totals.total).toBe(215.0); // 200 + 10 + 5
  });

  it('generates unique format order numbers and pickup tokens', () => {
    const orderNum = generateOrderNumber();
    expect(orderNum).toMatch(/^QB-\d{8}-[A-Z0-9]{4}$/);

    const token = generatePickupToken();
    expect(token).toMatch(/^PK-\d{4}[A-Z]$/);
  });
});
