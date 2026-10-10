'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import PaymentQrCode from '@/components/PaymentQrCode';
import {
  Clock,
  MapPin,
  RefreshCw,
  Ban,
  ChefHat,
  PackageCheck,
  CheckCheck,
  AlertCircle,
  Receipt,
  ArrowLeft,
  QrCode,
} from 'lucide-react';

interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitPriceSnapshot: number | string;
  quantity: number;
  subtotal: number | string;
  notes?: string | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number | string;
  tax: number | string;
  convenienceFee: number | string;
  total: number | string;
  pickupToken: string;
  specialInstructions?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  canteen: {
    name: string;
    location: string;
  };
  pickupSlot: {
    startTime: string;
    endTime: string;
    date: string;
  };
  payment?: {
    method: string;
    status: PaymentStatus;
    transactionRef?: string | null;
    isSimulated: boolean;
  } | null;
  items: OrderItem[];
  statusHistory: Array<{
    id: string;
    toStatus: OrderStatus;
    note?: string | null;
    createdAt: string;
  }>;
}

const STEPS: Array<{ key: OrderStatus; label: string; icon: any }> = [
  { key: OrderStatus.PLACED, label: 'Placed', icon: Clock },
  { key: OrderStatus.ACCEPTED, label: 'Accepted', icon: ChefHat },
  { key: OrderStatus.PREPARING, label: 'Preparing', icon: ChefHat },
  { key: OrderStatus.READY, label: 'Ready for Pickup', icon: PackageCheck },
  { key: OrderStatus.COLLECTED, label: 'Collected', icon: CheckCheck },
];

export default function OrderTrackingClient({ initialOrder }: { initialOrder: OrderData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans / Ordered by mistake');
  const [cancelling, setCancelling] = useState(false);

  // Poll for status updates every 8 seconds if order is active
  useEffect(() => {
    const isTerminal = (
      [OrderStatus.COLLECTED, OrderStatus.CANCELLED, OrderStatus.REJECTED] as OrderStatus[]
    ).includes(order.status);

    if (isTerminal) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order && data.order.status !== order.status) {
            toast(`Order status updated to: ${data.order.status}`, 'info');
          }
          setOrder(data.order);
        }
      } catch {
        // silent
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [order.id, order.status, toast]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        toast('Order refreshed', 'info');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to cancel order', 'error');
      } else {
        toast('Order cancelled and inventory restored', 'success');
        setOrder(data.order);
        setCancelModalOpen(false);
      }
    } catch {
      toast('Network error during cancellation', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Determine current step index
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isRejected = order.status === OrderStatus.REJECTED;
  const canCancel = order.status === OrderStatus.PLACED || order.status === OrderStatus.ACCEPTED;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top back button & header */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Status Hero Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-stone-500">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} size="md" />
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {order.canteen.name}
            </h1>
            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              {order.canteen.location}
            </p>
          </div>

          {/* Pickup Token Pill */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center sm:text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 block">
              Pickup Code
            </span>
            <span className="text-2xl font-black text-brand-600 font-mono tracking-wider">
              {order.pickupToken}
            </span>
          </div>
        </div>

        {/* Progress Timeline Stepper */}
        {!isCancelled && !isRejected ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Kitchen Preparation Status
            </h3>
            <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
              {STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 ring-4 ring-brand-100 scale-105'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-brand-600 font-black'
                          : isPassed
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Ban className="w-5 h-5 text-rose-600" />
              <span>
                {isCancelled ? 'Order Was Cancelled' : 'Order Was Rejected by Kitchen'}
              </span>
            </div>
            <p className="text-xs text-rose-700">
              Reason: {order.cancellationReason || order.rejectionReason || 'No reason provided.'}
            </p>
          </div>
        )}

        {/* Pickup Arrival Window Notice */}
        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-bold text-stone-900">
                Scheduled Pickup Window: {order.pickupSlot.startTime} – {order.pickupSlot.endTime}
              </p>
              <p className="text-stone-500 text-[11px]">Date: {order.pickupSlot.date}</p>
            </div>
          </div>

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 self-start sm:self-auto transition"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* UPI Payment QR Code Card if payment is not completed */}
      {order.payment?.status !== PaymentStatus.COMPLETED &&
        order.payment?.status !== ('PAID' as any) &&
        !isCancelled &&
        !isRejected && (
          <PaymentQrCode
            orderNumber={order.orderNumber}
            orderId={order.id}
            amount={order.total}
            paymentStatus={order.payment?.status || 'UNPAID'}
            canteenName={order.canteen.name}
            upiId="avi258369@oksbi"
            payeeName="Santosh Reddy"
            qrImageUrl="/images/upi-payment-qr.jpg"
          />
        )}

      {/* Order Item Snapshot & Payment Summary */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-base font-black text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
          <Receipt className="w-5 h-5 text-brand-600" />
          <span>Order Details & Snapshots</span>
        </h2>

        {/* Items */}
        <div className="space-y-3">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between items-center text-xs sm:text-sm">
              <div>
                <span className="font-bold text-stone-800">
                  {it.quantity}x {it.nameSnapshot}
                </span>
                <span className="text-stone-400 ml-2 font-mono text-xs">
                  (@ ₹{Number(it.unitPriceSnapshot).toFixed(2)})
                </span>
                {it.notes && (
                  <p className="text-[11px] text-stone-500 italic mt-0.5">Note: {it.notes}</p>
                )}
              </div>
              <span className="font-bold text-stone-900">
                ₹{Number(it.subtotal).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
            <span className="font-bold text-stone-700">Special Instructions:</span> {order.specialInstructions}
          </div>
        )}

        {/* Financials */}
        <div className="space-y-2 pt-4 border-t border-stone-100 text-xs">
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span>
            <span className="font-semibold text-stone-800">₹{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Tax (5% GST)</span>
            <span className="font-semibold text-stone-800">₹{Number(order.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Packaging & Convenience</span>
            <span className="font-semibold text-stone-800">₹{Number(order.convenienceFee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-stone-100">
            <span className="text-sm font-black text-stone-900">Total Paid</span>
            <span className="text-xl font-black text-brand-600">₹{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Metadata */}
        {order.payment && (
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <div>
              <span>Payment: </span>
              <span className="font-bold text-stone-800 uppercase">{order.payment.method}</span>
              {order.payment.isSimulated && (
                <span className="ml-1 text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                  Simulated Sandbox
                </span>
              )}
            </div>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                order.payment.status === PaymentStatus.COMPLETED
                  ? 'bg-emerald-50 text-emerald-700'
                  : order.payment.status === PaymentStatus.REFUNDED
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {order.payment.status}
            </span>
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        title="Cancel This Order?"
        message="Are you sure you want to cancel this order? Portions will be returned to the canteen inventory and slot capacity will be freed."
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Order"
        isDestructive={true}
        isLoading={cancelling}
        onConfirm={handleCancelOrder}
        onCancel={() => setCancelModalOpen(false)}
      />
    </div>
  );
}
