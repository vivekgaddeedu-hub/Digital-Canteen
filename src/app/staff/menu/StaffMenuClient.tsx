'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { ArrowLeft, Check, X, Utensils, AlertTriangle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  inventory?: {
    currentStock: number;
    lowStockAlert: number;
  } | null;
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

export default function StaffMenuClient({
  canteen,
  categories: initialCategories,
}: {
  canteen: { id: string; name: string };
  categories: Category[];
}) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleAvailability = async (itemId: string, currentVal: boolean) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentVal }),
      });

      if (!res.ok) {
        toast('Failed to update availability', 'error');
      } else {
        toast(`Marked ${!currentVal ? 'Available' : 'Unavailable'}`, 'success');
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            menuItems: cat.menuItems.map((item) =>
              item.id === itemId ? { ...item, isAvailable: !currentVal } : item
            ),
          }))
        );
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStock = async (itemId: string, newStock: number) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock: newStock }),
      });

      if (!res.ok) {
        toast('Failed to update stock', 'error');
      } else {
        toast(`Stock updated to ${newStock}`, 'success');
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            menuItems: cat.menuItems.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    inventory: item.inventory
                      ? { ...item.inventory, currentStock: newStock }
                      : { currentStock: newStock, lowStockAlert: 10 },
                  }
                : item
            ),
          }))
        );
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <Link
            href="/staff"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Kitchen Queue</span>
          </Link>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Menu Stock & Availability
          </h1>
          <p className="text-xs text-stone-500">
            Quickly disable sold-out dishes or update kitchen stock for {canteen.name}.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-brand-600" />
              <span>{cat.name} ({cat.menuItems.length} items)</span>
            </h2>

            <div className="divide-y divide-stone-100">
              {cat.menuItems.map((item) => {
                const stock = item.inventory?.currentStock ?? 50;
                const isBusy = updatingId === item.id;

                return (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3.5 h-3.5 border-2 flex items-center justify-center shrink-0 ${
                          item.isVeg ? 'border-emerald-600' : 'border-rose-700'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-700'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-900">{item.name}</p>
                        <p className="text-xs text-stone-500 font-mono">₹{item.price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      {/* Stock Quick Editor */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-stone-500 font-medium">Stock:</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          defaultValue={stock}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== stock) {
                              updateStock(item.id, val);
                            }
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-stone-200 font-bold text-center text-xs outline-hidden focus:border-brand-500"
                        />
                      </div>

                      {/* Toggle Availability Switch */}
                      <button
                        onClick={() => toggleAvailability(item.id, item.isAvailable)}
                        disabled={isBusy}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
