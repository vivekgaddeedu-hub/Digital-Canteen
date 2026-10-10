'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { PersonalizedPromotion } from '@/lib/recommendations';

interface PromotionalCarouselProps {
  canteenId?: string;
  initialPromotions?: PersonalizedPromotion[];
}

export function PromotionalCarousel({ canteenId, initialPromotions }: PromotionalCarouselProps) {
  const [promotions, setPromotions] = useState<PersonalizedPromotion[]>(initialPromotions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialPromotions);
  
  // Track impressions to prevent duplicate counting in the same session
  const trackedImpressions = useRef<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);

  // Fetch promotions if not provided initially
  useEffect(() => {
    if (initialPromotions && initialPromotions.length > 0) {
      setPromotions(initialPromotions);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadPromos() {
      try {
        const url = canteenId ? `/api/promotions?canteenId=${canteenId}` : '/api/promotions';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.promotions) {
            setPromotions(data.promotions);
          }
        }
      } catch (err) {
        console.warn('Failed to load promotional offers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPromos();

    return () => {
      isMounted = false;
    };
  }, [canteenId, initialPromotions]);

  // Log impression for active slide
  const logImpression = useCallback((promoId: string) => {
    if (trackedImpressions.current.has(promoId)) return;
    trackedImpressions.current.add(promoId);

    fetch(`/api/promotions/${promoId}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'IMPRESSION' }),
    }).catch(() => {});
  }, []);

  // Log click event
  const handlePromoClick = (promoId: string) => {
    fetch(`/api/promotions/${promoId}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'CLICK' }),
    }).catch(() => {});
  };

  // Record impression whenever current slide changes
  useEffect(() => {
    if (promotions.length > 0 && promotions[currentIndex]) {
      logImpression(promotions[currentIndex].id);
    }
  }, [currentIndex, promotions, logImpression]);

  // Auto-rotation timer
  useEffect(() => {
    if (promotions.length <= 1 || isPaused) return;

    // Check for user reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [promotions.length, isPaused]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (promotions.length <= 1) return;
    if (e.key === 'ArrowLeft') {
      setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }
  };

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        setCurrentIndex((prev) => (prev + 1) % promotions.length);
      } else {
        // Swiped right -> prev
        setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
      }
    }
    touchStartX.current = null;
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading) {
    return (
      <div className="w-full h-48 sm:h-64 rounded-3xl bg-stone-100 animate-pulse flex items-center justify-center text-stone-400 text-xs font-medium">
        Loading campus specials...
      </div>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  const current = promotions[currentIndex];
  const targetLink = current.canteenSlug
    ? `/canteen/${current.canteenSlug}`
    : '/canteens';

  return (
    <div
      role="region"
      aria-label="Campus Offers & Deals"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/50 group"
    >
      {/* Background Graphic Image with Rich Vignette Gradient */}
      <div className="relative min-h-[260px] sm:min-h-[300px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{ backgroundImage: `url(${current.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-stone-900/40" />

        {/* Content Box */}
        <div className="relative z-10 w-full p-6 sm:p-10 flex flex-col justify-between max-w-2xl">
          <div className="space-y-3">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {current.badge && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-500 text-white shadow-sm shadow-brand-500/30">
                  <Tag className="w-3.5 h-3.5" />
                  {current.badge}
                </span>
              )}

              {current.isPersonalizedMatch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Recommended For You
                </span>
              )}

              {current.canteenName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-stone-200 backdrop-blur-xs">
                  {current.canteenName}
                </span>
              )}
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-snug">
              {current.title}
            </h2>

            {current.subtitle && (
              <p className="text-xs sm:text-sm font-semibold text-brand-300">
                {current.subtitle}
              </p>
            )}

            <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed max-w-xl">
              {current.description}
            </p>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {current.promoCode && (
              <button
                type="button"
                onClick={() => copyPromoCode(current.promoCode!)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-mono font-bold transition backdrop-blur-xs"
                title="Click to copy coupon code"
              >
                {copiedCode === current.promoCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>CODE: {current.promoCode}</span>
                  </>
                )}
              </button>
            )}

            <Link
              href={targetLink}
              onClick={() => handlePromoClick(current.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition"
            >
              <span>Order Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {current.minOrderValue > 0 && (
              <span className="text-[11px] text-stone-400 font-medium">
                Min. order ₹{current.minOrderValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {promotions.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length)}
            aria-label="Previous Offer"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-stone-950/60 hover:bg-stone-950/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-xs focus:opacity-100 focus:outline-hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % promotions.length)}
            aria-label="Next Offer"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-stone-950/60 hover:bg-stone-950/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-xs focus:opacity-100 focus:outline-hidden"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicator Dots */}
      {promotions.length > 1 && (
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5">
          {promotions.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-brand-500' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
