'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    canteenName,
    canteenId,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    convenienceFee,
    total,
  } = useCart();

  const [clearModalOpen, setClearModalOpen] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
          You haven't added any delicious food yet. Head to one of our campus canteens and pick your lunch.
        </p>
        <div className="pt-2">
          <Link
            href="/canteens"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition"
          >
            <span>Explore Campus Menus</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Ordering from: {canteenName}</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Shopping Cart</h1>
        </div>

        <button
          onClick={() => setClearModalOpen(true)}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
        >
          <Trash2 className="w-4 h-4" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-7 space-y-4">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs flex items-center gap-4 transition hover:shadow-sm"
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-3 h-3 border-2 flex items-center justify-center shrink-0 ${
                      item.isVeg ? 'border-emerald-600' : 'border-rose-700'
                    }`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-rose-700'
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm truncate">{item.name}</h3>
                </div>
                <p className="text-xs text-stone-500 font-medium">₹{item.price.toFixed(2)} each</p>

                {/* Subtotal on mobile */}
                <p className="text-xs font-extrabold text-stone-900 sm:hidden">
                  Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl p-1">
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-100 flex items-center justify-center transition shadow-xs"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-xs font-extrabold text-stone-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-100 flex items-center justify-center transition shadow-xs"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Total Price & Delete */}
              <div className="hidden sm:block text-right min-w-[70px]">
                <span className="text-sm font-extrabold text-stone-900 block">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  className="text-[11px] text-stone-400 hover:text-rose-600 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              href="/canteens"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Add more food from this canteen</span>
            </Link>
          </div>
        </div>

        {/* Order Cost Breakdown Box */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-6 sticky top-24">
          <h2 className="text-lg font-black text-stone-900 pb-3 border-b border-stone-100">
            Payment Summary
          </h2>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-stone-900">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Campus Tax (GST 5%)</span>
              <span className="font-semibold text-stone-900">₹{tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Packaging & Express Prep</span>
              <span className="font-semibold text-stone-900">₹{convenienceFee.toFixed(2)}</span>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline">
              <div>
                <span className="text-base font-black text-stone-900 block">Total Due</span>
                <span className="text-[11px] text-stone-400 font-medium">Inclusive of all taxes</span>
              </div>
              <span className="text-2xl font-black text-brand-600">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Live inventory reserved upon checkout completion.</span>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            <span>Proceed to Pickup & Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={clearModalOpen}
        title="Empty Shopping Cart?"
        message="Are you sure you want to remove all food items from your cart?"
        confirmLabel="Empty Cart"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          clearCart();
          setClearModalOpen(false);
        }}
        onCancel={() => setClearModalOpen(false)}
      />
    </div>
  );
}
