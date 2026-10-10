import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import {
  UtensilsCrossed,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Flame,
  ArrowRight,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { PromotionalCarousel } from '@/components/PromotionalCarousel';

export const revalidate = 60; // ISR 1 minute

export default async function LandingPage() {
  // Fetch real database data for preview
  const canteens = await prisma.canteen.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { menuItems: true } },
    },
    take: 3,
  });

  const featuredItems = await prisma.menuItem.findMany({
    where: { isAvailable: true },
    include: { canteen: true },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-4 pb-12 sm:pt-10 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Campus Digital Dining 2.0</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
              Order Ahead. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-amber-500">
                Skip the Queue.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
              Never waste lunch breaks waiting in long canteen lines. Pre-order freshly cooked meals,
              pick your arrival window, and collect hot food in seconds using your unique pickup code.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/canteens"
                className="px-6 py-3.5 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-md shadow-brand-500/25 hover:shadow-lg transition flex items-center gap-2 group"
              >
                Browse Canteens & Menus
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-white text-stone-800 font-bold text-sm hover:bg-stone-50 border border-stone-300 shadow-sm transition"
              >
                Sign In with Campus ID
              </Link>
            </div>

            {/* Micro badges */}
            <div className="pt-6 border-t border-stone-200/80 flex flex-wrap items-center gap-6 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Wait Times</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Guaranteed Portion Reservation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Real-Time Kitchen Status</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-xl border border-stone-200/90 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600">
                    Live Status Tracker
                  </span>
                  <h3 className="text-base font-extrabold text-stone-900">Order #QB-2026-9942</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Ready at Counter
                </span>
              </div>

              <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-stone-100 shadow-inner">
                <Image
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                  alt="Delicious Bowl"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-stone-900">Crispy Paneer Tikka Bowl</p>
                  <p className="text-xs text-stone-500">Pickup Slot: 12:15 PM – 12:30 PM</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block font-mono">Pickup Code</span>
                  <span className="text-base font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 font-mono">
                    PK-9942A
                  </span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                <span>Central Food Court • Counter 1</span>
                <span className="font-semibold text-stone-900">₹180.00 Paid</span>
              </div>
            </div>

            {/* Floating accent badge */}
            <div className="absolute -bottom-5 -left-4 bg-stone-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 hidden sm:flex">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">Average Pickup Time</p>
                <p className="text-sm font-bold text-white">Under 45 Seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Promotional Carousel */}
      <section aria-label="Campus Specials & Limited-time Offers">
        <PromotionalCarousel />
      </section>

      {/* How it Works Section */}
      <section className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 shadow-sm">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-600">
            Effortless Dining Flow
          </span>
          <h2 className="text-3xl font-extrabold text-stone-900">How QUICKBITE Works</h2>
          <p className="text-sm text-stone-600">
            Four simple steps from choosing your favorite meal to eating without queue frustrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-lg shadow-xs">
              01
            </div>
            <h4 className="font-bold text-stone-900 text-base">Select Your Canteen</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore your campus canteens and browse real-time available menus categorized by diet and cravings.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-lg shadow-xs">
              02
            </div>
            <h4 className="font-bold text-stone-900 text-base">Pick Arrival Window</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Choose an available 15-minute pickup slot. Guaranteed capacity ensures the kitchen isn't overwhelmed.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-lg shadow-xs">
              03
            </div>
            <h4 className="font-bold text-stone-900 text-base">Instant Pre-Payment</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Pay via card, UPI, or cash on pickup. Receive a unique cryptographic pickup token immediately.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-lg shadow-xs">
              04
            </div>
            <h4 className="font-bold text-stone-900 text-base">Flash Code & Collect</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Head straight to the express pickup station, show your code or QR, grab your meal, and enjoy!
            </p>
          </div>
        </div>
      </section>

      {/* Campus Canteens Showcase */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-600">
              Campus Dining Hubs
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">Available Canteens</h2>
          </div>
          <Link
            href="/canteens"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All Canteens
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {canteens.map((c) => (
            <Link
              key={c.id}
              href={`/canteen/${c.slug}`}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                  {c.imageUrl && (
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-md">
                    {c.openingTime} – {c.closingTime}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-lg text-stone-900 group-hover:text-brand-600 transition">
                    {c.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                  <p className="text-xs text-stone-400 font-medium">📍 {c.location}</p>
                </div>
              </div>

              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                <span>{c._count.menuItems} menu options</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Browse Menu &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Items Preview */}
      {featuredItems.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-brand-600">
                Fresh & Hot
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                Popular Menu Items
              </h2>
            </div>
            <Link
              href="/canteens"
              className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Order Now
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 w-full bg-stone-100">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm p-1 rounded-md">
                      <div
                        className={`w-3 h-3 border-2 flex items-center justify-center ${
                          item.isVeg ? 'border-emerald-600' : 'border-rose-700'
                        }`}
                      >
                        <div
                          className={`w-1 h-1 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-700'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider block">
                      {item.canteen.name}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm leading-snug">
                      {item.name}
                    </h4>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 text-base">
                    ₹{Number(item.price).toFixed(2)}
                  </span>
                  <Link
                    href={`/canteen/${item.canteen.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-brand-50 hover:text-brand-600 text-xs font-bold text-stone-700 transition"
                  >
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
            Campus Dining Reimagined
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Ready to Skip the Line Today?
          </h2>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            Create your account in seconds, browse the live kitchen inventory, and experience
            seamless food pickup right on time.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition"
            >
              Create Free Account
            </Link>
            <Link
              href="/canteens"
              className="px-6 py-3.5 rounded-xl bg-stone-800 text-stone-200 font-bold text-sm hover:bg-stone-700 border border-stone-700 transition"
            >
              Explore Menus First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
