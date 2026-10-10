import React from 'react';
import { OrderStatus } from '@prisma/client';
import { Clock, CheckCircle, ChefHat, PackageCheck, CheckCheck, XCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 gap-2 font-medium',
  };

  switch (status) {
    case OrderStatus.PLACED:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          Order Placed
        </span>
      );
    case OrderStatus.ACCEPTED:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Accepted
        </span>
      );
    case OrderStatus.PREPARING:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses[size]}`}
        >
          <ChefHat className="w-3.5 h-3.5 animate-bounce" />
          Preparing
        </span>
      );
    case OrderStatus.READY:
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm ${sizeClasses[size]}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <PackageCheck className="w-4 h-4 text-emerald-600" />
          Ready for Pickup
        </span>
      );
    case OrderStatus.COLLECTED:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-stone-100 text-stone-700 border border-stone-300 ${sizeClasses[size]}`}
        >
          <CheckCheck className="w-3.5 h-3.5 text-stone-500" />
          Collected
        </span>
      );
    case OrderStatus.CANCELLED:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
        >
          <Ban className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    case OrderStatus.REJECTED:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses[size]}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-stone-100 text-stone-800 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
}
