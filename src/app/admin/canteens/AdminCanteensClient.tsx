'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import { Store, Plus, Clock, MapPin, Check, X } from 'lucide-react';

interface CanteenItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  location: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  imageUrl?: string | null;
  _count: {
    menuItems: number;
    categories: number;
  };
}

export default function AdminCanteensClient({
  initialCanteens,
}: {
  initialCanteens: CanteenItem[];
}) {
  const { toast } = useToast();
  const [canteens, setCanteens] = useState<CanteenItem[]>(initialCanteens);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    location: '',
    openingTime: '08:00',
    closingTime: '21:00',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/canteens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to create canteen', 'error');
      } else {
        toast('Canteen created successfully!', 'success');
        setModalOpen(false);
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
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Canteen Hubs</h1>
          <p className="text-xs text-stone-500">
            Configure locations, operating hours, and active statuses.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Canteen</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canteens.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs flex flex-col justify-between">
            <div>
              <div className="relative h-44 w-full bg-stone-100">
                {c.imageUrl && (
                  <Image src={c.imageUrl} alt={c.name} fill className="object-cover" />
                )}
                <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-lg">
                  {c.openingTime} – {c.closingTime}
                </div>
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-stone-900">{c.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 line-clamp-2">{c.description}</p>
                <p className="text-xs text-stone-400 font-medium">📍 {c.location}</p>
              </div>
            </div>

            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-semibold">
              <span>{c._count.categories} Categories</span>
              <span>{c._count.menuItems} Dishes</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-black text-stone-900 text-base">Add Campus Canteen</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCanteen} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Canteen Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setFormData({ ...formData, name, slug });
                  }}
                  placeholder="e.g. Science Quad Hub"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="science-quad-hub"
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Physics Hall, Ground Floor"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Opening Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    placeholder="08:00"
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Closing Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    placeholder="21:00"
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
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
                  {isSubmitting ? 'Saving...' : 'Save Canteen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
