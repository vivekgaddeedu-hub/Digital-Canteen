import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createOrderSchema,
  cancelOrderSchema,
  verifyPickupSchema,
  menuItemSchema,
} from '../src/lib/validations';
import { PaymentMethod } from '../src/types/database';

describe('Zod Input Validation Schemas', () => {
  it('validates customer registration requirements', () => {
    const valid = {
      name: 'Jane Doe',
      email: 'jane@campus.edu',
      password: 'StrongPassword123!',
      phone: '+15550199',
    };
    expect(registerSchema.safeParse(valid).success).toBe(true);

    const invalidEmail = { ...valid, email: 'not-an-email' };
    expect(registerSchema.safeParse(invalidEmail).success).toBe(false);

    const shortPassword = { ...valid, password: '123' };
    expect(registerSchema.safeParse(shortPassword).success).toBe(false);
  });

  it('validates order payload structure and constraints', () => {
    const validOrder = {
      canteenId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      pickupSlotId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      items: [
        {
          menuItemId: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
          quantity: 2,
        },
      ],
      paymentMethod: PaymentMethod.SIMULATED_CARD,
    };
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true);

    // Rejects non-positive quantities
    const zeroQuantity = {
      ...validOrder,
      items: [{ menuItemId: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', quantity: 0 }],
    };
    expect(createOrderSchema.safeParse(zeroQuantity).success).toBe(false);

    // Rejects empty items array
    const emptyItems = { ...validOrder, items: [] };
    expect(createOrderSchema.safeParse(emptyItems).success).toBe(false);

    // Rejects excessive quantities (max 20)
    const excessiveQuantity = {
      ...validOrder,
      items: [{ menuItemId: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', quantity: 50 }],
    };
    expect(createOrderSchema.safeParse(excessiveQuantity).success).toBe(false);

    // Rejects invalid UUID
    const invalidUUID = { ...validOrder, canteenId: 'invalid-canteen-id' };
    expect(createOrderSchema.safeParse(invalidUUID).success).toBe(false);
  });

  it('validates order cancellation reason requirements', () => {
    expect(cancelOrderSchema.safeParse({ reason: 'Class reschedule' }).success).toBe(true);
    // Rejects empty or too short reason
    expect(cancelOrderSchema.safeParse({ reason: 'no' }).success).toBe(false);
  });

  it('validates pickup verification token', () => {
    expect(verifyPickupSchema.safeParse({ pickupToken: 'PK-9942A' }).success).toBe(true);
    expect(verifyPickupSchema.safeParse({ pickupToken: '' }).success).toBe(false);
  });
});
