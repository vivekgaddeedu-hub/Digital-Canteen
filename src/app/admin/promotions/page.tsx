'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tag,
  Plus,
  BarChart3,
  MousePointerClick,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  ArrowLeft,
  Percent,
  Coins,
} from 'lucide-react';

interface AdminPromotionItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  imageUrl: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  promoCode: string | null;
  badge: string | null;
  canteen: { name: string } | null;
  category: { name: string } | null;
  placement: string;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  orders: number;
  ctr: string;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<AdminPromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('20');
  const [maxDiscount, setMaxDiscount] = useState('50');
  const [minOrderValue, setMinOrderValue] = useState('150');
  const [promoCode, setPromoCode] = useState('');
  const [badge, setBadge] = useState('SPECIAL DEAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/admin/promotions');
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions || []);
      }
    } catch (err) {
      console.warn('Failed to fetch promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });

      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !currentStatus } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle promotion status:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle: subtitle || undefined,
          description,
          imageUrl,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
          minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
          promoCode: promoCode ? promoCode.toUpperCase() : undefined,
          badge: badge || undefined,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create promotion');
      } else {
        setShowCreateModal(false);
        // Reset form
        setTitle('');
        setDescription('');
        setImageUrl('');
        setPromoCode('');
        fetchPromotions();
      }
    } catch {
      setErrorMsg('Network error. Failed to create promotion.');
    } finally {
      setSaving(false);
    }
  };

  // Compute aggregate metrics
  const totalImpressions = promotions.reduce((acc, p) => acc + p.impressions, 0);
  const totalClicks = promotions.reduce((acc, p) => acc + p.clicks, 0);
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
  const activeCount = promotions.filter((p) => p.isActive).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/dashboard"
              className="text-xs font-bold text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations
            </Link>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-600" />
            <span>Promotional Offers & Carousel Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Create hero banners, personalized discounts, and analyze student engagement.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Promotion</span>
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider">
            Active Campaigns
          </span>
          <div className="text-2xl font-black text-stone-900">
            {activeCount}{' '}
            <span className="text-xs text-stone-400 font-normal">/ {promotions.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider">
              Impressions
            </span>
            <Eye className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalImpressions}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider">
              Clicks
            </span>
            <MousePointerClick className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalClicks}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider">
              Overall CTR
            </span>
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{avgCtr}%</div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-bold text-stone-900 text-sm">All Configured Promotions</h2>
          <span className="text-xs text-stone-500">{promotions.length} total offers</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Loading promotions...</div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            No promotions configured. Click "New Promotion" to launch an offer!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-[11px] font-bold uppercase text-stone-500 border-b border-stone-100">
                <tr>
                  <th className="py-3 px-4">Offer / Banner</th>
                  <th className="py-3 px-4">Code / Discount</th>
                  <th className="py-3 px-4">Impressions</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4">CTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={p.imageUrl}
                          alt={p.title}
                          width={48}
                          height={40}
                          unoptimized
                          className="w-12 h-10 object-cover rounded-lg shrink-0 border border-stone-200"
                        />
                        <div className="max-w-xs">
                          <p className="font-bold text-stone-900 truncate">{p.title}</p>
                          <p className="text-[11px] text-stone-400 truncate">{p.subtitle || p.badge}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 font-mono font-bold text-stone-800 text-[11px]">
                          {p.promoCode || 'AUTO'}
                        </span>
                        <p className="text-[10px] text-stone-500">
                          {p.discountType === 'PERCENTAGE'
                            ? `${p.discountValue}% off (max ₹${p.maxDiscount || '∞'})`
                            : `Flat ₹${p.discountValue} off`}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">{p.impressions}</td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">{p.clicks}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{p.ctr}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {p.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-stone-400" /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleStatus(p.id, p.isActive)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          p.isActive
                            ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-black text-stone-900">Launch New Promotional Offer</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Promotion Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lunch Hour Super Saver: 20% Off"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Valid on all hot bowls"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. 20% OFF / VEG SPECIAL"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of the offer for students..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Food Image URL *</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FLAT')}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Promo Code (Optional)</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. CAMPUS20"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20"
                >
                  {saving ? 'Creating...' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
