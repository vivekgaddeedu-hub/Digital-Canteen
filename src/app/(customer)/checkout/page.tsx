'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PaymentMethod } from '@prisma/client';
import {
  Clock,
  CreditCard,
  QrCode,
  Banknote,
  ShieldAlert,
  ArrowRight,
  Store,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface PickupSlot {
  id: string;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  isFull: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, canteenId, canteenName, subtotal, tax, convenienceFee, total, clearCart } = useCart();
  const { toast } = useToast();

  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.SIMULATED_CARD);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch slots for this canteen
  useEffect(() => {
    if (!canteenId) return;

    async function loadSlots() {
      try {
        setLoadingSlots(true);
        const res = await fetch(`/api/slots?canteenId=${canteenId}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
          // Preselect first available slot
          const firstAvailable = (data.slots || []).find((s: PickupSlot) => !s.isFull);
          if (firstAvailable) {
            setSelectedSlotId(firstAvailable.id);
          }
        }
      } catch (err) {
        console.error('Failed to load slots', err);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [canteenId]);

  // If cart is empty, redirect
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Your Cart is Empty</h2>
        <p className="text-xs text-stone-500">Add food before proceeding to checkout.</p>
        <Link
          href="/canteens"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          View Canteens
        </Link>
      </div>
    );
  }

  // If not logged in
  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-5 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">Authentication Required</h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          Please sign in with your campus account to select a pickup slot and confirm your order.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-md transition"
          >
            Sign In with Campus ID
          </Link>
          <Link
            href="/register"
            className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-800 font-bold text-xs hover:bg-stone-200 transition"
          >
            Create New Account
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSlotId) {
      setErrorMsg('Please select an available pickup time window.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        canteenId,
        pickupSlotId: selectedSlotId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        specialInstructions: specialInstructions.trim() || undefined,
        paymentMethod,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to place order.');
        setIsSubmitting(false);
        return;
      }

      // Success! Clear cart and route to confirmation
      clearCart();
      toast('Order confirmed successfully!', 'success');
      router.push(`/orders/confirmation/${data.order.id}`);
    } catch {
      setErrorMsg('Network error while placing order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
          <Store className="w-4 h-4" />
          <span>Fulfilling at: {canteenName}</span>
        </div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Checkout & Pickup Slot</h1>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Slot selection & instructions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pickup Slot Selector */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-stone-900">Choose Pickup Window</h2>
              </div>
              <span className="text-xs text-stone-400">Today's Schedule</span>
            </div>

            {loadingSlots ? (
              <div className="py-8 text-center text-xs text-stone-400 animate-pulse">
                Loading live kitchen slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs">
                No slots currently active for this canteen today.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={slot.isFull}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        slot.isFull
                          ? 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                          : 'bg-white border-stone-200 hover:border-brand-300'
                      }`}
                    >
                      <span className="block text-xs font-bold text-stone-900">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span
                        className={`block text-[11px] font-medium mt-1 ${
                          slot.isFull
                            ? 'text-rose-600 font-bold'
                            : isSelected
                            ? 'text-brand-700 font-bold'
                            : 'text-stone-500'
                        }`}
                      >
                        {slot.isFull ? 'Slot Full' : `${slot.remainingCapacity} slots left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span>Select Payment Method</span>
            </h2>

            <div className="space-y-3">
              {/* Option 1: Card */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === PaymentMethod.SIMULATED_CARD
                    ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === PaymentMethod.SIMULATED_CARD}
                  onChange={() => setPaymentMethod(PaymentMethod.SIMULATED_CARD)}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-stone-900">
                      Credit / Debit Card (Simulated Sandbox)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Instant sandbox transaction confirmation. No real charge incurred.
                  </p>
                </div>
              </label>

              {/* Option 2: UPI */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === PaymentMethod.SIMULATED_UPI
                    ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === PaymentMethod.SIMULATED_UPI}
                  onChange={() => setPaymentMethod(PaymentMethod.SIMULATED_UPI)}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-stone-900">
                      UPI QR Payment (GPay, PhonePe, Paytm & BHIM)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Scan UPI QR to Santosh Reddy (avi258369@oksbi) on order tracking page or at counter pickup.
                  </p>
                </div>
              </label>

              {/* Option 3: Cash */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === PaymentMethod.CASH_ON_PICKUP
                    ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === PaymentMethod.CASH_ON_PICKUP}
                  onChange={() => setPaymentMethod(PaymentMethod.CASH_ON_PICKUP)}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-stone-900">
                      Cash on Pickup
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Pay with physical cash or card at the pickup counter prior to collection.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Special Kitchen Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra spicy, no onions, keep sauce on the side..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-stone-900 outline-hidden transition"
            />
          </div>
        </div>

        {/* Right Summary Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 p-6 shadow-sm space-y-6 sticky top-24">
          <h2 className="text-lg font-black text-stone-900 pb-3 border-b border-stone-100">
            Order Review ({items.length} items)
          </h2>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {items.map((it) => (
              <div key={it.menuItemId} className="flex justify-between items-center text-xs">
                <span className="text-stone-700 font-medium">
                  {it.quantity}x {it.name}
                </span>
                <span className="font-bold text-stone-900">
                  ₹{(it.price * it.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-stone-100 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-800">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>GST Tax (5%)</span>
              <span className="font-semibold text-stone-800">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Packaging Fee</span>
              <span className="font-semibold text-stone-800">₹{convenienceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-stone-100">
              <span className="text-sm font-black text-stone-900">Total Payable</span>
              <span className="text-xl font-black text-brand-600">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px] text-stone-500 space-y-1">
            <p className="font-bold text-stone-700">Campus Pre-Order Guarantee:</p>
            <p>Your meal is freshly prepped for your selected window. You will receive a secure pickup token upon confirmation.</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedSlotId}
            className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition flex items-center justify-center gap-2 disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Confirm & Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
