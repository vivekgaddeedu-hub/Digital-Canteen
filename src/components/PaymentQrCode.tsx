'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode as QrIcon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  CreditCard,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface PaymentQrCodeProps {
  orderNumber: string;
  orderId?: string;
  amount: number | string;
  paymentStatus: string;
  canteenName?: string;
  upiId?: string | null;
  paymentInstructions?: string | null;
  paymentPolicy?: string;
  className?: string;
  compact?: boolean;
}

export default function PaymentQrCode({
  orderNumber,
  orderId,
  amount,
  paymentStatus,
  canteenName = 'QuickBite Canteen',
  upiId = 'quickbite.campus@upi',
  paymentInstructions,
  paymentPolicy = 'PAY_BEFORE_PICKUP',
  className = '',
  compact = false,
}: PaymentQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const isPaid = paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
  const effectiveUpiId = upiId || 'quickbite.campus@upi';

  // Standard UPI URI format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
  const upiPayload = `upi://pay?pa=${encodeURIComponent(
    effectiveUpiId
  )}&pn=${encodeURIComponent(canteenName)}&am=${numAmount.toFixed(
    2
  )}&cu=INR&tn=${encodeURIComponent(`QuickBite Order ${orderNumber}`)}`;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiPayload, {
      width: compact ? 180 : 240,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation failed:', err);
        if (isMounted) setQrError('Failed to generate payment QR code.');
      });

    return () => {
      isMounted = false;
    };
  }, [upiPayload, compact]);

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(effectiveUpiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isPaid) {
    return (
      <div
        className={`bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-emerald-900">Payment Confirmed & Verified</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              ₹{numAmount.toFixed(2)} received and verified. Ready for counter pickup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrIcon className="w-5 h-5 text-brand-200" />
          <h3 className="font-semibold text-sm">Scan & Pay via UPI</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wide">
          {paymentStatus}
        </span>
      </div>

      <div className="p-5 flex flex-col items-center text-center">
        {/* Amount Due Display */}
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Amount Due</p>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            ₹{numAmount.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Order Ref: #{orderNumber}</p>
        </div>

        {/* QR Code Container */}
        <div className="relative p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl my-2">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`Payment QR code for order ${orderNumber}`}
              className="w-44 h-44 object-contain rounded-lg"
            />
          ) : qrError ? (
            <div className="w-44 h-44 flex flex-col items-center justify-center text-xs text-rose-500 p-2">
              <AlertTriangle className="w-6 h-6 mb-1" />
              <span>{qrError}</span>
            </div>
          ) : (
            <div className="w-44 h-44 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Supported Apps */}
        <p className="text-xs text-slate-500 font-medium mt-1">
          Compatible with Google Pay, PhonePe, Paytm & BHIM UPI
        </p>

        {/* UPI ID pill with copy button */}
        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-700">
          <span>{effectiveUpiId}</span>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="text-slate-500 hover:text-brand-600 transition ml-1"
            title="Copy UPI ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Admin Instructions */}
        {paymentInstructions && (
          <div className="mt-4 w-full text-left bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Canteen Instructions: </span>
              <span>{paymentInstructions}</span>
            </div>
          </div>
        )}

        {/* Mandatory Counter Verification Notice */}
        <div className="mt-3.5 w-full text-left bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Counter Verification Required: </span>
            Scanning and transferring does <span className="font-semibold underline">not</span> automatically update this order to Paid. Show your UPI payment confirmation screen to staff at the pickup counter. Staff will verify the transaction and confirm your payment.
          </div>
        </div>

        {paymentPolicy === 'PAY_BEFORE_PICKUP' && (
          <p className="text-[11px] text-slate-500 mt-2 italic">
            * Canteen policy: Payment must be verified before food handover.
          </p>
        )}
      </div>
    </div>
  );
}
