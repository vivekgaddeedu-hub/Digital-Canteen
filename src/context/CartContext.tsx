'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TAX_RATE, CONVENIENCE_FEE } from '@/lib/order-utils';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  canteenId: string;
  canteenName: string;
  isVeg: boolean;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  canteenId: string | null;
  canteenName: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => { success: boolean; requiresCanteenSwitch?: boolean };
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  convenienceFee: number;
  total: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'quickbite_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  }, [items, isHydrated]);

  const canteenId = items.length > 0 ? items[0].canteenId : null;
  const canteenName = items.length > 0 ? items[0].canteenName : null;

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    if (items.length > 0 && items[0].canteenId !== newItem.canteenId) {
      return { success: false, requiresCanteenSwitch: true };
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === newItem.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === newItem.menuItemId
            ? { ...i, quantity: Math.min(20, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: Math.min(20, quantity) }];
    });

    return { success: true };
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: Math.min(20, quantity) } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = items.length > 0 ? Number((subtotal * TAX_RATE).toFixed(2)) : 0;
  const convenienceFee = items.length > 0 ? CONVENIENCE_FEE : 0;
  const total = items.length > 0 ? Number((subtotal + tax + convenienceFee).toFixed(2)) : 0;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        canteenId,
        canteenName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        convenienceFee,
        total,
        totalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
