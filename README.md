# QUICKBITE — Digital Canteen Pre-Order System

> **"Order Ahead. Skip the Queue."**

QUICKBITE is a full-stack, production-oriented digital food pre-ordering and kitchen operations management system designed for university and corporate campuses. It eliminates lunch break queues, enforces real-time kitchen portion inventory, and provides synchronized live status tracking and express counter pickups.

---

## 1. Key Features

### A. Customer / Student Experience
- **Campus Canteen Directory**: Browse multiple campus canteens with live opening hours, counter locations, and active menus.
- **Categorized Menus & Filters**: Search dishes, filter by Vegetarian / Non-Vegetarian diet tags, view preparation times, and check live portion availability.
- **Smart Shopping Cart**: Multi-canteen collision prevention, automatic tax calculation (5% GST), and flat packaging fee.
- **Slot-Based Pre-Ordering**: Select available 15-minute pickup slots with guaranteed capacity control to avoid kitchen bottlenecks.
- **Idempotent Checkout**: Concurrency-safe atomic transactions decrement inventory, reserve pickup slot spots, and create order items with historical price snapshots.
- **Live Order Tracking**: Visual 5-stage progress indicator (`Placed` ➔ `Accepted` ➔ `Preparing` ➔ `Ready for Pickup` ➔ `Collected`) with automatic status refresh and customer-initiated cancellations for eligible orders.
- **Unique Pickup Code**: Generates secure cryptographic pickup tokens (e.g. `PK-9942A`) for counter collection.
- **Customer Profile & History**: Full record of past orders, item snapshots, receipts, and dining statistics.

### B. Canteen Staff (Kitchen Operations)
- **Role-Scoped Operations**: Kitchen staff can only manage orders and menus for their assigned canteen.
- **Kitchen Ticket Management**: View incoming orders grouped by lifecycle stages (`New`, `Accepted`, `Preparing`, `Ready`, `Collected`, `Cancelled`).
- **Server-Enforced State Machine**: Strictly validates valid status transitions (`Placed` ➔ `Accepted` ➔ `Preparing` ➔ `Ready` ➔ `Collected`).
- **Order Rejections with Required Reasons**: Restores inventory and decrements slot bookings upon rejection.
- **Express Counter Verification**: Staff verifies pickup codes or order numbers directly from the kitchen screen to mark orders as `Collected`.
- **Duplicate Pickup Prevention**: Prevents any order from being handed over or collected twice (HTTP 409 Conflict).
- **Kitchen Stock Controls**: Quick floor-level toggles to disable sold-out dishes or replenish stock portions on the fly.

### C. Administrator Console & Operations
- **Live PostgreSQL Analytics**: Real business metrics calculated from database transactions:
  - Orders Today & Historical Counts
  - Gross Order Value (strictly excludes cancelled and rejected orders)
  - Average Order Value
  - Live Active Orders in Kitchen
  - Best-Selling Dishes (ranked by actual portions sold)
  - Turnover by Campus Canteen
  - Time-series Revenue & Orders Trend Area Charts (powered by Recharts)
- **Menu Catalog Management**: Add dishes with images, prep times, prices, and initial stocks.
- **Category Hierarchy**: Organize dishes into custom categories per canteen.
- **Canteen Hubs**: Create and configure dining halls, locations, and operating hours.
- **Inventory Control**: Live portion counters with low-stock warnings.
- **Pickup Slot Scheduling**: Configure pickup time windows and set maximum order capacities.
- **Staff Provisioning**: Create and assign staff accounts to specific canteens.
- **Order Oversight**: Inspect every order placed on campus.
- **CSV Data Export**: One-click download of the Orders Master transaction ledger.
- **Immutable Audit Trail**: Tracks all sensitive admin operations, menu adjustments, and status changes.

---

## 2. Technology Stack & Architecture

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript with strict mode enabled
- **Database**: PostgreSQL 18 with normalized schema and atomic transactions
- **ORM**: Prisma ORM 6
- **Styling**: Tailwind CSS with custom warm neutral surfaces and brand palette
- **Icons**: Lucide React
- **Analytics & Charts**: Recharts
- **Validation**: Zod (100% schema enforcement on all API requests)
- **Authentication**: JWT session cookies (`httpOnly`, `sameSite: lax`) with bcryptjs password hashing
- **Testing**: Vitest for unit tests & custom end-to-end integration test runner

---

## 3. Database Schema Overview

Models implemented in `prisma/schema.prisma`:
1. **User**: Accounts with `CUSTOMER`, `STAFF`, and `ADMIN` roles.
2. **Canteen**: Dining locations with operating hours, slugs, and status.
3. **StaffAssignment**: Links staff users to specific canteens with unique constraint.
4. **Category**: Dish groupings per canteen.
5. **MenuItem**: Food catalog with prices, veg/non-veg flags, prep times, and descriptions.
6. **InventoryRecord**: Live stock levels, low-stock alert thresholds, and unlimited flags.
7. **PickupSlot**: 15-minute time windows with `maxCapacity` and atomic `currentBookings`.
8. **Order**: Order records with subtotal, tax, packaging fee, total, pickup tokens, and statuses.
9. **OrderItem**: Snapshot of product name and unit price at time of order placement.
10. **Payment**: Payment records with methods (`SIMULATED_CARD`, `SIMULATED_UPI`, `CASH_ON_PICKUP`) and statuses.
11. **OrderStatusHistory**: Complete audit log of every order state change with actor and notes.
12. **AuditLog**: System-wide administrative action logs.

---

## 4. Development Accounts (Pre-Seeded)

The database includes clearly documented development test accounts:

| Role | Email | Password | Assigned Location |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@quickbite.local` | `Customer123!` | Public Student Access |
| **Kitchen Staff 1** | `staff@quickbite.local` | `Staff123!` | Central Food Court |
| **Kitchen Staff 2** | `staff2@quickbite.local` | `Staff123!` | Engineering Block Hub |
| **Administrator** | `admin@quickbite.local` | `Admin123!` | Campus Wide System |

*Tip: The `/login` page includes 1-click test credential fill buttons for fast testing.*

---

## 5. Quick Start & Run Commands

### Prerequisites
- Node.js v20+ / v22+
- PostgreSQL database

### Setup Steps
```bash
# 1. Install dependencies
npm install

# 2. Push Prisma schema to PostgreSQL
npx prisma db push

# 3. Seed database with campus canteens, dishes, and test users
npm run db:seed

# 4. Run unit and business logic tests
npm test

# 5. Build for production
npm run build

# 6. Start the server
npm run start
```

The application will be live at `http://localhost:3000`.

---

## 6. Testing

### Run Vitest Unit Tests
```bash
npm test
```
Tests cover:
- State Machine Transitions (valid, skipping, terminal state rejections)
- Financial Calculations & Tax Precision
- Zod Input Validation Schemas
- Password Hashing (bcrypt) & JWT Token Signing/Verification

### Run Live End-to-End Workflow Verification
```bash
npx tsx tests/e2e-scenario.ts
```
Verifies full lifecycle against the running server:
- Public menu browsing
- Customer authentication
- Atomic order creation with slot capacity booking
- Customer live status tracking
- Staff authentication & kitchen state transitions (`PLACED` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY`)
- Counter token verification (`READY` ➔ `COLLECTED`)
- Duplicate pickup prevention (HTTP 409 Conflict)
- Admin analytics and CSV ledger generation
