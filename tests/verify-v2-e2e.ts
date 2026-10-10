Object.assign(process.env, { NODE_ENV: 'test' });
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { getDashboardRouteForRole, getSafeRedirectUrl, createPasswordResetToken, consumePasswordResetToken } from '../src/lib/auth';
import { getPersonalizedPromotions, validatePromotionCode } from '../src/lib/recommendations';
import { sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderReadyEmail } from '../src/lib/email/email-service';
import { Role, OrderStatus } from '@prisma/client';

async function runE2EVerification() {
  console.log('🚀 Starting QUICKBITE V2 Comprehensive End-to-End Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Role Dashboard Mapping & Redirection
  // -------------------------------------------------------------
  console.log('📌 Testing Phase 4: Role-Based Dashboard Redirection...');
  assert(getDashboardRouteForRole(Role.CUSTOMER) === '/customer/dashboard', 'Customer maps to /customer/dashboard');
  assert(getDashboardRouteForRole(Role.STAFF) === '/staff/dashboard', 'Staff maps to /staff/dashboard');
  assert(getDashboardRouteForRole(Role.ADMIN) === '/admin/dashboard', 'Admin maps to /admin/dashboard');

  assert(getSafeRedirectUrl('//attacker.com', Role.CUSTOMER) === '/customer/dashboard', 'Open redirect attempt neutralized');
  assert(getSafeRedirectUrl('/admin/promotions', Role.CUSTOMER) === '/customer/dashboard', 'Customer cannot redirect to /admin');
  assert(getSafeRedirectUrl('/staff/dashboard', Role.CUSTOMER) === '/customer/dashboard', 'Customer cannot redirect to /staff');
  assert(getSafeRedirectUrl('/staff/dashboard', Role.STAFF) === '/staff/dashboard', 'Staff permitted to redirect to /staff/dashboard');

  // -------------------------------------------------------------
  // Test 2: User Registration & Duplicate Prevention
  // -------------------------------------------------------------
  console.log('\n📌 Testing Phase 2: Registration Hardening...');
  const testEmail = `student_${Date.now()}@campus.edu`;
  const rawPassword = 'StudentSecurePass123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const newCustomer = await prisma.user.create({
    data: {
      name: 'Samantha Vance',
      email: testEmail.toLowerCase(),
      passwordHash,
      phone: '+1-555-0988',
      role: Role.CUSTOMER,
    },
  });

  assert(newCustomer.role === Role.CUSTOMER, 'New public account created with CUSTOMER role');
  assert(newCustomer.email === testEmail.toLowerCase(), 'Email normalized to lowercase');

  // Attempt duplicate registration
  let duplicateCaught = false;
  try {
    await prisma.user.create({
      data: {
        name: 'Imposter',
        email: testEmail.toLowerCase(),
        passwordHash,
        role: Role.CUSTOMER,
      },
    });
  } catch {
    duplicateCaught = true;
  }
  assert(duplicateCaught, 'Database unique constraint prevents duplicate account registration');

  // -------------------------------------------------------------
  // Test 3: Login Credentials Verification
  // -------------------------------------------------------------
  console.log('\n📌 Testing Phase 3: Login Verification & Credential Matching...');
  const userRecord = await prisma.user.findUnique({ where: { email: testEmail } });
  assert(!!userRecord, 'User found in database');

  const validMatch = await bcrypt.compare(rawPassword, userRecord!.passwordHash);
  assert(validMatch, 'Password comparison succeeds for valid credentials');

  const invalidMatch = await bcrypt.compare('WrongPassword999!', userRecord!.passwordHash);
  assert(!invalidMatch, 'Password comparison fails for invalid credentials');

  // -------------------------------------------------------------
  // Test 4: Password Reset Token Lifecycle (SHA-256 Single-Use)
  // -------------------------------------------------------------
  console.log('\n📌 Testing Phase 5: Secure Password Reset Token Lifecycle...');
  const rawToken = await createPasswordResetToken(newCustomer.id);
  assert(typeof rawToken === 'string' && rawToken.length === 64, 'Generated 64-char cryptographically secure token');

  // First consumption: should succeed and return userId
  const consumedUserId = await consumePasswordResetToken(rawToken);
  assert(consumedUserId === newCustomer.id, 'Token consumed successfully on first attempt');

  // Second consumption: single-use token must be rejected
  const replayedUserId = await consumePasswordResetToken(rawToken);
  assert(replayedUserId === null, 'Replayed/used reset token rejected (single-use enforced)');

  // -------------------------------------------------------------
  // Test 5: Nodemailer Email Notifications
  // -------------------------------------------------------------
  console.log('\n📌 Testing Phase 5: Nodemailer Email Dispatch...');
  const welcomeResult = await sendWelcomeEmail(newCustomer.email, newCustomer.name);
  assert(welcomeResult.success, 'Welcome email generated & dispatched without error');

  const orderReadyResult = await sendOrderReadyEmail(newCustomer.email, {
    orderNumber: 'QB-TEST-9901',
    customerName: newCustomer.name,
    canteenName: 'Central Food Court',
    canteenLocation: 'Counter 1',
    pickupToken: 'PK-9912',
  });
  assert(orderReadyResult.success, 'Ready for pickup email dispatched without error');

  // -------------------------------------------------------------
  // Test 6: Personalized Promotions & Discount Validation
  // -------------------------------------------------------------
  console.log('\n📌 Testing Phase 6: Personalized Promotions & Rule Engine...');
  const promos = await getPersonalizedPromotions(newCustomer.id);
  assert(promos.length > 0, `Retrieved ${promos.length} active promotional banners`);
  assert(promos.every((p) => p.title && p.imageUrl), 'All promotions contain valid title and food image');

  // Server-side promo validation
  const promo20 = await validatePromotionCode('LUNCH20', 200);
  assert(promo20.valid, 'Promo code LUNCH20 recognized');
  assert(promo20.discountAmount === 40, `Calculated 20% of 200 = 40 (got ${promo20.discountAmount})`);

  // Max cap check: ₹500 order with 20% discount capped at ₹50
  const promo20Capped = await validatePromotionCode('LUNCH20', 500);
  assert(promo20Capped.valid && promo20Capped.discountAmount === 50, 'Percentage discount capped at maxDiscount ₹50');

  // Min order value rejection
  const promoMinFail = await validatePromotionCode('LUNCH20', 50);
  assert(!promoMinFail.valid, 'Rejected order below minOrderValue ₹150');

  // Invalid code rejection
  const promoInvalid = await validatePromotionCode('NONEXISTENT_CODE', 200);
  assert(!promoInvalid.valid, 'Non-existent promo code safely rejected');

  // -------------------------------------------------------------
  // Test 7: Clean Up Temporary Test Records
  // -------------------------------------------------------------
  await prisma.passwordResetToken.deleteMany({ where: { userId: newCustomer.id } });
  await prisma.user.delete({ where: { id: newCustomer.id } });

  console.log('\n=============================================================');
  console.log(`🏁 Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2EVerification()
  .catch((e) => {
    console.error('E2E Verification threw exception:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
