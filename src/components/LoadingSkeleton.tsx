import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-sm animate-pulse flex flex-col gap-3">
      <div className="h-44 bg-stone-200 rounded-xl w-full" />
      <div className="h-5 bg-stone-200 rounded w-3/4" />
      <div className="h-4 bg-stone-100 rounded w-full" />
      <div className="h-4 bg-stone-100 rounded w-2/3" />
      <div className="mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
        <div className="h-6 bg-stone-200 rounded w-20" />
        <div className="h-9 bg-stone-200 rounded-lg w-28" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white rounded-xl border border-stone-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-stone-100 border-b border-stone-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 border-b border-stone-100 flex items-center px-4 gap-4">
          <div className="h-4 bg-stone-200 rounded w-28" />
          <div className="h-4 bg-stone-100 rounded w-36" />
          <div className="h-4 bg-stone-100 rounded w-20" />
          <div className="h-4 bg-stone-200 rounded w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm animate-pulse flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-3 bg-stone-200 rounded w-24" />
        <div className="h-7 bg-stone-300 rounded w-32" />
      </div>
      <div className="w-12 h-12 bg-stone-200 rounded-xl" />
    </div>
  );
}
