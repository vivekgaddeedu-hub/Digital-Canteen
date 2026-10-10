// Database types and enums for QuickBite with Neon Serverless Postgres

export enum Role {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COLLECTED = 'COLLECTED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  PENDING_CONFIRMATION = 'PLACED',
  CONFIRMED = 'ACCEPTED',
  READY_FOR_PICKUP = 'READY',
  COMPLETED = 'COLLECTED',
}

export enum PaymentMethod {
  SIMULATED_CARD = 'SIMULATED_CARD',
  SIMULATED_UPI = 'SIMULATED_UPI',
  CASH_ON_PICKUP = 'CASH_ON_PICKUP',
  CASH_AT_COUNTER = 'CASH_AT_COUNTER',
  WALLET = 'WALLET',
  UPI = 'UPI',
  UPI_ONLINE = 'UPI_ONLINE',
  UPI_QR = 'UPI_QR',
  CASH = 'CASH',
  CASH_COUNTER = 'CASH_COUNTER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

export enum StaffRole {
  KITCHEN_HEAD = 'KITCHEN_HEAD',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  COUNTER_DISPATCH = 'COUNTER_DISPATCH',
}

export enum PickupSlotStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  FULL = 'FULL',
}

export enum PromotionType {
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE',
  FREE_ITEM = 'FREE_ITEM',
}

export enum DietaryPreference {
  VEG = 'VEG',
  NON_VEG = 'NON_VEG',
  VEGAN = 'VEGAN',
  EGGETARIAN = 'EGGETARIAN',
}

export class Decimal {
  private _val: number;

  constructor(value: number | string | Decimal) {
    if (value instanceof Decimal) {
      this._val = value._val;
    } else {
      this._val = Number(value);
    }
  }

  toNumber(): number {
    return this._val;
  }

  toString(): string {
    return this._val.toString();
  }

  toFixed(fractionDigits?: number): string {
    return this._val.toFixed(fractionDigits);
  }

  valueOf(): number {
    return this._val;
  }

  toJSON(): number {
    return this._val;
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  staffAssignments: (StaffAssignment & { canteen?: Canteen | null })[];
  orders: Order[];
}

export interface Canteen {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  imageUrl?: string | null;
  paymentQrEnabled?: boolean | null;
  paymentUpiId?: string | null;
  paymentPayeeName?: string | null;
  paymentQrImageUrl?: string | null;
  paymentInstructions?: string | null;
  paymentPolicy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  categories?: (Category & { menuItems?: (MenuItem & { inventory?: InventoryRecord | null })[] })[];
  pickupSlots?: PickupSlot[];
  menuItems?: MenuItem[];
  _count?: { menuItems: number };
}

export interface Category {
  id: string;
  canteenId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  menuItems?: (MenuItem & { inventory?: InventoryRecord | null })[];
  _count?: { menuItems: number };
}

export interface InventoryRecord {
  id: string;
  menuItemId: string;
  currentStock: number;
  lowStockAlert: number;
  isUnlimited: boolean;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  canteenId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number | Decimal;
  imageUrl?: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  inventory?: InventoryRecord | null;
  category?: Category | null;
  canteen?: Canteen | null;
}

export interface PickupSlot {
  id: string;
  canteenId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  nameSnapshot: string;
  unitPriceSnapshot: number | Decimal;
  quantity: number;
  subtotal: number | Decimal;
  notes?: string | null;
  menuItem: MenuItem;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number | Decimal;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string | null;
  isSimulated: boolean;
  verifiedByStaffId?: string | null;
  verifiedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedByUserId?: string | null;
  note?: string | null;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  canteenId: string;
  pickupSlotId?: string | null;
  status: OrderStatus;
  subtotal: number | Decimal;
  tax: number | Decimal;
  convenienceFee: number | Decimal;
  total: number | Decimal;
  specialInstructions?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  pickupToken: string;
  createdAt: Date;
  updatedAt: Date;
  discount?: number | Decimal | null;
  promotionId?: string | null;
  guestTrackingTokenHash?: string | null;
  trackingTokenExpiresAt?: Date | null;
  paymentCollectionConfirmedAt?: Date | null;
  paymentConfirmedByStaffId?: string | null;
  pickupVerifiedAt?: Date | null;
  pickupVerifiedByStaffId?: string | null;
  canteen: Canteen;
  pickupSlot: PickupSlot;
  customer: User;
  items: OrderItem[];
  payment?: Payment | null;
  statusHistory?: OrderStatusHistory[];
}

export interface Promotion {
  id: string;
  title: string;
  subtitle?: string | null;
  description: string;
  imageUrl?: string | null;
  discountType: string;
  discountValue: number | Decimal;
  promoCode?: string | null;
  canteenId?: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number;
  badge?: string | null;
  maxDiscount?: number | Decimal | null;
  minOrderValue?: number | Decimal | null;
  placement?: string | null;
  targetCategoryId?: string | null;
  targetMenuItemId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  canteen?: Canteen | null;
}

export interface PromotionClick {
  id: string;
  promotionId: string;
  userId?: string | null;
  createdAt: Date;
}

export interface PromotionImpression {
  id: string;
  promotionId: string;
  userId?: string | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface NotificationLog {
  id: string;
  orderId?: string | null;
  recipient: string;
  subject: string;
  templateType: string;
  status: string;
  errorMessage?: string | null;
  metadata?: string | null;
  createdAt: Date;
}

export interface UserPreference {
  id: string;
  userId: string;
  dietaryPreference?: string | null;
  favoriteCanteenId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

export interface StaffAssignment {
  id: string;
  userId: string;
  canteenId: string;
  staffRole: string;
  createdAt: Date;
  user?: User | null;
  canteen?: Canteen | null;
}

export interface ModelDelegate<T> {
  findUnique(args: { where: Record<string, any>; include?: any; select?: any }): Promise<T | null>;
  findFirst(args?: { where?: Record<string, any>; include?: any; orderBy?: any; select?: any }): Promise<T | null>;
  findMany(args?: { where?: Record<string, any>; include?: any; orderBy?: any; take?: number; skip?: number; select?: any }): Promise<T[]>;
  create(args: { data: Record<string, any>; include?: any }): Promise<T>;
  createMany(args: { data: Record<string, any>[] }): Promise<{ count: number }>;
  update(args: { where: Record<string, any>; data: Record<string, any>; include?: any }): Promise<T>;
  updateMany(args: { where: Record<string, any>; data: Record<string, any> }): Promise<{ count: number }>;
  delete(args: { where: Record<string, any> }): Promise<T | null>;
  deleteMany(args?: { where?: Record<string, any> }): Promise<{ count: number }>;
  upsert(args: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }): Promise<T>;
  count(args?: { where?: Record<string, any> }): Promise<number>;
}

export interface NeonClient {
  user: ModelDelegate<User>;
  canteen: ModelDelegate<Canteen>;
  category: ModelDelegate<Category>;
  inventoryRecord: ModelDelegate<InventoryRecord>;
  menuItem: ModelDelegate<MenuItem>;
  notificationLog: ModelDelegate<NotificationLog>;
  order: ModelDelegate<Order>;
  orderItem: ModelDelegate<OrderItem>;
  orderStatusHistory: ModelDelegate<OrderStatusHistory>;
  passwordResetToken: ModelDelegate<PasswordResetToken>;
  payment: ModelDelegate<Payment>;
  pickupSlot: ModelDelegate<PickupSlot>;
  promotion: ModelDelegate<Promotion>;
  promotionClick: ModelDelegate<PromotionClick>;
  promotionImpression: ModelDelegate<PromotionImpression>;
  staffAssignment: ModelDelegate<StaffAssignment>;
  userPreference: ModelDelegate<UserPreference>;
  auditLog: ModelDelegate<AuditLog>;
  $transaction<R>(fn: (tx: NeonClient) => Promise<R>): Promise<R>;
  $queryRaw(strings: TemplateStringsArray | string, ...values: any[]): Promise<any>;
  $disconnect(): Promise<void>;
}

export class PrismaClient implements NeonClient {
  user!: ModelDelegate<User>;
  canteen!: ModelDelegate<Canteen>;
  category!: ModelDelegate<Category>;
  inventoryRecord!: ModelDelegate<InventoryRecord>;
  menuItem!: ModelDelegate<MenuItem>;
  notificationLog!: ModelDelegate<NotificationLog>;
  order!: ModelDelegate<Order>;
  orderItem!: ModelDelegate<OrderItem>;
  orderStatusHistory!: ModelDelegate<OrderStatusHistory>;
  passwordResetToken!: ModelDelegate<PasswordResetToken>;
  payment!: ModelDelegate<Payment>;
  pickupSlot!: ModelDelegate<PickupSlot>;
  promotion!: ModelDelegate<Promotion>;
  promotionClick!: ModelDelegate<PromotionClick>;
  promotionImpression!: ModelDelegate<PromotionImpression>;
  staffAssignment!: ModelDelegate<StaffAssignment>;
  userPreference!: ModelDelegate<UserPreference>;
  auditLog!: ModelDelegate<AuditLog>;
  $transaction!: <R>(fn: (tx: NeonClient) => Promise<R>) => Promise<R>;
  $queryRaw!: (strings: TemplateStringsArray | string, ...values: any[]) => Promise<any>;
  $disconnect!: () => Promise<void>;

  constructor(_options?: any) {
    try {
      const { neonClient } = require('@/lib/neon-db');
      return neonClient;
    } catch {
      return this;
    }
  }
}
