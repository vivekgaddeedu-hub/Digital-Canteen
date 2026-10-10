import { describe, it, expect } from 'vitest';
import { registerSchema, resetPasswordSchema, forgotPasswordSchema } from '../src/lib/validations';

describe('Registration & Password Reset Validation Hardening', () => {
  it('accepts valid registration with matching confirmPassword', () => {
    const valid = {
      name: 'Alex Johnson',
      email: 'alex@campus.edu',
      password: 'CampusPassword123!',
      confirmPassword: 'CampusPassword123!',
      phone: '+1-555-0199',
    };
    const res = registerSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects registration when confirmPassword does not match', () => {
    const mismatched = {
      name: 'Alex Johnson',
      email: 'alex@campus.edu',
      password: 'CampusPassword123!',
      confirmPassword: 'DifferentPassword456!',
    };
    const res = registerSchema.safeParse(mismatched);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.flatten().fieldErrors.confirmPassword).toContain('Passwords do not match');
    }
  });

  it('enforces password minimum length of 6 characters', () => {
    const short = {
      name: 'Alex',
      email: 'alex@campus.edu',
      password: '123',
      confirmPassword: '123',
    };
    const res = registerSchema.safeParse(short);
    expect(res.success).toBe(false);
  });

  it('validates forgot password email format', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'valid@campus.edu' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'invalid-email' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('validates reset password token and password confirmation', () => {
    const validReset = {
      token: 'secure-token-12345',
      password: 'NewSecurePassword123!',
      confirmPassword: 'NewSecurePassword123!',
    };
    expect(resetPasswordSchema.safeParse(validReset).success).toBe(true);

    const mismatchedReset = {
      token: 'secure-token-12345',
      password: 'NewSecurePassword123!',
      confirmPassword: 'MismatchPassword!',
    };
    const res = resetPasswordSchema.safeParse(mismatchedReset);
    expect(res.success).toBe(false);
  });
});
