'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  CheckCircle2,
  Ban,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Award,
  Store,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AnalyticsData {
  summary: {
    totalOrders: number;
    grossRevenue: number;
    averageOrderValue: number;
    completedCount: number;
    cancelledCount: number;
    rejectedCount: number;
    activeCount: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  bestSellers: Array<{ name: string; quantity: number; revenue: number }>;
  canteenSales: Array<{ name: string; orders: number; revenue: number }>;
  trend: Array<{ date: string; orders: number; revenue: number }>;
}

export default function AnalyticsDashboardClient({
  initialData,
}: {
  initialData: AnalyticsData;
}) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (r: 'today' | '7d' | '30d') => {
    setRange(r);
    fetchAnalytics(r);
  };

  const summary = data.summary;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Campus Dining Analytics
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time business performance derived directly from PostgreSQL transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time range selector */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => handleRangeChange('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === 'today' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleRangeChange('7d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === '7d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleRangeChange('30d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === '30d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Export CSV button */}
          <a
            href="/api/admin/export-csv"
            download
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Total Orders
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900">{summary.totalOrders}</span>
            <ShoppingBag className="w-5 h-5 text-stone-400" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Gross Order Value
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              ₹{summary.grossRevenue.toFixed(0)}
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-stone-400 font-medium">Excludes cancellations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Average Order Value
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-stone-900">
              ₹{summary.averageOrderValue.toFixed(0)}
            </span>
            <IndianRupee className="w-5 h-5 text-stone-400" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Active in Kitchen
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-brand-600">{summary.activeCount}</span>
            <Clock className="w-5 h-5 text-brand-500" />
          </div>
          <span className="text-[10px] text-stone-400 font-medium">Placed, prep, ready</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
            Completed / Cancelled
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black text-stone-900">
              {summary.completedCount} / <span className="text-rose-600">{summary.cancelledCount}</span>
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Revenue & Orders Trend</h2>
              <p className="text-xs text-stone-500">Daily gross turnover from non-cancelled orders</p>
            </div>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
              {range.toUpperCase()}
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {data.trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                No orders recorded in this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="date" stroke="#a8a29e" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                    name="Revenue (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">Orders by Status</h2>
            <p className="text-xs text-stone-500">Current lifecycle distribution</p>
          </div>

          <div className="space-y-2.5 pt-2">
            {data.statusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">{item.status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full"
                      style={{
                        width: `${
                          summary.totalOrders > 0
                            ? Math.round((item.count / summary.totalOrders) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="font-mono font-bold text-stone-900 w-6 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best Sellers & Canteen Sales Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Best Sellers */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top Best-Selling Menu Items</span>
            </h2>
            <span className="text-xs text-stone-400">By Portions Sold</span>
          </div>

          {data.bestSellers.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.bestSellers.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-stone-200 text-stone-700 font-extrabold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-stone-900">{item.name}</p>
                      <p className="text-[10px] text-stone-500">₹{item.revenue.toFixed(2)} total value</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {item.quantity} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales By Canteen */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-600" />
              <span>Turnover by Campus Canteen</span>
            </h2>
            <span className="text-xs text-stone-400">Volume & Revenue</span>
          </div>

          {data.canteenSales.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No canteen sales recorded.</p>
          ) : (
            <div className="space-y-3">
              {data.canteenSales.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <div>
                    <p className="font-bold text-xs text-stone-900">{c.name}</p>
                    <p className="text-[10px] text-stone-500">{c.orders} successful orders</p>
                  </div>
                  <span className="text-sm font-black text-emerald-700">
                    ₹{c.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
