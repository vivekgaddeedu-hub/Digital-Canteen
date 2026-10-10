import { z } from 'zod';
import { OrderStatus, PaymentMethod, Role } from '@prisma/client';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100),
    confirmPassword: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== '') {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const promotionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  subtitle: z.string().max(150).optional().nullable(),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  imageUrl: z.string().url('Please provide a valid image URL'),
  discountType: z.enum(['PERCENTAGE', 'FLAT']).default('PERCENTAGE'),
  discountValue: z.number().min(0, 'Discount value cannot be negative'),
  maxDiscount: z.number().min(0).optional().nullable(),
  minOrderValue: z.number().min(0).default(0),
  promoCode: z.string().max(20).optional().nullable(),
  badge: z.string().max(30).optional().nullable(),
  canteenId: z.string().uuid().optional().nullable(),
  targetCategoryId: z.string().uuid().optional().nullable(),
  targetMenuItemId: z.string().uuid().optional().nullable(),
  placement: z.string().default('HERO_CAROUSEL'),
  priority: z.number().int().default(1),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean().default(true),
});

export const userPreferenceSchema = z.object({
  dietaryPreference: z.enum(['ANY', 'VEG', 'NON_VEG']).default('ANY'),
  favoriteCanteenId: z.string().uuid().optional().nullable(),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(20, 'Maximum 20 per item'),
  notes: z.string().max(200).optional(),
});

export const createOrderSchema = z.object({
  canteenId: z.string().uuid('Invalid canteen ID'),
  pickupSlotId: z.string().uuid('Invalid pickup slot ID'),
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  specialInstructions: z.string().max(300).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.SIMULATED_CARD),
});

export const orderStatusUpdateSchema = z.object({
  toStatus: z.nativeEnum(OrderStatus),
  reason: z.string().max(250).optional(),
  note: z.string().max(250).optional(),
});

export const verifyPickupSchema = z.object({
  pickupToken: z.string().min(3, 'Pickup code is required'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Please provide a cancellation reason').max(250),
});

export const menuItemSchema = z.object({
  canteenId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive('Price must be greater than 0'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  preparationTimeMinutes: z.number().int().min(1).max(120).default(15),
  stock: z.number().int().min(0).default(50),
});

export const canteenSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric and dashes'),
  description: z.string().max(500).optional(),
  location: z.string().min(2).max(100),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const pickupSlotSchema = z.object({
  canteenId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:MM'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:MM'),
  maxCapacity: z.number().int().min(1).max(200).default(20),
});
