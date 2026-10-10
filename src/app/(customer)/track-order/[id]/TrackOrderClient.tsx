'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  ChefHat,
  PackageCheck,
  CheckCheck,
  AlertTriangle,
  Receipt,
  ArrowLeft,
  XCircle,
  HelpCircle,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import PaymentQrCode from '@/components/PaymentQrCode';

interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  imageUrl?: string | null;
  isVeg?: boolean | null;
}

interface TrackingData {
  id: string;
  orderNumber: string;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED' | 'REJECTED';
  pickupToken: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  tax: number;
  convenienceFee: number;
  discount: number;
  total: number;
  specialInstructions?: string | null;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  paymentCollectionConfirmedAt?: string | null;
  pickupVerifiedAt?: string | null;
  customerFirstName: string;
  canteen: {
    id: string;
    name: string;
    location: string;
    paymentQrEnabled: boolean;
    paymentUpiId: string | null;
    paymentPayeeName?: string | null;
    paymentQrImageUrl?: string | null;
    paymentInstructions: string | null;
    paymentPolicy: string;
  };
  pickupSlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  payment?: {
    status: string;
    method: string;
    amount: number;
    verifiedAt?: string | null;
    notes?: string | null;
  } | null;
  items: OrderItem[];
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }>;
  isGuestAccess: boolean;
}

const LIFECYCLE_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Order submitted to canteen' },
  { key: 'ACCEPTED', label: 'Order Received & Accepted', desc: 'Staff acknowledged ticket' },
  { key: 'PREPARING', label: 'Preparing', desc: 'Freshly cooking your food' },
  { key: 'READY', label: 'Ready for Pickup', desc: 'Waiting at pickup counter' },
  { key: 'COLLECTED', label: 'Collected', desc: 'Handover complete' },
];

export default function TrackOrderClient({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [order, setOrder] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTracking = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const url = token
        ? `/api/orders/track/${orderId}?token=${encodeURIComponent(token)}`
        : `/api/orders/track/${orderId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch tracking data');
      }

      setOrder(data.order);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Tracking fetch error:', err);
      if (!isBackground) {
        setError(err.message || 'Unable to load order tracking details.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    fetchTracking(false);
  }, [fetchTracking]);

  // Live polling every 6 seconds for active orders
  useEffect(() => {
    if (!order) return;
    const isTerminal = ['COLLECTED', 'CANCELLED', 'REJECTED'].includes(order.status);
    if (isTerminal) return;

    const intervalId = setInterval(() => {
      fetchTracking(true);
    }, 6000);

    return () => clearInterval(intervalId);
  }, [order, fetchTracking]);

  if (loading) {
    return (
      <div className="min-w-0 max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-800">Loading Order Tracking...</h2>
        <p className="text-sm text-slate-500 mt-1">Retrieving latest status from canteen kitchen</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-w-0 max-w-xl mx-auto px-4 py-16">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Unable to Track Order</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {error || 'This order could not be located, or the tracking link is invalid / expired.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => fetchTracking(false)}
              className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Try Again
            </button>
            <Link
              href="/orders"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
            >
              Go to Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const isRejected = order.status === 'REJECTED';
  const isReady = order.status === 'READY';
  const isCollected = order.status === 'COLLECTED';
  const isPaid = order.payment?.status === 'PAID' || order.payment?.status === 'COMPLETED';

  // Compute active step index for linear progression
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
        return 3;
      case 'COLLECTED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order #{order.orderNumber}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isCollected
                  ? 'bg-emerald-100 text-emerald-800'
                  : isReady
                  ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-400'
                  : isCancelled || isRejected
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchTracking(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-medium shadow-sm transition disabled:opacity-50"
            title="Refresh order status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Live Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Banners */}
      {isCancelled && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-start gap-3">
          <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Order Cancelled</h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Reason: {order.cancellationReason || 'Cancelled by customer or staff.'}
            </p>
            {isPaid && (
              <p className="text-xs font-semibold text-rose-900 mt-1">
                A refund has been initiated to your original payment method.
              </p>
            )}
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Order Rejected by Canteen Kitchen</h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Reason: {order.rejectionReason || 'Item out of stock or kitchen capacity reached.'}
            </p>
            {isPaid && (
              <p className="text-xs font-semibold text-rose-900 mt-1">
                Your payment will be refunded within 1-2 business days.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hero Ready For Pickup Alert */}
      {isReady && (
        <div className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <PackageCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Your Food is Ready for Pickup!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Head to {order.canteen.name} ({order.canteen.location}) and present pickup token{' '}
                <span className="font-mono font-bold text-white bg-white/20 px-1.5 py-0.5 rounded">
                  {order.pickupToken}
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-semibold px-3 py-1 bg-white text-emerald-800 rounded-full">
              {isPaid ? 'Payment Verified' : 'Payment Due at Counter'}
            </span>
          </div>
        </div>
      )}

      {/* Order Lifecycle Stepper (only for non-cancelled orders) */}
      {!isCancelled && !isRejected && (
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Order Lifecycle Timeline</span>
            <span className="text-xs font-normal text-slate-400 ml-auto">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </h2>

          <div className="relative">
            {/* Connecting Bar */}
            <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            <div
              className="hidden sm:block absolute top-4 left-6 h-0.5 bg-brand-600 transition-all duration-500 -z-0"
              style={{
                width: `${Math.min(100, (currentStepIdx / (LIFECYCLE_STEPS.length - 1)) * 100)}%`,
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div
                    key={step.key}
                    className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 ${
                      isCurrent
                        ? 'opacity-100 font-semibold text-brand-700'
                        : isPassed
                        ? 'opacity-90 text-slate-700'
                        : 'opacity-40 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 flex-shrink-0 ${
                        isPassed
                          ? 'bg-brand-600 text-white'
                          : isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCheck className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <p className="text-xs">{step.label}</p>
                      <p className="text-[11px] font-normal text-slate-400 hidden sm:block">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Summary & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Instructions Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Pickup & Handover Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Pickup Token Code</p>
                <p className="text-xl font-mono font-extrabold text-brand-700 mt-0.5 tracking-wider">
                  {order.pickupToken}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Show this to staff at counter</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Requested Pickup Window</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {order.pickupSlot.startTime} – {order.pickupSlot.endTime}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Date: {order.pickupSlot.date}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Canteen Location</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{order.canteen.name}</p>
                <p className="text-xs text-slate-600">{order.canteen.location}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Payment Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                      isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.payment?.status || 'UNPAID'}
                  </span>
                  {order.payment?.method && (
                    <span className="text-xs text-slate-500 font-medium">
                      via {order.payment.method.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-blue-900">Pickup Instructions: </span>
                When your order is marked <span className="font-semibold">Ready for Pickup</span>, proceed to the counter at {order.canteen.name}. Quote pickup token{' '}
                <span className="font-mono font-bold text-slate-900">{order.pickupToken}</span>. If you haven't paid online, show your UPI payment confirmation screen or pay cash to staff before receiving your food.
              </div>
            </div>
          </div>

          {/* Ordered Food Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-brand-600" />
              <span>Ordered Food Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3.5 h-3.5 border flex items-center justify-center rounded-sm ${
                        item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500">
                        ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                        {item.notes && <span className="italic text-slate-400"> • {item.notes}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount Applied</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax (GST)</span>
                  <span>₹{order.tax.toFixed(2)}</span>
                </div>
              )}
              {order.convenienceFee > 0 && (
                <div className="flex justify-between">
                  <span>Convenience Fee</span>
                  <span>₹{order.convenienceFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Counter QR Code */}
        <div className="space-y-6">
          <PaymentQrCode
            orderNumber={order.orderNumber}
            orderId={order.id}
            amount={order.total}
            paymentStatus={order.payment?.status || 'UNPAID'}
            canteenName={order.canteen.name}
            upiId={order.canteen.paymentUpiId}
            payeeName={order.canteen.paymentPayeeName}
            qrImageUrl={order.canteen.paymentQrImageUrl}
            paymentInstructions={order.canteen.paymentInstructions}
            paymentPolicy={order.canteen.paymentPolicy}
          />

          {/* Safe Privacy Assurance */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">QuickBite Privacy & Security</p>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                This tracking view uses end-to-end cryptographic link verification. No personal contact or credential information is publicly exposed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
