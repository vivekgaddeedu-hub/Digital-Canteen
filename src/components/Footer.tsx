import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Shield, Clock, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                QUICK<span className="text-brand-500">BITE</span>
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Order Ahead. Skip the Queue. Built for fast campus dining, zero wait times, and seamless kitchen operations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Campus Dining</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/canteens" className="hover:text-white transition">
                  Browse Canteens
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition">
                  Live Order Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Hours */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Canteen Timings</h4>
            <div className="space-y-2 text-sm text-stone-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>Mon – Fri: 08:00 AM – 09:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>Student Union & Tech Quad Hubs</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Strict Food Safety & Freshness Guarantee</span>
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div className="space-y-2.5 bg-stone-800/60 p-4 rounded-xl border border-stone-700/60">
            <h4 className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
              Campus Pre-Order System
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Equipped with PostgreSQL persistence, real-time status transitions, QR code tokens, and simulated secure payments.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} QUICKBITE Systems. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for campus productivity.
          </p>
        </div>
      </div>
    </footer>
  );
}
