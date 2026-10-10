'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import { Plus, Check, X, Trash2, Utensils, Search, AlertCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  canteenId: string;
  categoryId: string;
  canteen: { name: string };
  category: { name: string };
  inventory?: { currentStock: number } | null;
}

interface CanteenOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  canteenId: string;
  name: string;
}

export default function AdminMenuClient({
  initialItems,
  canteens,
  categories,
}: {
  initialItems: MenuItem[];
  canteens: CanteenOption[];
  categories: CategoryOption[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filterCanteen, setFilterCanteen] = useState('ALL');

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    canteenId: canteens[0]?.id || '',
    categoryId: categories[0]?.id || '',
    name: '',
    description: '',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTimeMinutes: 10,
    stock: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter categories based on selected canteen in form
  const availableCategoriesForForm = categories.filter(
    (c) => c.canteenId === formData.canteenId
  );

  const filteredItems = items.filter((item) => {
    if (filterCanteen !== 'ALL' && item.canteenId !== filterCanteen) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!item.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !current }),
      });
      if (res.ok) {
        toast(`Item availability updated`, 'success');
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isAvailable: !current } : i))
        );
      }
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast(`Deleted "${name}"`, 'success');
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
          preparationTimeMinutes: Number(formData.preparationTimeMinutes),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to create menu item', 'error');
      } else {
        toast('Menu item created successfully!', 'success');
        setModalOpen(false);
        // Refresh page or prepend item
        window.location.reload();
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Menu Catalog</h1>
          <p className="text-xs text-stone-500">
            Create, price, and manage all food items across university canteens.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Food Item</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-900 outline-hidden focus:border-brand-500"
          />
        </div>

        <select
          value={filterCanteen}
          onChange={(e) => setFilterCanteen(e.target.value)}
          className="px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-900 font-medium outline-hidden"
        >
          <option value="ALL">All Canteens</option>
          {canteens.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">Canteen</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <p className="font-bold text-stone-900">{item.name}</p>
                        <p className="text-[10px] text-stone-400">{item.preparationTimeMinutes}m prep</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-700">{item.canteen.name}</td>
                  <td className="py-3 px-4 text-stone-500">{item.category.name}</td>
                  <td className="py-3 px-4 font-bold text-stone-900">₹{item.price.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-800">
                    {item.inventory?.currentStock ?? 50}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggle(item.id, item.isAvailable)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-black text-stone-900 text-lg">Create New Menu Item</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Canteen
                  </label>
                  <select
                    required
                    value={formData.canteenId}
                    onChange={(e) => {
                      const newCanteenId = e.target.value;
                      const newCats = categories.filter((c) => c.canteenId === newCanteenId);
                      setFormData({
                        ...formData,
                        canteenId: newCanteenId,
                        categoryId: newCats[0]?.id || '',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    {canteens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    {availableCategoriesForForm.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Avocado Toast Deluxe"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Delicious freshly mashed hass avocado on artisan sourdough..."
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.preparationTimeMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preparationTimeMinutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Vegetarian Dish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Available Immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-bold text-stone-600 bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:bg-stone-300"
                >
                  {isSubmitting ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
