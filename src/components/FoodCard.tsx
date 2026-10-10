'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export interface FoodCardItem {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  canteenId: string;
  canteenName: string;
  categoryId?: string;
  inventory?: {
    currentStock: number;
    lowStockAlert: number;
    isUnlimited: boolean;
  } | null;
}

interface FoodCardProps {
  item: FoodCardItem;
  onCanteenConflict?: (targetCanteen: string) => void;
}

export default function FoodCard({ item, onCanteenConflict }: FoodCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { toast } = useToast();

  const numPrice = Number(item.price);
  const cartEntry = items.find((i) => i.menuItemId === item.id);
  const currentQuantity = cartEntry ? cartEntry.quantity : 0;

  const isSoldOut =
    !item.isAvailable ||
    (item.inventory && !item.inventory.isUnlimited && item.inventory.currentStock <= 0);

  const isLowStock =
    item.inventory &&
    !item.inventory.isUnlimited &&
    item.inventory.currentStock > 0 &&
    item.inventory.currentStock <= (item.inventory.lowStockAlert || 10);

  const handleAdd = () => {
    if (isSoldOut) return;
    const res = addItem({
      menuItemId: item.id,
      name: item.name,
      price: numPrice,
      imageUrl: item.imageUrl,
      canteenId: item.canteenId,
      canteenName: item.canteenName,
      isVeg: item.isVeg,
    });

    if (res.requiresCanteenSwitch) {
      if (onCanteenConflict) {
        onCanteenConflict(item.canteenName);
      } else {
        toast(`Your cart currently contains items from another canteen. Please clear your cart first.`, 'error');
      }
    } else {
      toast(`Added "${item.name}" to cart`, 'success');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Image Container */}
        <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                isSoldOut ? 'grayscale contrast-75' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
              No Image Available
            </div>
          )}

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
            <div
              className={`w-3.5 h-3.5 border-2 flex items-center justify-center ${
                item.isVeg ? 'border-emerald-600' : 'border-rose-700'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  item.isVeg ? 'bg-emerald-600' : 'bg-rose-700'
                }`}
              />
            </div>
          </div>

          {/* Prep Time Tag */}
          <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Clock className="w-3 h-3 text-brand-400" />
            {item.preparationTimeMinutes}m
          </div>

          {/* Sold out overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-stone-900 text-base leading-snug group-hover:text-brand-600 transition">
              {item.name}
            </h3>
          </div>

          {item.description && (
            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Low stock alert */}
          {isLowStock && !isSoldOut && (
            <p className="text-[11px] font-semibold text-amber-700 pt-1">
              ⚡ Only {item.inventory?.currentStock} portions left!
            </p>
          )}
        </div>
      </div>

      {/* Footer / Price & Action */}
      <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between mt-auto">
        <div>
          <span className="text-xs text-stone-400 font-medium block">Price</span>
          <span className="text-lg font-extrabold text-stone-900">
            ₹{numPrice.toFixed(2)}
          </span>
        </div>

        {/* Add Button or Quantity Selector */}
        {isSoldOut ? (
          <button
            disabled
            className="px-3.5 py-1.5 text-xs font-semibold text-stone-400 bg-stone-100 rounded-xl cursor-not-allowed"
          >
            Unavailable
          </button>
        ) : currentQuantity > 0 ? (
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => updateQuantity(item.id, currentQuantity - 1)}
              className="w-7 h-7 rounded-lg bg-white text-brand-700 hover:bg-brand-100 flex items-center justify-center transition shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-5 text-center text-xs font-bold text-brand-900">
              {currentQuantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, currentQuantity + 1)}
              className="w-7 h-7 rounded-lg bg-brand-600 text-white hover:bg-brand-700 flex items-center justify-center transition shadow-xs"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Order
          </button>
        )}
      </div>
    </div>
  );
}
