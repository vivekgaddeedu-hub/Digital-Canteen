import React from 'react';
import { FileSpreadsheet, Download, ShieldCheck, Database } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-3 border-b border-stone-200">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Financial & Order Reports</h1>
        <p className="text-xs text-stone-500">
          Export verified transaction records and order history for campus accounting and inventory audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 1: Full Orders Master CSV */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900">Orders Master Transaction Ledger</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Complete historical dump of all orders, breakdown of food items, subtotals, GST taxes, customer identifiers, and payment methods.
            </p>
          </div>

          <a
            href="/api/admin/export-csv"
            download
            className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Orders Master (.CSV)</span>
          </a>
        </div>

        {/* Report 2: Audit & Database Schema Status */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900">Database Integrity Assurance</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              PostgreSQL relational schema enforces snapshot preservation, atomic transactions, and inventory consistency for each recorded ticket.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All reports verified against PostgreSQL live state.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
