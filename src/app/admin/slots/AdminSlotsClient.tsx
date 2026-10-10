'use client';

import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { CalendarClock, Plus, Check, X } from 'lucide-react';

interface SlotItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  isActive: boolean;
  canteen: { name: string };
}

interface CanteenOption {
  id: string;
  name: string;
}

export default function AdminSlotsClient({
  initialSlots,
  canteens,
}: {
  initialSlots: SlotItem[];
  canteens: CanteenOption[];
}) {
  const { toast } = useToast();
  const [slots, setSlots] = useState<SlotItem[]>(initialSlots);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    canteenId: canteens[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '12:15',
    maxCapacity: 20,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxCapacity: Number(formData.maxCapacity),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to create slot', 'error');
      } else {
        toast('Pickup slot created successfully', 'success');
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
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Pickup Slots & Capacity</h1>
          <p className="text-xs text-stone-500">
            Regulate dining traffic windows and prevent kitchen congestion during lunch peak.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pickup Slot</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Canteen</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Window Time</th>
                <th className="py-3 px-4">Bookings / Cap</th>
                <th className="py-3 px-4">Available Spots</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {slots.map((s) => {
                const remaining = Math.max(0, s.maxCapacity - s.currentBookings);
                const isFull = s.currentBookings >= s.maxCapacity;

                return (
                  <tr key={s.id} className="hover:bg-stone-50 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900">{s.canteen.name}</td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">{s.date}</td>
                    <td className="py-3.5 px-4 font-bold text-stone-800">
                      {s.startTime} – {s.endTime}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {s.currentBookings} / {s.maxCapacity}
                    </td>
                    <td className="py-3.5 px-4">
                      {isFull ? (
                        <span className="text-rose-600 font-bold">0 (Full)</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">{remaining} remaining</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-black text-stone-900 text-base">Configure Time Slot</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Canteen
                </label>
                <select
                  required
                  value={formData.canteenId}
                  onChange={(e) => setFormData({ ...formData, canteenId: e.target.value })}
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
                  Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="12:00"
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="12:15"
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Max Order Capacity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="200"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) })}
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
                  {isSubmitting ? 'Saving...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
