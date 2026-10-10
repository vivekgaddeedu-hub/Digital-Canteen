import { describe, it, expect } from 'vitest';
import { getDashboardRouteForRole, getSafeRedirectUrl } from '../src/lib/auth';
import { Role } from '@prisma/client';

describe('Role-Based Dashboard Redirection & Open Redirect Protection', () => {
  it('maps each authenticated role to its strict dashboard destination', () => {
    expect(getDashboardRouteForRole(Role.CUSTOMER)).toBe('/customer/dashboard');
    expect(getDashboardRouteForRole(Role.STAFF)).toBe('/staff/dashboard');
    expect(getDashboardRouteForRole(Role.ADMIN)).toBe('/admin/dashboard');
  });

  it('safely redirects users to requested destinations if permitted', () => {
    // Customer requesting orders or cart
    expect(getSafeRedirectUrl('/orders', Role.CUSTOMER)).toBe('/orders');
    expect(getSafeRedirectUrl('/cart', Role.CUSTOMER)).toBe('/cart');
    expect(getSafeRedirectUrl('/canteen/central-food-court', Role.CUSTOMER)).toBe('/canteen/central-food-court');

    // Staff requesting staff kitchen dashboard
    expect(getSafeRedirectUrl('/staff/dashboard', Role.STAFF)).toBe('/staff/dashboard');

    // Admin requesting admin operations
    expect(getSafeRedirectUrl('/admin/promotions', Role.ADMIN)).toBe('/admin/promotions');
  });

  it('prevents role escalation and unauthorized redirect destinations', () => {
    // Customer cannot be redirected to /admin or /staff
    expect(getSafeRedirectUrl('/admin/dashboard', Role.CUSTOMER)).toBe('/customer/dashboard');
    expect(getSafeRedirectUrl('/admin/promotions', Role.CUSTOMER)).toBe('/customer/dashboard');
    expect(getSafeRedirectUrl('/staff/dashboard', Role.CUSTOMER)).toBe('/customer/dashboard');

    // Staff cannot access /admin
    expect(getSafeRedirectUrl('/admin/dashboard', Role.STAFF)).toBe('/staff/dashboard');
  });

  it('neutralizes Open Redirect attacks and malicious external URLs', () => {
    // Protocol-relative URLs
    expect(getSafeRedirectUrl('//malicious-phishing.com', Role.CUSTOMER)).toBe('/customer/dashboard');
    expect(getSafeRedirectUrl('//evil.org/login', Role.ADMIN)).toBe('/admin/dashboard');

    // Full external URLs
    expect(getSafeRedirectUrl('https://evil.com', Role.CUSTOMER)).toBe('/customer/dashboard');
    expect(getSafeRedirectUrl('http://attacker.com/steal-session', Role.STAFF)).toBe('/staff/dashboard');

    // Javascript URIs
    expect(getSafeRedirectUrl('javascript:alert(1)', Role.CUSTOMER)).toBe('/customer/dashboard');

    // Backslash bypasses
    expect(getSafeRedirectUrl('/\\evil.com', Role.CUSTOMER)).toBe('/customer/dashboard');

    // Null or undefined fallback
    expect(getSafeRedirectUrl(null, Role.CUSTOMER)).toBe('/customer/dashboard');
    expect(getSafeRedirectUrl(undefined, Role.ADMIN)).toBe('/admin/dashboard');
  });
});
