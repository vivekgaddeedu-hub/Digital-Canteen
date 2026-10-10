import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { MapPin, Clock, ArrowRight, Utensils, Sparkles } from 'lucide-react';
import { PromotionalCarousel } from '@/components/PromotionalCarousel';

export const dynamic = 'force-dynamic';

export default async function CanteensPage() {
  let canteens: Array<{
    id: string;
    name: string;
    slug: string;
    location: string;
    description: string | null;
    imageUrl: string | null;
    openingTime: string;
    closingTime: string;
    categories: { name: string }[];
    _count: { menuItems: number };
  }> = [];

  try {
    canteens = (await prisma.canteen.findMany({
      where: { isActive: true },
      include: {
        categories: {
          select: { name: true },
          take: 3,
        },
        _count: {
          select: {
            menuItems: { where: { isAvailable: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })) as any;
  } catch (err) {
    console.warn('CanteensPage: Database unavailable during build or query:', err);
  }

  return (
    <div className="space-y-8">
      {/* Promotional Carousel */}
      <section aria-label="Campus Food Deals & Specials">
        <PromotionalCarousel />
      </section>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Campus Dining Hubs
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Select a Campus Canteen
        </h1>
        <p className="text-sm text-stone-500 max-w-2xl">
          Each canteen features its own kitchen specials, dedicated pickup counter, and time slots.
          Select a location to browse today's live menu and place an order.
        </p>
      </div>

      {/* Canteens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(canteens || []).map((canteen: any) => (
          <div
            key={canteen.id}
            className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Cover Image */}
              <div className="relative h-52 w-full bg-stone-100 overflow-hidden">
                {canteen.imageUrl ? (
                  <Image
                    src={canteen.imageUrl}
                    alt={canteen.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <Utensils className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-3.5 right-3.5 bg-stone-900/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  {canteen.openingTime} – {canteen.closingTime}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-3">
                <h2 className="text-xl font-bold text-stone-900 group-hover:text-brand-600 transition">
                  {canteen.name}
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                  {canteen.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{canteen.location}</span>
                </div>

                {/* Categories sample */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(canteen.categories || []).map((cat: any, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Footer */}
            <div className="p-6 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">
                {canteen._count.menuItems} items ready to order
              </span>
              <Link
                href={`/canteen/${canteen.slug}`}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 group-hover:gap-2"
              >
                <span>View Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
