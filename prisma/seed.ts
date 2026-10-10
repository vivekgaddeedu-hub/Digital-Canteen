import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting QuickBite database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.promotionClick.deleteMany();
  await prisma.promotionImpression.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pickupSlot.deleteMany();
  await prisma.inventoryRecord.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staffAssignment.deleteMany();
  await prisma.canteen.deleteMany();
  await prisma.user.deleteMany();

  // 2. Passwords for test accounts
  const customerPassword = await bcrypt.hash('Customer123!', 10);
  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const adminPassword = await bcrypt.hash('Admin123!', 10);

  // 3. Create Users
  const customerUser = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'customer@quickbite.local',
      passwordHash: customerPassword,
      phone: '+1-555-0101',
      role: Role.CUSTOMER,
    },
  });

  const staffUser1 = await prisma.user.create({
    data: {
      name: 'Chef Marcus Vance',
      email: 'staff@quickbite.local',
      passwordHash: staffPassword,
      phone: '+1-555-0102',
      role: Role.STAFF,
    },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'staff2@quickbite.local',
      passwordHash: staffPassword,
      phone: '+1-555-0103',
      role: Role.STAFF,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Dev Admin (System)',
      email: 'admin@quickbite.local',
      passwordHash: adminPassword,
      phone: '+1-555-0199',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Created test users');

  // 4. Create Canteens
  const canteen1 = await prisma.canteen.create({
    data: {
      name: 'Central Food Court',
      slug: 'central-food-court',
      description: 'The vibrant campus heartbeat offering artisanal meals, fast bowls, and quick refreshments.',
      location: 'Student Union Building, 1st Floor',
      openingTime: '08:00',
      closingTime: '21:00',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const canteen2 = await prisma.canteen.create({
    data: {
      name: 'Engineering Block Hub',
      slug: 'engineering-block-hub',
      description: 'Quick bites, premium espresso, fresh wraps, and high-energy snacks for STEM innovators.',
      location: 'Technology Quad, Wing B, Ground Floor',
      openingTime: '08:30',
      closingTime: '20:00',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    },
  });

  const canteen3 = await prisma.canteen.create({
    data: {
      name: 'Green Terrace Cafe',
      slug: 'green-terrace-cafe',
      description: 'Organic salads, sourdough paninis, fruit smoothies, and farm-fresh vegetarian specialties.',
      location: 'Science Complex, Rooftop Terrace',
      openingTime: '09:00',
      closingTime: '18:30',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    },
  });

  console.log('✅ Created canteens');

  // 5. Assign Staff
  await prisma.staffAssignment.create({
    data: {
      userId: staffUser1.id,
      canteenId: canteen1.id,
      staffRole: 'KITCHEN_HEAD',
    },
  });

  await prisma.staffAssignment.create({
    data: {
      userId: staffUser2.id,
      canteenId: canteen2.id,
      staffRole: 'KITCHEN_STAFF',
    },
  });

  // 6. Create Categories for Central Food Court
  const catBreakfast = await prisma.category.create({
    data: { canteenId: canteen1.id, name: 'Breakfast & Morning Fuel', sortOrder: 1 },
  });
  const catBowls = await prisma.category.create({
    data: { canteenId: canteen1.id, name: 'Hot Rice Bowls & Meals', sortOrder: 2 },
  });
  const catBurgers = await prisma.category.create({
    data: { canteenId: canteen1.id, name: 'Artisan Burgers & Wraps', sortOrder: 3 },
  });
  const catBeverages = await prisma.category.create({
    data: { canteenId: canteen1.id, name: 'Specialty Beverages & Shakes', sortOrder: 4 },
  });
  const catSnacks = await prisma.category.create({
    data: { canteenId: canteen1.id, name: 'Crispy Snacks & Desserts', sortOrder: 5 },
  });

  // Categories for Engineering Block
  const catEngCoffee = await prisma.category.create({
    data: { canteenId: canteen2.id, name: 'Espresso Bar & Drinks', sortOrder: 1 },
  });
  const catEngFast = await prisma.category.create({
    data: { canteenId: canteen2.id, name: 'Fast Wraps & Bagels', sortOrder: 2 },
  });

  console.log('✅ Created categories');

  // 7. Create Menu Items & Inventory Records for Central Food Court
  const itemsCanteen1 = [
    {
      categoryId: catBreakfast.id,
      name: 'Classic Breakfast Bagel Sandwich',
      description: 'Toasted brioche bagel with farm eggs, cheddar melt, avocado, and house garlic spread.',
      price: 110.00,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 8,
      stock: 35,
    },
    {
      categoryId: catBreakfast.id,
      name: 'Fluffy Golden Buttermilk Pancakes',
      description: 'Stack of 3 warm pancakes served with maple butter and fresh berry compote.',
      price: 130.00,
      imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 12,
      stock: 25,
    },
    {
      categoryId: catBowls.id,
      name: 'Crispy Paneer Tikka Rice Bowl',
      description: 'Grilled tandoori paneer over fragrant cumin basmati rice, charred peppers, and mint crema.',
      price: 180.00,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 15,
      stock: 40,
    },
    {
      categoryId: catBowls.id,
      name: 'Smoky Grilled Chicken Teriyaki Bowl',
      description: 'Tender chicken glazed in ginger teriyaki sauce over steamed jasmine rice with sesame greens.',
      price: 210.00,
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
      isVeg: false,
      isAvailable: true,
      preparationTimeMinutes: 15,
      stock: 30,
    },
    {
      categoryId: catBurgers.id,
      name: 'QuickBite Signature Gourmet Burger',
      description: 'Chargrilled seasoned patty, caramelized onion jam, melted Monterey jack, and crisp lettuce on brioche.',
      price: 195.00,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      isVeg: false,
      isAvailable: true,
      preparationTimeMinutes: 14,
      stock: 28,
    },
    {
      categoryId: catBurgers.id,
      name: 'Crunchy Veggie Supreme Burger',
      description: 'Spiced quinoa and sweet potato crisp patty with chipotle mayo and pickles.',
      price: 160.00,
      imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 10,
      stock: 32,
    },
    {
      categoryId: catBurgers.id,
      name: 'Grilled Mediterranean Falafel Wrap',
      description: 'Crispy herbal chickpea falafels with pickled cucumber, tomato cubes, and roasted sesame tahini.',
      price: 150.00,
      imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 10,
      stock: 22,
    },
    {
      categoryId: catBeverages.id,
      name: 'Iced Vanilla Cold Brew',
      description: '16-hour slow steeped Arabica coffee infused with organic vanilla bean syrup and oat milk.',
      price: 95.00,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 5,
      stock: 60,
    },
    {
      categoryId: catBeverages.id,
      name: 'Fresh Alphonso Mango Smoothie',
      description: 'Blended seasonal mango pulp with Greek yoghurt, honey drops, and crushed chia seeds.',
      price: 120.00,
      imageUrl: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 5,
      stock: 45,
    },
    {
      categoryId: catSnacks.id,
      name: 'Truffle Parmesan French Fries',
      description: 'Hand-cut golden Idaho potatoes tossed in white truffle essence, sea salt, and aged parmesan.',
      price: 110.00,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 8,
      stock: 50,
    },
    {
      categoryId: catSnacks.id,
      name: 'Warm Belgian Chocolate Lava Cake',
      description: 'Decadent dark chocolate molten cake with a gooey center, dusted with powdered sugar.',
      price: 140.00,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 10,
      stock: 18,
    },
  ];

  for (const item of itemsCanteen1) {
    const createdItem = await prisma.menuItem.create({
      data: {
        canteenId: canteen1.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        preparationTimeMinutes: item.preparationTimeMinutes,
      },
    });

    await prisma.inventoryRecord.create({
      data: {
        menuItemId: createdItem.id,
        currentStock: item.stock,
        lowStockAlert: 10,
        isUnlimited: false,
      },
    });
  }

  // Engineering Hub items
  const engItems = [
    {
      categoryId: catEngCoffee.id,
      name: 'Double Shot Oat Latte',
      description: 'Rich dark espresso roast paired with silky steamed barista oat milk.',
      price: 85.00,
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      isAvailable: true,
      preparationTimeMinutes: 4,
      stock: 50,
    },
    {
      categoryId: catEngFast.id,
      name: 'Smoked Turkey & Swiss Panini',
      description: 'Warm grilled sourdough sandwich with smoked deli turkey, Swiss cheese, and honey mustard.',
      price: 165.00,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      isVeg: false,
      isAvailable: true,
      preparationTimeMinutes: 8,
      stock: 25,
    },
  ];

  for (const item of engItems) {
    const createdItem = await prisma.menuItem.create({
      data: {
        canteenId: canteen2.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        preparationTimeMinutes: item.preparationTimeMinutes,
      },
    });

    await prisma.inventoryRecord.create({
      data: {
        menuItemId: createdItem.id,
        currentStock: item.stock,
        lowStockAlert: 8,
        isUnlimited: false,
      },
    });
  }

  console.log('✅ Created menu items and inventory records');

  // 8. Generate Pickup Slots for Today and Tomorrow
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const slotTimes = [
    { start: '11:30', end: '11:45', cap: 15 },
    { start: '11:45', end: '12:00', cap: 15 },
    { start: '12:00', end: '12:15', cap: 20 },
    { start: '12:15', end: '12:30', cap: 20 },
    { start: '12:30', end: '12:45', cap: 20 },
    { start: '12:45', end: '13:00', cap: 20 },
    { start: '13:00', end: '13:15', cap: 20 },
    { start: '13:15', end: '13:30', cap: 20 },
    { start: '13:30', end: '13:45', cap: 15 },
    { start: '13:45', end: '14:00', cap: 15 },
    { start: '18:00', end: '18:30', cap: 20 },
    { start: '18:30', end: '19:00', cap: 20 },
  ];

  let sampleSlotForOrder: any = null;

  for (const day of [todayStr, tomorrowStr]) {
    for (const st of slotTimes) {
      const slot = await prisma.pickupSlot.create({
        data: {
          canteenId: canteen1.id,
          date: day,
          startTime: st.start,
          endTime: st.end,
          maxCapacity: st.cap,
          currentBookings: 0,
          isActive: true,
        },
      });
      if (!sampleSlotForOrder && day === todayStr && st.start === '12:15') {
        sampleSlotForOrder = slot;
      }

      await prisma.pickupSlot.create({
        data: {
          canteenId: canteen2.id,
          date: day,
          startTime: st.start,
          endTime: st.end,
          maxCapacity: st.cap,
          currentBookings: 0,
          isActive: true,
        },
      });
    }
  }

  console.log('✅ Created pickup slots');

  // 9. Create Sample Orders for testing tracking and analytics
  if (sampleSlotForOrder) {
    const paneerItem = await prisma.menuItem.findFirst({ where: { name: 'Crispy Paneer Tikka Rice Bowl' } });
    const coldBrewItem = await prisma.menuItem.findFirst({ where: { name: 'Iced Vanilla Cold Brew' } });

    if (paneerItem && coldBrewItem) {
      // Order 1: Ready for pickup (sample live order)
      const sampleOrder1 = await prisma.order.create({
        data: {
          orderNumber: 'QB-20261010-0101',
          customerId: customerUser.id,
          canteenId: canteen1.id,
          pickupSlotId: sampleSlotForOrder.id,
          status: OrderStatus.READY,
          subtotal: 275.00,
          tax: 13.75,
          convenienceFee: 5.00,
          total: 293.75,
          specialInstructions: 'Extra napkins please.',
          pickupToken: 'PK-9942A',
          items: {
            create: [
              {
                menuItemId: paneerItem.id,
                nameSnapshot: paneerItem.name,
                unitPriceSnapshot: paneerItem.price,
                quantity: 1,
                subtotal: 180.00,
              },
              {
                menuItemId: coldBrewItem.id,
                nameSnapshot: coldBrewItem.name,
                unitPriceSnapshot: coldBrewItem.price,
                quantity: 1,
                subtotal: 95.00,
              },
            ],
          },
          payment: {
            create: {
              amount: 293.75,
              currency: 'INR',
              method: PaymentMethod.SIMULATED_UPI,
              status: PaymentStatus.COMPLETED,
              transactionRef: 'SIM-TXN-998124',
              isSimulated: true,
            },
          },
          statusHistory: {
            create: [
              { fromStatus: null, toStatus: OrderStatus.PLACED, note: 'Order placed by customer' },
              { fromStatus: OrderStatus.PLACED, toStatus: OrderStatus.ACCEPTED, note: 'Accepted by kitchen', changedByUserId: staffUser1.id },
              { fromStatus: OrderStatus.ACCEPTED, toStatus: OrderStatus.PREPARING, note: 'Preparation started', changedByUserId: staffUser1.id },
              { fromStatus: OrderStatus.PREPARING, toStatus: OrderStatus.READY, note: 'Items packed & waiting at Counter 1', changedByUserId: staffUser1.id },
            ],
          },
        },
      });

      // Update slot booking count
      await prisma.pickupSlot.update({
        where: { id: sampleSlotForOrder.id },
        data: { currentBookings: { increment: 1 } },
      });

      // Order 2: Completed historical order
      await prisma.order.create({
        data: {
          orderNumber: 'QB-20261009-0087',
          customerId: customerUser.id,
          canteenId: canteen1.id,
          pickupSlotId: sampleSlotForOrder.id,
          status: OrderStatus.COLLECTED,
          subtotal: 180.00,
          tax: 9.00,
          convenienceFee: 5.00,
          total: 194.00,
          pickupToken: 'PK-8831B',
          items: {
            create: [
              {
                menuItemId: paneerItem.id,
                nameSnapshot: paneerItem.name,
                unitPriceSnapshot: paneerItem.price,
                quantity: 1,
                subtotal: 180.00,
              },
            ],
          },
          payment: {
            create: {
              amount: 194.00,
              currency: 'INR',
              method: PaymentMethod.SIMULATED_CARD,
              status: PaymentStatus.COMPLETED,
              transactionRef: 'SIM-TXN-773812',
              isSimulated: true,
            },
          },
          statusHistory: {
            create: [
              { fromStatus: null, toStatus: OrderStatus.PLACED, note: 'Order placed' },
              { fromStatus: OrderStatus.PLACED, toStatus: OrderStatus.COLLECTED, note: 'Collected at counter', changedByUserId: staffUser1.id },
            ],
          },
        },
      });

      console.log('✅ Created sample test orders for testing');
    }
  }

  // 10. Seed Promotions and Discounts
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const promo1 = await prisma.promotion.create({
    data: {
      title: 'Lunch Rush Saver: 20% Off Bowls',
      subtitle: 'Valid on all hot meal bowls & curries',
      description: 'Pre-order your lunch between 11:30 AM and 2:30 PM to beat the canteen queues and enjoy 20% instant discount.',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscount: 50,
      minOrderValue: 150,
      promoCode: 'LUNCH20',
      badge: '20% OFF',
      canteenId: canteen1.id,
      targetCategoryId: catBowls.id,
      placement: 'HERO_CAROUSEL',
      priority: 1,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
  });

  const promo2 = await prisma.promotion.create({
    data: {
      title: 'Morning Fuel Combo: Flat ₹25 Off',
      subtitle: 'Artisanal espresso + Breakfast items',
      description: 'Kickstart your morning productivity! Get flat ₹25 off when you pair any espresso beverage with breakfast wraps.',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
      discountType: 'FLAT',
      discountValue: 25,
      minOrderValue: 100,
      promoCode: 'BREW25',
      badge: 'FLAT ₹25 OFF',
      canteenId: canteen2.id,
      targetCategoryId: catEngCoffee.id,
      placement: 'HERO_CAROUSEL',
      priority: 2,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
  });

  const promo3 = await prisma.promotion.create({
    data: {
      title: 'Green Rooftop Sourdough Panini Deal',
      subtitle: 'Farm fresh organic vegetarian special',
      description: 'Enjoy healthy, freshly toasted sourdough paninis and crisp organic salads with 15% campus community savings.',
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      maxDiscount: 40,
      minOrderValue: 120,
      promoCode: 'GREEN15',
      badge: 'HEALTHY CHOICE',
      canteenId: canteen3.id,
      placement: 'HERO_CAROUSEL',
      priority: 3,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
  });

  const promo4 = await prisma.promotion.create({
    data: {
      title: 'Crispy Snack Attack: 10% Off',
      subtitle: 'Peri peri fries, nachos & fresh smoothies',
      description: 'Evening hunger pangs sorted! Grab snack platters and cold smoothies with easy express pickup.',
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=1200&q=80',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscount: 30,
      minOrderValue: 80,
      promoCode: 'SNACK10',
      badge: 'POPULAR',
      canteenId: canteen1.id,
      targetCategoryId: catSnacks.id,
      placement: 'HERO_CAROUSEL',
      priority: 4,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
  });

  // Seed sample customer preferences
  await prisma.userPreference.create({
    data: {
      userId: customerUser.id,
      dietaryPreference: 'VEG',
      favoriteCanteenId: canteen1.id,
    },
  });

  console.log('✅ Created promotions and customer preferences');

  // 11. Audit log for seeding
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_SEED',
      entityType: 'System',
      entityId: 'initial-setup',
      details: JSON.stringify({ message: 'Seeded initial campus canteens, menus, and users' }),
    },
  });

  console.log('\n🎉 QuickBite database seeding completed successfully!');
  console.log('======================================================');
  console.log('TEST ACCOUNTS (Development Only):');
  console.log('Customer:  customer@quickbite.local  /  Customer123!');
  console.log('Staff 1:   staff@quickbite.local     /  Staff123! (Central Food Court)');
  console.log('Staff 2:   staff2@quickbite.local    /  Staff123! (Engineering Hub)');
  console.log('Admin:     admin@quickbite.local     /  Admin123!');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
