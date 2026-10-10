'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  PackageCheck,
  CheckCheck,
  Ban,
  QrCode,
  RefreshCw,
  SlidersHorizontal,
  AlertCircle,
  XCircle,
  Search,
  Utensils,
  CreditCard,
  ShieldAlert,
  DollarSign,
  Check,
} from 'lucide-react';

interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

interface StaffOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  convenienceFee: number;
  total: number;
  pickupToken: string;
  specialInstructions?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  customer: {
    name: string;
    phone?: string | null;
  };
  pickupSlot: {
    startTime: string;
    endTime: string;
    date: string;
  };
  items: OrderItem[];
  payment?: {
    id: string;
    status: PaymentStatus;
    method: string;
    amount: number;
    verifiedAt?: string | null;
    verifiedByStaffId?: string | null;
    notes?: string | null;
  } | null;
  canteen?: {
    paymentPolicy?: string;
  } | null;
  acknowledgedAt?: string | null;
}

interface StaffDashboardProps {
  canteen: {
    id: string;
    name: string;
    location: string;
  };
  initialOrders: StaffOrder[];
}

export default function StaffDashboardClient({ canteen, initialOrders }: StaffDashboardProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<StaffOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Out of essential ingredients for one or more items');
  const [isRejecting, setIsRejecting] = useState(false);

  // Verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  // Payment confirmation dialog state (Phase 7)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<StaffOrder | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Pickup handover confirmation modal state (Phase 8)
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [selectedPickupOrder, setSelectedPickupOrder] = useState<StaffOrder | null>(null);
  const [isCompletingPickup, setIsCompletingPickup] = useState(false);

  // Auto-refresh orders every 10 seconds
  const fetchOrders = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/orders?canteenId=${canteen.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, [canteen.id]);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Acknowledge order receipt (Phase 2 & Phase 7)
  const handleAcknowledgeTicket = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/acknowledge`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to acknowledge order ticket', 'error');
      } else {
        toast('Order ticket acknowledged. Customer notified via email.', 'success');
        fetchOrders();
      }
    } catch {
      toast('Network error acknowledging order ticket', 'error');
    }
  };

  // Confirm manual payment collection (Phase 7)
  const handleConfirmPayment = async () => {
    if (!selectedPaymentOrder) return;
    setIsConfirmingPayment(true);
    try {
      const res = await fetch(`/api/orders/${selectedPaymentOrder.id}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedPaymentOrder.payment?.method || 'CASH_AT_COUNTER',
          notes: 'Cash/UPI payment collected and verified at counter by staff',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to confirm payment collection', 'error');
      } else {
        toast(
          `Payment of ₹${Number(selectedPaymentOrder.total).toFixed(2)} verified & recorded!`,
          'success'
        );
        setPaymentModalOpen(false);
        setSelectedPaymentOrder(null);
        fetchOrders();
      }
    } catch {
      toast('Network error confirming payment collection', 'error');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Complete pickup handover (Phase 8)
  const handleConfirmPickupHandover = async () => {
    if (!selectedPickupOrder) return;
    setIsCompletingPickup(true);
    try {
      const res = await fetch('/api/orders/verify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupToken: selectedPickupOrder.pickupToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Pickup handover verification failed', 'error');
      } else {
        toast('Pickup verified! Order marked as COLLECTED.', 'success');
        setPickupModalOpen(false);
        setSelectedPickupOrder(null);
        fetchOrders();
      }
    } catch {
      toast('Network error during pickup handover', 'error');
    } finally {
      setIsCompletingPickup(false);
    }
  };

  // Update order status action
  const handleStatusChange = async (orderId: string, toStatus: OrderStatus, reason?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to update order status', 'error');
      } else {
        toast(`Order moved to ${toStatus}`, 'success');
        // Update local list
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: toStatus, rejectionReason: reason || o.rejectionReason } : o))
        );
      }
    } catch {
      toast('Network error during status transition', 'error');
    }
  };

  // Reject confirmation
  const handleConfirmReject = async () => {
    if (!rejectOrderId) return;
    setIsRejecting(true);
    await handleStatusChange(rejectOrderId, OrderStatus.REJECTED, rejectionReason);
    setIsRejecting(false);
    setRejectModalOpen(false);
    setRejectOrderId(null);
  };

  // Verify Pickup Token
  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTokenInput.trim()) return;

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const res = await fetch('/api/orders/verify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupToken: verifyTokenInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyResult({ success: false, message: data.error || 'Verification failed.' });
      } else {
        setVerifyResult({
          success: true,
          message: `Verified! Hand over meal to ${data.order.customerName}. Order marked as COLLECTED.`,
        });
        toast('Order marked as COLLECTED', 'success');
        fetchOrders();
      }
    } catch {
      setVerifyResult({ success: false, message: 'Network error verifying token.' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Filter orders by tab & search
  const filteredOrders = orders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchToken = o.pickupToken.toLowerCase().includes(q);
      const matchCust = o.customer.name.toLowerCase().includes(q);
      if (!matchNum && !matchToken && !matchCust) return false;
    }

    if (activeTab === 'NEW') return o.status === OrderStatus.PLACED;
    if (activeTab === 'ACCEPTED') return o.status === OrderStatus.ACCEPTED;
    if (activeTab === 'PREPARING') return o.status === OrderStatus.PREPARING;
    if (activeTab === 'READY') return o.status === OrderStatus.READY;
    if (activeTab === 'COMPLETED') return o.status === OrderStatus.COLLECTED;
    if (activeTab === 'CANCELLED') return o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REJECTED;

    return (
      [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY] as OrderStatus[]
    ).includes(o.status);
  });

  const countNew = orders.filter((o) => o.status === OrderStatus.PLACED).length;
  const countAccepted = orders.filter((o) => o.status === OrderStatus.ACCEPTED).length;
  const countPreparing = orders.filter((o) => o.status === OrderStatus.PREPARING).length;
  const countReady = orders.filter((o) => o.status === OrderStatus.READY).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <ChefHat className="w-4 h-4" />
            <span>Kitchen Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {canteen.name}
          </h1>
          <p className="text-xs text-stone-500">📍 {canteen.location}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Verify Token Button */}
          <button
            onClick={() => {
              setVerifyTokenInput('');
              setVerifyResult(null);
              setVerifyModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
          >
            <QrCode className="w-4 h-4 text-brand-400" />
            <span>Verify Pickup Code</span>
          </button>

          {/* Menu Availability Link */}
          <Link
            href="/staff/menu"
            className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition flex items-center gap-2"
          >
            <Utensils className="w-4 h-4 text-amber-600" />
            <span>Manage Menu Stock</span>
          </Link>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            aria-label="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('NEW')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'NEW' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' : 'bg-white border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">New Orders</span>
          <span className="text-2xl font-black text-amber-900">{countNew}</span>
        </button>

        <button
          onClick={() => setActiveTab('ACCEPTED')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'ACCEPTED' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20' : 'bg-white border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Accepted</span>
          <span className="text-2xl font-black text-blue-900">{countAccepted}</span>
        </button>

        <button
          onClick={() => setActiveTab('PREPARING')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'PREPARING' ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/20' : 'bg-white border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">In Preparation</span>
          <span className="text-2xl font-black text-indigo-900">{countPreparing}</span>
        </button>

        <button
          onClick={() => setActiveTab('READY')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'READY' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20' : 'bg-white border-stone-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Ready for Handover</span>
          <span className="text-2xl font-black text-emerald-900">{countReady}</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'ACTIVE'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All Active Queue
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'COMPLETED'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Collected History
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'CANCELLED'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Cancelled / Rejected
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, order#, or name..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white text-stone-900 outline-hidden focus:border-brand-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-stone-800 text-base">No orders in this view</h3>
          <p className="text-xs text-stone-500">Incoming tickets for {canteen.name} will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
                order.status === OrderStatus.READY
                  ? 'border-emerald-300 ring-2 ring-emerald-100'
                  : order.status === OrderStatus.PLACED
                  ? 'border-amber-300 ring-1 ring-amber-100'
                  : 'border-stone-200'
              }`}
            >
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-extrabold text-sm text-stone-900">
                    {order.orderNumber}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                  <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 font-mono">
                    Token: {order.pickupToken}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    Pickup Window: {order.pickupSlot.startTime} – {order.pickupSlot.endTime}
                  </span>
                  <span>•</span>
                  <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Customer and Items */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-2">
                  <div className="text-xs">
                    <span className="font-bold text-stone-900">{order.customer.name}</span>
                    {order.customer.phone && (
                      <span className="text-stone-400 ml-2">({order.customer.phone})</span>
                    )}
                  </div>

                  {/* Food Items */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 space-y-1.5 text-xs">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="font-bold text-stone-800">
                          <span className="text-brand-600 font-extrabold">{item.quantity}x</span>{' '}
                          {item.nameSnapshot}
                        </span>
                        <span className="font-mono text-stone-500">
                          ₹{Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900">
                      <span className="font-bold">Kitchen Note:</span> {order.specialInstructions}
                    </div>
                  )}

                  {order.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <span className="font-bold">Rejection Reason:</span> {order.rejectionReason}
                    </div>
                  )}

                  {/* Payment Section & Collection Checkbox (Phase 7) */}
                  <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3 text-xs space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-700 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                        <span>Payment Status:</span>
                      </span>
                      <span
                        className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded uppercase tracking-wider ${
                          order.payment?.status === PaymentStatus.PAID ||
                          order.payment?.status === PaymentStatus.COMPLETED
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : order.payment?.status === PaymentStatus.REFUNDED
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {order.payment?.status || 'UNPAID'}
                      </span>
                    </div>

                    {order.payment?.status !== PaymentStatus.REFUNDED && (
                      <div className="pt-2 border-t border-stone-200/70">
                        {order.payment?.status === PaymentStatus.PAID ||
                        order.payment?.status === PaymentStatus.COMPLETED ? (
                          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>Payment collected and verified</span>
                            {order.payment?.verifiedAt && (
                              <span className="text-[10px] text-emerald-600 font-normal ml-auto">
                                Verified {new Date(order.payment.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <label
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedPaymentOrder(order);
                              setPaymentModalOpen(true);
                            }}
                            className="flex items-center gap-2 cursor-pointer text-stone-700 hover:text-stone-900 font-medium select-none"
                          >
                            <input
                              type="checkbox"
                              readOnly
                              checked={false}
                              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-stone-300 cursor-pointer"
                            />
                            <span>Payment collected and verified</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Transition Action Buttons */}
                <div className="md:col-span-4 flex flex-col justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-right text-xs text-stone-500 mb-1">
                    Total: <span className="font-black text-stone-900 text-sm">₹{Number(order.total).toFixed(2)}</span>
                  </div>

                  {/* Status: PLACED */}
                  {order.status === OrderStatus.PLACED && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStatusChange(order.id, OrderStatus.ACCEPTED)}
                          className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Order</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectOrderId(order.id);
                            setRejectModalOpen(true);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-700 border border-stone-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>

                      {/* Ticket Acknowledged Action (Phase 2) */}
                      <button
                        onClick={() => handleAcknowledgeTicket(order.id)}
                        className="w-full py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition flex items-center justify-center gap-1"
                        title="Notify customer that staff acknowledged ticket receipt"
                      >
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span>Acknowledge Ticket Receipt</span>
                      </button>
                    </div>
                  )}

                  {/* Status: ACCEPTED */}
                  {order.status === OrderStatus.ACCEPTED && (
                    <button
                      onClick={() => handleStatusChange(order.id, OrderStatus.PREPARING)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Cooking / Preparation</span>
                    </button>
                  )}

                  {/* Status: PREPARING */}
                  {order.status === OrderStatus.PREPARING && (
                    <button
                      onClick={() => handleStatusChange(order.id, OrderStatus.READY)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Mark Ready for Pickup</span>
                    </button>
                  )}

                  {/* Status: READY (Phase 8 Pickup Completion Interface) */}
                  {order.status === OrderStatus.READY && (
                    <div className="space-y-2">
                      {!(order.payment?.status === PaymentStatus.PAID || order.payment?.status === PaymentStatus.COMPLETED) && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-tight">
                          <span className="font-bold flex items-center gap-1 mb-0.5">
                            <ShieldAlert className="w-3 h-3 text-amber-600" /> Payment Required:
                          </span>
                          Payment must be collected and verified before completing pickup, according to the configured canteen policy.
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSelectedPickupOrder(order);
                          setPickupModalOpen(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>Confirm Order Pickup (Handover)</span>
                      </button>
                    </div>
                  )}

                  {/* Status: COLLECTED */}
                  {order.status === OrderStatus.COLLECTED && (
                    <span className="text-center text-xs text-stone-400 font-bold py-1">
                      Completed & Handed to Student
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      <ConfirmDialog
        isOpen={rejectModalOpen}
        title="Reject Order?"
        message="Please provide an appropriate explanation for rejecting this order. The customer will be notified, and all inventory portions will be restored."
        confirmLabel="Reject Order"
        cancelLabel="Keep in Queue"
        isDestructive={true}
        isLoading={isRejecting}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectOrderId(null);
        }}
      />

      {/* Confirm Payment Collection Modal (Phase 7 Specification) */}
      {paymentModalOpen && selectedPaymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">Confirm Payment Collection</h3>
              </div>
              <button
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedPaymentOrder(null);
                }}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Have you received and verified the payment for this order?
            </p>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-stone-900">
                  #{selectedPaymentOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Amount Due:</span>
                <span className="text-base font-extrabold text-stone-900 font-mono">
                  ₹{Number(selectedPaymentOrder.total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Current Payment Status:</span>
                <span className="font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  {selectedPaymentOrder.payment?.status || 'UNPAID'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Payment Method:</span>
                <span className="font-semibold text-stone-700">
                  {selectedPaymentOrder.payment?.method || 'CASH_AT_COUNTER'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedPaymentOrder(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmingPayment}
                onClick={handleConfirmPayment}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isConfirmingPayment ? 'Recording...' : 'Confirm Payment Received'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Order Pickup Handover Modal (Phase 8 Specification) */}
      {pickupModalOpen && selectedPickupOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-stone-900 text-base">Confirm Order Pickup</h3>
              </div>
              <button
                onClick={() => {
                  setPickupModalOpen(false);
                  setSelectedPickupOrder(null);
                }}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-stone-900">
                  #{selectedPickupOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Pickup Token:</span>
                <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {selectedPickupOrder.pickupToken}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Customer:</span>
                <span className="font-bold text-stone-800">
                  {selectedPickupOrder.customer.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Payment Status:</span>
                <span
                  className={`font-bold uppercase px-2 py-0.5 rounded ${
                    selectedPickupOrder.payment?.status === PaymentStatus.PAID ||
                    selectedPickupOrder.payment?.status === PaymentStatus.COMPLETED
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedPickupOrder.payment?.status || 'UNPAID'}
                </span>
              </div>
            </div>

            {/* If payment outstanding, show policy block */}
            {!(
              selectedPickupOrder.payment?.status === PaymentStatus.PAID ||
              selectedPickupOrder.payment?.status === PaymentStatus.COMPLETED
            ) ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Payment Required Before Pickup
                </p>
                <p className="text-[11px] leading-relaxed">
                  According to canteen policy, payment of ₹
                  {Number(selectedPickupOrder.total).toFixed(2)} must be collected and verified before completing handover.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedPickupOrder;
                    setPickupModalOpen(false);
                    setSelectedPaymentOrder(ord);
                    setPaymentModalOpen(true);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition"
                >
                  Collect & Verify Payment First
                </button>
              </div>
            ) : (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 font-medium">
                ✓ Payment has been verified. Hand over meal to student and complete pickup.
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPickupModalOpen(false);
                  setSelectedPickupOrder(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isCompletingPickup ||
                  !(
                    selectedPickupOrder.payment?.status === PaymentStatus.PAID ||
                    selectedPickupOrder.payment?.status === PaymentStatus.COMPLETED
                  )
                }
                onClick={handleConfirmPickupHandover}
                className="px-5 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                {isCompletingPickup ? 'Completing...' : 'Confirm Pickup Handover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Pickup Token Dialog */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-stone-900 text-base">Verify Customer Pickup Code</h3>
              </div>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyPickup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Enter 6-digit Code or Order #
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={verifyTokenInput}
                  onChange={(e) => setVerifyTokenInput(e.target.value.toUpperCase())}
                  placeholder="e.g. PK-9942A or QB-20261010-..."
                  className="w-full p-3 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-stone-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden transition"
                />
              </div>

              {verifyResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    verifyResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {verifyResult.message}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !verifyTokenInput.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition flex items-center gap-1.5 disabled:bg-stone-300"
                >
                  {isVerifying ? 'Verifying...' : 'Verify & Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
