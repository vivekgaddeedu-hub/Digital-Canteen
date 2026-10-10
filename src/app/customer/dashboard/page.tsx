'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PromotionalCarousel } from '@/components/PromotionalCarousel';
import {
  UtensilsCrossed,
  Clock,
  QrCode,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertCircle,
  Leaf,
} from 'lucide-react';

interface ActiveOrder {
  id: string;
  orderNumber: string;
  pickupToken: string;
  status: string;
  total: number;
  canteen: {
    name: string;
    location: string;
  };
  pickupSlot: {
    startTime: string;
    endTime: string;
  };
  items: {
    nameSnapshot: string;
    quantity: number;
  }[];
}

interface CanteenSummary {
  id: string;
  name: string;
  slug: string;
  location: string;
  openingTime: string;
  closingTime: string;
  imageUrl: string | null;
}

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [canteens, setCanteens] = useState<CanteenSummary[]>([]);
  const [dietaryPref, setDietaryPref] = useState<'ANY' | 'VEG'>('ANY');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [ordersRes, canteensRes, prefRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/canteens'),
          fetch('/api/customer/preference'),
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          // Filter out collected and cancelled orders for active section
          const active = (data.orders || []).filter(
            (o: ActiveOrder) => o.status !== 'COLLECTED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
          );
          setActiveOrders(active);
        }

        if (canteensRes.ok) {
          const data = await canteensRes.json();
          setCanteens(data.canteens || []);
        }

        if (prefRes.ok) {
          const data = await prefRes.json();
          if (data.dietaryPreference === 'VEG') {
            setDietaryPref('VEG');
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const toggleDietaryPref = async (pref: 'ANY' | 'VEG') => {
    setDietaryPref(pref);
    try {
      await fetch('/api/customer/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietaryPreference: pref }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Greeting & Dietary Preference Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Student & Campus Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Hi, {user?.name || 'QuickBiter'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Skip the campus queues. Pre-order your meals, pick your slot, and pick up without waiting.
          </p>
        </div>

        {/* Dietary Preference Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => toggleDietaryPref('ANY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              dietaryPref === 'ANY'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            All Food
          </button>
          <button
            type="button"
            onClick={() => toggleDietaryPref('VEG')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              dietaryPref === 'VEG'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-emerald-700'
            }`}
          >
            <Leaf className="w-3 h-3" />
            Veg Only
          </button>
        </div>
      </div>

      {/* Hero Promotional Carousel */}
      <section aria-label="Personalized Campus Promotions">
        <PromotionalCarousel />
      </section>

      {/* Active Orders Live Tracking Bar */}
      {activeOrders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" />
              <span>Live Orders in Progress</span>
            </h2>
            <Link
              href="/orders"
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-brand-200/90 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-stone-500">
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          ord.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'PREPARING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ord.status === 'READY' ? 'Ready for Pickup 🔔' : ord.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-stone-900 mt-1">{ord.canteen.name}</h3>
                    <p className="text-xs text-stone-500">{ord.canteen.location}</p>
                  </div>

                  {/* Token Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-center">
                    <span className="block text-[9px] font-bold uppercase text-amber-700 tracking-wider">
                      Pickup Code
                    </span>
                    <span className="text-lg font-mono font-black text-amber-900 tracking-widest">
                      {ord.pickupToken}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-stone-600 border-t border-stone-100 pt-3 flex items-center justify-between">
                  <span>
                    Slot: <strong>{ord.pickupSlot.startTime} - {ord.pickupSlot.endTime}</strong>
                  </span>
                  <Link
                    href={`/orders/${ord.orderNumber}`}
                    className="font-bold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <span>View Pass</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Campus Canteens Directory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-brand-600" />
              <span>Campus Food Courts & Cafes</span>
            </h2>
            <p className="text-xs text-stone-500">Select your dining hall to view menu and reserve slots.</p>
          </div>
          <Link
            href="/canteens"
            className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {canteens.map((canteen) => (
            <Link
              key={canteen.id}
              href={`/canteen/${canteen.slug}`}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md hover:border-brand-300 transition group flex flex-col justify-between"
            >
              <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                {canteen.imageUrl ? (
                  <img
                    src={canteen.imageUrl}
                    alt={canteen.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{canteen.openingTime} - {canteen.closingTime}</span>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-black text-stone-900 group-hover:text-brand-600 transition">
                  {canteen.name}
                </h3>
                <p className="text-xs text-stone-500 line-clamp-1">{canteen.location}</p>
                <div className="pt-2 flex items-center text-xs font-bold text-brand-600 group-hover:translate-x-1 transition duration-200">
                  <span>Browse Menu & Order</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Link
          href="/orders"
          className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-brand-400 shadow-xs transition flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-900">Order History</h4>
            <p className="text-xs text-stone-500">View past bills and reorder favorite meals</p>
          </div>
        </Link>

        <Link
          href="/cart"
          className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-brand-400 shadow-xs transition flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-900">Your Tray / Cart</h4>
            <p className="text-xs text-stone-500">Check chosen items and pickup slot</p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-brand-400 shadow-xs transition flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-stone-900">Campus Account</h4>
            <p className="text-xs text-stone-500">Manage contact details and notifications</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
