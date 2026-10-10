import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../src/lib/auth';
import { Role } from '../src/types/database';

describe('Security & Authentication Layer', () => {
  it('hashes passwords and verifies them accurately using bcrypt', async () => {
    const rawPassword = 'SecureStudentPassword2026!';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix

    const isCorrect = await verifyPassword(rawPassword, hash);
    expect(isCorrect).toBe(true);

    const isWrong = await verifyPassword('WrongPassword123!', hash);
    expect(isWrong).toBe(false);
  });

  it('signs and verifies JWT tokens with role authorization claims', () => {
    const payload = {
      userId: 'usr-1234-uuid',
      email: 'alex@campus.edu',
      name: 'Alex Johnson',
      role: Role.STAFF,
      assignedCanteenId: 'cant-5678-uuid',
    };

    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(Role.STAFF);
    expect(decoded?.assignedCanteenId).toBe(payload.assignedCanteenId);
  });

  it('fails verification on tampered or forged JWT tokens', () => {
    const validToken = signToken({
      userId: 'usr-999',
      email: 'admin@quickbite.local',
      name: 'Admin',
      role: Role.ADMIN,
    });

    const tampered = validToken.slice(0, -6) + 'abcdef';
    expect(verifyToken(tampered)).toBeNull();
    expect(verifyToken('completely-invalid-token')).toBeNull();
  });
});
