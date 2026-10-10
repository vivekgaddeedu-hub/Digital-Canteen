'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  ChefHat,
  ShieldCheck,
  Menu,
  X,
  Clock,
} from 'lucide-react';
import { Role } from '@prisma/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-stone-900">
                  QUICK<span className="text-brand-600">BITE</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  Campus
                </span>
              </div>
              <p className="text-[10px] text-stone-500 hidden md:block -mt-1 font-medium">
                Order Ahead. Skip the Queue.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/canteens"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/canteens') || isActive('/canteen')
                  ? 'text-brand-600 bg-brand-50 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Canteens & Menus
            </Link>

            {user && (
              <Link
                href={
                  user.role === Role.ADMIN
                    ? '/admin/dashboard'
                    : user.role === Role.STAFF
                    ? '/staff/dashboard'
                    : '/customer/dashboard'
                }
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive('/customer/dashboard') || isActive('/staff/dashboard') || isActive('/admin/dashboard')
                    ? 'text-brand-600 bg-brand-50 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 text-brand-600" />
                Dashboard
              </Link>
            )}

            {user && (
              <Link
                href="/orders"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive('/orders') && !isActive('/staff') && !isActive('/admin')
                    ? 'text-brand-600 bg-brand-50 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              My Orders
            </Link>
            )}

            {(user?.role === Role.STAFF || user?.role === Role.ADMIN) && (
              <Link
                href="/staff/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive('/staff')
                    ? 'text-amber-800 bg-amber-100 font-semibold'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                Staff Kitchen
              </Link>
            )}

            {user?.role === Role.ADMIN && (
              <Link
                href="/admin/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'text-indigo-800 bg-indigo-100 font-semibold'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Section: Cart & User */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-xl text-stone-700 hover:bg-stone-100 transition flex items-center"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* Auth Buttons or User Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition border border-stone-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left pr-1">
                    <p className="text-xs font-semibold text-stone-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">
                      {user.role}
                    </p>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in-50"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-900 truncate">{user.name}</p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href={
                        user.role === Role.ADMIN
                          ? '/admin/dashboard'
                          : user.role === Role.STAFF
                          ? '/staff/dashboard'
                          : '/customer/dashboard'
                      }
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-brand-700 bg-brand-50/50 hover:bg-brand-50 transition"
                    >
                      <UtensilsCrossed className="w-4 h-4 text-brand-600" />
                      Role Dashboard
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition"
                    >
                      <UserIcon className="w-4 h-4 text-stone-400" />
                      Account Profile
                    </Link>

                    <Link
                      href="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition"
                    >
                      <Clock className="w-4 h-4 text-stone-400" />
                      Order History
                    </Link>

                    {(user.role === Role.STAFF || user.role === Role.ADMIN) && (
                      <Link
                        href="/staff/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-800 hover:bg-amber-50 transition"
                      >
                        <ChefHat className="w-4 h-4 text-amber-600" />
                        Staff Kitchen Ops
                      </Link>
                    )}

                    {user.role === Role.ADMIN && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-indigo-800 hover:bg-indigo-50 transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Admin Operations
                      </Link>
                    )}

                    <div className="border-t border-stone-100 my-1" />

                    <button
                      onClick={() => logout()}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-stone-700 hover:text-stone-900 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {user && (
            <Link
              href={
                user.role === Role.ADMIN
                  ? '/admin/dashboard'
                  : user.role === Role.STAFF
                  ? '/staff/dashboard'
                  : '/customer/dashboard'
              }
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-bold text-brand-700 bg-brand-50"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/canteens"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-stone-800 hover:bg-stone-100"
          >
            Canteens & Menus
          </Link>
          {user && (
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-stone-800 hover:bg-stone-100"
            >
              My Orders
            </Link>
          )}
          {(user?.role === Role.STAFF || user?.role === Role.ADMIN) && (
            <Link
              href="/staff/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-amber-800 bg-amber-50"
            >
              Kitchen Operations
            </Link>
          )}
          {user?.role === Role.ADMIN && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-indigo-800 bg-indigo-50"
            >
              Admin Panel
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
