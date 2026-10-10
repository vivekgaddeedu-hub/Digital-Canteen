'use client';

import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { Users, Plus, ChefHat, ShieldCheck, Mail, Phone, Lock } from 'lucide-react';
import { Role } from '@prisma/client';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  createdAt: string;
  staffAssignments: Array<{
    canteen: { id: string; name: string };
  }>;
}

interface CanteenOption {
  id: string;
  name: string;
}

export default function AdminStaffClient({
  initialStaff,
  canteens,
}: {
  initialStaff: StaffUser[];
  canteens: CanteenOption[];
}) {
  const { toast } = useToast();
  const [staffList, setStaffList] = useState<StaffUser[]>(initialStaff);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    canteenId: canteens[0]?.id || '',
    staffRole: 'KITCHEN_STAFF',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to create staff account', 'error');
      } else {
        toast('Staff member created & assigned successfully', 'success');
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
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Staff & Kitchen Team</h1>
          <p className="text-xs text-stone-500">
            Manage canteen operators, kitchen supervisors, and authorized terminal accounts.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Staff Member</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Assigned Canteen</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {staffList.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50 transition">
                  <td className="py-3.5 px-4 font-bold text-stone-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-[10px]">
                        {user.name.charAt(0)}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-stone-600">
                    <p>{user.email}</p>
                    <p className="text-[10px] text-stone-400">{user.phone || 'No phone'}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-800">
                    {user.staffAssignments[0]?.canteen.name || 'Global / Unassigned'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.role === Role.ADMIN
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-stone-400 font-mono text-[11px]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-black text-stone-900 text-base">Provision Staff Account</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Chef Roberto Diaz"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="roberto@quickbite.local"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Assigned Canteen
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
                  {isSubmitting ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
