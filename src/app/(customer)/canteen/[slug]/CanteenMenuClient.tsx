'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import FoodCard, { FoodCardItem } from '@/components/FoodCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useCart } from '@/context/CartContext';
import {
  Search,
  MapPin,
  Clock,
  ShoppingBag,
  SlidersHorizontal,
  Leaf,
  Drumstick,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface PickupSlot {
  id: string;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  isFull: boolean;
}

interface CanteenData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  location: string;
  openingTime: string;
  closingTime: string;
  imageUrl?: string | null;
  categories: Array<Category & { menuItems: any[] }>;
  pickupSlots: PickupSlot[];
}

export default function CanteenMenuClient({ canteen }: { canteen: CanteenData }) {
  const { items: cartItems, subtotal, totalQuantity, clearCart } = useCart();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [pendingCanteenName, setPendingCanteenName] = useState('');

  // Flatten all items with canteen metadata
  const allItems: FoodCardItem[] = useMemo(() => {
    const list: FoodCardItem[] = [];
    for (const cat of canteen.categories) {
      for (const item of cat.menuItems) {
        list.push({
          ...item,
          canteenId: canteen.id,
          canteenName: canteen.name,
        });
      }
    }
    return list;
  }, [canteen]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Category match
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Diet match
      if (dietFilter === 'VEG' && !item.isVeg) return false;
      if (dietFilter === 'NON_VEG' && item.isVeg) return false;
      // Search match
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [allItems, selectedCategory, dietFilter, search]);

  const handleCanteenConflict = (cName: string) => {
    setPendingCanteenName(cName);
    setConflictModalOpen(true);
  };

  const handleConfirmSwitch = () => {
    clearCart();
    setConflictModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Canteen Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[220px] flex flex-col justify-end p-6 sm:p-10 shadow-lg">
        {canteen.imageUrl && (
          <Image
            src={canteen.imageUrl}
            alt={canteen.name}
            fill
            priority
            className="object-cover opacity-40 mix-blend-overlay"
          />
        )}
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-400">
            <span className="px-2.5 py-0.5 rounded-full bg-stone-800/80 border border-stone-700">
              Open Now
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {canteen.openingTime} – {canteen.closingTime}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {canteen.location}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{canteen.name}</h1>
          {canteen.description && (
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              {canteen.description}
            </p>
          )}
        </div>
      </div>

      {/* Available Slots Strip */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
          <CalendarDays className="w-4 h-4 text-brand-600" />
          <span>Today's Pickup Windows ({canteen.pickupSlots.length} Slots Available)</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {canteen.pickupSlots.map((slot) => (
            <div
              key={slot.id}
              className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                slot.isFull
                  ? 'bg-stone-100 border-stone-200 text-stone-400 line-through'
                  : 'bg-stone-50 border-stone-200 text-stone-800 hover:border-brand-300'
              }`}
            >
              <span className="font-bold">{slot.startTime} – {slot.endTime}</span>
              <span className="ml-1.5 text-[10px] text-stone-500 font-mono">
                {slot.isFull ? '(Full)' : `(${slot.remainingCapacity} left)`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search burgers, bowls, smoothies..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm text-stone-900 outline-hidden transition shadow-xs"
            />
          </div>

          {/* Diet toggle */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/80 self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setDietFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dietFilter === 'ALL'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietFilter('VEG')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                dietFilter === 'VEG'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-stone-600 hover:text-emerald-700'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              Veg Only
            </button>
            <button
              onClick={() => setDietFilter('NON_VEG')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                dietFilter === 'NON_VEG'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-stone-600 hover:text-rose-800'
              }`}
            >
              <Drumstick className="w-3.5 h-3.5 text-rose-600" />
              Non-Veg
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'ALL'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All Categories ({allItems.length})
          </button>
          {canteen.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.name} ({cat.menuItems.length})
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-lg">No menu items found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            We couldn't find any items matching your filters. Try clearing your search or diet selector.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('ALL');
              setDietFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              onCanteenConflict={handleCanteenConflict}
            />
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 animate-in slide-in-from-bottom-5">
          <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-sm">
                {totalQuantity}
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">Subtotal ({totalQuantity} items)</p>
                <p className="text-base font-extrabold text-white">₹{subtotal.toFixed(2)}</p>
              </div>
            </div>

            <Link
              href="/cart"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-md transition flex items-center gap-1.5"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Multi-canteen Conflict Modal */}
      <ConfirmDialog
        isOpen={conflictModalOpen}
        title="Switch Canteen?"
        message={`Your cart already contains items from another canteen. A single order can only include food from one canteen at a time. Would you like to clear your current cart and switch to ${pendingCanteenName}?`}
        confirmLabel="Clear Cart & Switch"
        cancelLabel="Keep Current Cart"
        isDestructive={true}
        onConfirm={handleConfirmSwitch}
        onCancel={() => setConflictModalOpen(false)}
      />
    </div>
  );
}
