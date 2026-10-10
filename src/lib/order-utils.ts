import { OrderStatus } from '@prisma/client';

export const TAX_RATE = 0.05; // 5% GST / Campus Sales Tax
export const CONVENIENCE_FEE = 5.00; // Flat packaging / convenience charge

/**
 * Valid order status transitions map
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COLLECTED],
  [OrderStatus.COLLECTED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
};

export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QB-${dateStr}-${randomChars}`;
}

export function generatePickupToken(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `PK-${randomDigits}${letter}`;
}

export function calculateOrderTotals(subtotal: number): {
  subtotal: number;
  tax: number;
  convenienceFee: number;
  total: number;
} {
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const fee = CONVENIENCE_FEE;
  const total = Number((subtotal + tax + fee).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    convenienceFee: fee,
    total,
  };
}
