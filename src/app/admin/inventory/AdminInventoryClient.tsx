'use client';

import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { Boxes, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  currentStock: number;
  lowStockAlert: number;
  isUnlimited: boolean;
  menuItem: {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
    canteen: { name: string };
  };
}

export default function AdminInventoryClient({
  initialInventory,
}: {
  initialInventory: InventoryItem[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>(initialInventory);
  const [search, setSearch] = useState('');

  const filtered = items.filter((i) =>
    i.menuItem.name.toLowerCase().includes(search.toLowerCase()) ||
    i.menuItem.canteen.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter(
    (i) => !i.isUnlimited && i.currentStock <= i.lowStockAlert
  ).length;

  const handleUpdateStock = async (menuItemId: string, newStock: number) => {
    try {
      const res = await fetch(`/api/menu/${menuItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock: newStock }),
      });

      if (res.ok) {
        toast('Stock replenished', 'success');
        setItems((prev) =>
          prev.map((it) =>
            it.menuItem.id === menuItemId ? { ...it, currentStock: newStock } : it
          )
        );
      }
    } catch {
      toast('Failed to update stock', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-stone-500">
            Real-time kitchen portion reserves. Low stock alerts trigger automatic warnings.
          </p>
        </div>

        {lowStockCount > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{lowStockCount} items running low!</span>
          </div>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by dish or canteen..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-900 outline-hidden"
        />
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Menu Dish</th>
                <th className="py-3 px-4">Canteen</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((item) => {
                const isLow = !item.isUnlimited && item.currentStock <= item.lowStockAlert;
                const isSoldOut = !item.isUnlimited && item.currentStock <= 0;

                return (
                  <tr key={item.id} className="hover:bg-stone-50 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {item.menuItem.name}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">{item.menuItem.canteen.name}</td>
                    <td className="py-3.5 px-4 font-mono">₹{Number(item.menuItem.price).toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-stone-900">
                      {item.isUnlimited ? '∞' : item.currentStock}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-400">{item.lowStockAlert}</td>
                    <td className="py-3.5 px-4">
                      {isSoldOut ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                          Sold Out (0)
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="500"
                          defaultValue={item.currentStock}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== item.currentStock) {
                              handleUpdateStock(item.menuItem.id, val);
                            }
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-stone-200 text-xs font-bold text-center outline-hidden focus:border-brand-500"
                        />
                        <button
                          onClick={() => handleUpdateStock(item.menuItem.id, item.currentStock + 25)}
                          className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-brand-50 hover:text-brand-600 text-stone-700 font-bold text-[11px] transition"
                        >
                          +25
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
