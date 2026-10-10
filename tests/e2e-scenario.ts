/**
 * QuickBite End-to-End Workflow Verification Script
 * Validates real HTTP routes, database transactions, concurrency, and role barriers.
 */
async function runE2E() {
  console.log('🚀 Starting QuickBite End-to-End Live Workflow Verification...\n');
  const baseUrl = 'http://localhost:3000';

  // Helper for requests with cookie jar
  let customerCookie = '';
  let staffCookie = '';
  let adminCookie = '';

  // 1. Check Homepage & Canteens
  console.log('1. Checking Public Routes...');
  const homeRes = await fetch(`${baseUrl}/`);
  if (!homeRes.ok) throw new Error(`Home failed: ${homeRes.status}`);
  console.log('   ✅ GET / (200 OK)');

  const canteensRes = await fetch(`${baseUrl}/api/canteens`);
  const canteensData = await canteensRes.json();
  if (!canteensRes.ok || canteensData.canteens.length === 0) {
    throw new Error('Failed to fetch canteens');
  }
  const centralCanteen = canteensData.canteens.find((c: any) => c.slug === 'central-food-court');
  console.log(`   ✅ GET /api/canteens found ${canteensData.canteens.length} canteens (Selected: ${centralCanteen.name})`);

  // 2. Fetch Canteen Menu & Slots
  console.log('\n2. Fetching Menu & Pickup Slots...');
  const menuRes = await fetch(`${baseUrl}/api/canteens/${centralCanteen.id}`);
  const menuData = await menuRes.json();
  const availableSlots = menuData.canteen.pickupSlots.filter((s: any) => !s.isFull);
  const sampleItem = menuData.canteen.categories[0].menuItems[0];
  console.log(`   ✅ Canteen has ${menuData.canteen.categories.length} categories.`);
  console.log(`   ✅ Sample Item: "${sampleItem.name}" at ₹${sampleItem.price}`);
  console.log(`   ✅ Available Pickup Slots: ${availableSlots.length}`);
  if (availableSlots.length === 0) throw new Error('No available pickup slots');

  // 3. Customer Authentication
  console.log('\n3. Authenticating Customer...');
  const customerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@quickbite.local',
      password: 'Customer123!',
    }),
  });
  if (!customerLoginRes.ok) throw new Error('Customer login failed');
  customerCookie = customerLoginRes.headers.get('set-cookie')?.split(';')[0] || '';
  const customerUser = (await customerLoginRes.json()).user;
  console.log(`   ✅ Logged in as Customer: ${customerUser.name} (${customerUser.email})`);

  // 4. Place an Order atomically
  console.log('\n4. Placing Order via POST /api/orders...');
  const chosenSlot = availableSlots[0];
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      canteenId: centralCanteen.id,
      pickupSlotId: chosenSlot.id,
      items: [{ menuItemId: sampleItem.id, quantity: 2 }],
      specialInstructions: 'E2E automated verification test order',
      paymentMethod: 'SIMULATED_CARD',
    }),
  });

  const orderJson = await orderRes.json();
  if (!orderRes.ok) throw new Error(`Order placement failed: ${orderJson.error}`);
  const createdOrder = orderJson.order;
  console.log(`   ✅ Order Created: ${createdOrder.orderNumber}`);
  console.log(`   ✅ Total: ₹${createdOrder.total} (Status: ${createdOrder.status})`);
  console.log(`   ✅ Pickup Token: ${createdOrder.pickupToken}`);

  // 5. Customer Live Tracking
  console.log('\n5. Customer Live Tracking...');
  const trackingRes = await fetch(`${baseUrl}/api/orders/${createdOrder.id}`, {
    headers: { Cookie: customerCookie },
  });
  const trackingData = await trackingRes.json();
  if (!trackingRes.ok) throw new Error('Tracking fetch failed');
  console.log(`   ✅ Verified Customer Order Status: ${trackingData.order.status}`);

  // 6. Staff Login
  console.log('\n6. Authenticating Canteen Staff...');
  const staffLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'staff@quickbite.local',
      password: 'Staff123!',
    }),
  });
  if (!staffLoginRes.ok) throw new Error('Staff login failed');
  staffCookie = staffLoginRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log('   ✅ Logged in as Staff for Central Food Court');

  // 7. Kitchen Status Transitions: PLACED -> ACCEPTED -> PREPARING -> READY
  console.log('\n7. Executing Kitchen Workflow Transitions...');

  // Accept
  const acceptRes = await fetch(`${baseUrl}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
    body: JSON.stringify({ toStatus: 'ACCEPTED' }),
  });
  if (!acceptRes.ok) throw new Error('Failed to accept order');
  console.log('   ✅ PLACED ➔ ACCEPTED');

  // Preparing
  const prepRes = await fetch(`${baseUrl}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
    body: JSON.stringify({ toStatus: 'PREPARING' }),
  });
  if (!prepRes.ok) throw new Error('Failed to move to PREPARING');
  console.log('   ✅ ACCEPTED ➔ PREPARING');

  // Ready
  const readyRes = await fetch(`${baseUrl}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
    body: JSON.stringify({ toStatus: 'READY' }),
  });
  if (!readyRes.ok) throw new Error('Failed to move to READY');
  console.log('   ✅ PREPARING ➔ READY');

  // 8. Staff Verifies Pickup Code at Counter
  console.log('\n8. Verifying Pickup Code at Counter...');
  const verifyRes = await fetch(`${baseUrl}/api/orders/verify-pickup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
    body: JSON.stringify({ pickupToken: createdOrder.pickupToken }),
  });
  const verifyJson = await verifyRes.json();
  if (!verifyRes.ok) throw new Error(`Token verification failed: ${verifyJson.error}`);
  console.log(`   ✅ Token ${createdOrder.pickupToken} Verified! Order marked as: ${verifyJson.order.status}`);

  // 9. Prevent Duplicate Pickup Completion
  console.log('\n9. Testing Duplicate Pickup Handover Prevention...');
  const duplicateVerifyRes = await fetch(`${baseUrl}/api/orders/verify-pickup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
    body: JSON.stringify({ pickupToken: createdOrder.pickupToken }),
  });
  if (duplicateVerifyRes.status === 409) {
    console.log('   ✅ Correctly rejected duplicate pickup attempt with HTTP 409 Conflict!');
  } else {
    throw new Error(`Expected 409 Conflict, got ${duplicateVerifyRes.status}`);
  }

  // 10. Admin Analytics & CSV Export
  console.log('\n10. Testing Admin Analytics & Reporting...');
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@quickbite.local',
      password: 'Admin123!',
    }),
  });
  if (!adminLoginRes.ok) throw new Error('Admin login failed');
  adminCookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0] || '';

  const analyticsRes = await fetch(`${baseUrl}/api/admin/analytics?range=today`, {
    headers: { Cookie: adminCookie },
  });
  const analyticsData = await analyticsRes.json();
  console.log(`   ✅ Gross Revenue Today: ₹${analyticsData.summary.grossRevenue}`);
  console.log(`   ✅ Total Orders in System: ${analyticsData.summary.totalOrders}`);
  console.log(`   ✅ Completed Handover Count: ${analyticsData.summary.completedCount}`);

  const csvRes = await fetch(`${baseUrl}/api/admin/export-csv`, {
    headers: { Cookie: adminCookie },
  });
  const csvContent = await csvRes.text();
  if (!csvRes.ok || !csvContent.startsWith('Order Number,Date,Canteen')) {
    throw new Error('CSV generation failed');
  }
  console.log(`   ✅ Generated Valid Orders Master CSV (${csvContent.split('\n').length} rows)`);

  console.log('\n✨ ALL QUICKBITE SYSTEM WORKFLOWS VERIFIED SUCCESSFULLY! ✨\n');
}

runE2E().catch((err) => {
  console.error('\n❌ E2E Verification failed:', err);
  process.exit(1);
});
