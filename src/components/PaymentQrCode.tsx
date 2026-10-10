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
  ExternalLink,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';

interface PaymentQrCodeProps {
  orderNumber: string;
  orderId?: string;
  amount: number | string;
  paymentStatus: string;
  canteenName?: string;
  upiId?: string | null;
  payeeName?: string | null;
  qrImageUrl?: string | null;
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
  upiId = 'avi258369@oksbi',
  payeeName = 'Santosh Reddy',
  qrImageUrl = '/images/upi-payment-qr.jpg',
  paymentInstructions,
  paymentPolicy = 'PAY_BEFORE_PICKUP',
  className = '',
  compact = false,
}: PaymentQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dynamic' | 'original'>('dynamic');

  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const isPaid = paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
  const effectiveUpiId = upiId || 'avi258369@oksbi';
  const effectivePayee = payeeName || 'Santosh Reddy';
  const effectiveQrImage = qrImageUrl || '/images/upi-payment-qr.jpg';

  // Standard UPI URI format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
  const upiPayload = `upi://pay?pa=${encodeURIComponent(
    effectiveUpiId
  )}&pn=${encodeURIComponent(effectivePayee)}&am=${numAmount.toFixed(
    2
  )}&cu=INR&tn=${encodeURIComponent(`QuickBite Order ${orderNumber}`)}`;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiPayload, {
      width: compact ? 180 : 240,
      margin: 2,
      color: {
        dark: '#0f172a',
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
              ₹{numAmount.toFixed(2)} received and verified for order #{orderNumber}. Ready for counter pickup.
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
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrIcon className="w-5 h-5 text-brand-200" />
          <div>
            <h3 className="font-semibold text-sm leading-tight">UPI Payment QR</h3>
            <p className="text-[11px] text-brand-100 font-normal">GPay, PhonePe, Paytm & BHIM</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wide">
          {paymentStatus}
        </span>
      </div>

      <div className="p-5 flex flex-col items-center text-center">
        {/* Payee Info Header */}
        <div className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 mb-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
              SR
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 leading-tight flex items-center gap-1">
                {effectivePayee}
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Verified Receiver" />
              </p>
              <p className="text-[11px] text-slate-500 font-mono">{effectiveUpiId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 bg-white border border-slate-200 px-2 py-1 rounded-md transition shadow-xs"
            title="Copy UPI ID"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Amount Due Display */}
        <div className="mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Amount Due</p>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            ₹{numAmount.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Order Ref: #{orderNumber}</p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium mb-3">
          <button
            type="button"
            onClick={() => setViewMode('dynamic')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              viewMode === 'dynamic'
                ? 'bg-white text-brand-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Exact Amount QR</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
              viewMode === 'original'
                ? 'bg-white text-brand-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Official GPay QR</span>
          </button>
        </div>

        {/* QR Code Container */}
        <div className="relative p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl my-1 flex items-center justify-center">
          {viewMode === 'dynamic' ? (
            qrDataUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt={`Pre-filled UPI QR code for order ${orderNumber}`}
                  className="w-48 h-48 object-contain rounded-lg shadow-2xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 font-mono">
                  Pre-filled with ₹{numAmount.toFixed(2)}
                </span>
              </div>
            ) : qrError ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-xs text-rose-500 p-2">
                <AlertTriangle className="w-6 h-6 mb-1" />
                <span>{qrError}</span>
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )
          ) : (
            <div className="flex flex-col items-center">
              <img
                src={effectiveQrImage}
                alt="Santosh Reddy Official Google Pay UPI QR"
                className="w-48 h-auto max-h-56 object-contain rounded-lg shadow-2xs border border-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-1">
                Enter ₹{numAmount.toFixed(2)} when scanning
              </span>
            </div>
          )}
        </div>

        {/* Direct UPI App Deep-link on Mobile */}
        <a
          href={upiPayload}
          className="mt-3 w-full py-2 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
        </a>

        {/* Admin / Canteen Instructions */}
        {paymentInstructions && (
          <div className="mt-3.5 w-full text-left bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Payment Note: </span>
              <span>{paymentInstructions}</span>
            </div>
          </div>
        )}

        {/* Mandatory Counter Verification Notice */}
        <div className="mt-3 w-full text-left bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Counter Verification Required: </span>
            Completing payment in your UPI app does <span className="font-semibold underline">not</span> automatically update this order to Paid. Show your UPI success transaction screen to canteen staff at the counter. Staff will verify the amount and confirm your pickup ticket.
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
