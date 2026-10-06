import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  Phone,
  MessageSquare,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface DeliveryLiveMapProps {
  orderNumber: string;
  customerName?: string;
  city?: string;
  address?: string;
  trackingNumber?: string;
  courierName?: string;
  courierPhone?: string;
  className?: string;
}

export const DeliveryLiveMap: React.FC<DeliveryLiveMapProps> = ({
  orderNumber,
  customerName = 'العميل الكريم',
  city = 'صنعاء',
  address = 'شارع حدة',
  trackingNumber = 'TRK-9812-YE',
  courierName = 'كابتن التوصيل: سامي الخولاني',
  courierPhone = '967777627595',
  className = '',
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [courierProgress, setCourierProgress] = useState(0.68); // 0 (warehouse) to 1 (customer)
  const [etaMinutes, setEtaMinutes] = useState(18);

  // Animate courier slight movements along the path
  useEffect(() => {
    const interval = setInterval(() => {
      setCourierProgress((prev) => {
        if (prev >= 0.95) return 0.65; // Loop for delightful simulation
        return Number((prev + 0.015).toFixed(3));
      });
      setEtaMinutes((prev) => (prev > 5 ? prev - 1 : 18));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Road coordinates for SVG path: dispatch warehouse -> intermediate waypoints -> customer
  const pathPoints = [
    { x: 50, y: 220 },
    { x: 120, y: 190 },
    { x: 190, y: 210 },
    { x: 260, y: 140 },
    { x: 340, y: 160 },
    { x: 420, y: 90 },
    { x: 490, y: 110 },
  ];

  // Calculate courier coordinates along the bezier path approximation
  const totalSegments = pathPoints.length - 1;
  const currentSegmentIndex = Math.min(
    Math.floor(courierProgress * totalSegments),
    totalSegments - 1
  );
  const segmentProgress = (courierProgress * totalSegments) - currentSegmentIndex;

  const p1 = pathPoints[currentSegmentIndex];
  const p2 = pathPoints[currentSegmentIndex + 1];

  const courierX = p1.x + (p2.x - p1.x) * segmentProgress;
  const courierY = p1.y + (p2.y - p1.y) * segmentProgress;

  const bgStyles = {
    streets: 'bg-stone-100 text-stone-900 border-stone-200',
    satellite: 'bg-[#18231c] text-emerald-100 border-emerald-900/50',
    dark: 'bg-[#111827] text-stone-100 border-stone-800',
  };

  const roadStroke = {
    streets: '#e2e8f0',
    satellite: '#274431',
    dark: '#1f2937',
  };

  const activePathStroke = '#f43f5e'; // Rose 500

  const handleCallCourier = () => {
    window.open(`tel:${courierPhone}`, '_self');
  };

  const handleWhatsAppCourier = () => {
    const msg = encodeURIComponent(
      `مرحباً ${courierName} 🌸\nأستفسر عن موعد وصول طلبي رقم #${orderNumber} المسجل باسم ${customerName}`
    );
    window.open(`https://wa.me/${courierPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 ${
        bgStyles[mapStyle]
      } ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl max-w-none' : ''} ${className}`}
    >
      {/* Map Header Overlay */}
      <div className="absolute top-3 right-3 left-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-md border border-stone-200/80 dark:border-stone-800 pointer-events-auto flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-right">
            <div className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-rose-600" />
              <span>تتبع حي لمندوب الشحنة</span>
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400">
              بوليصة: {trackingNumber}
            </div>
          </div>
        </div>

        {/* Map Control Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-stone-200/80 dark:border-stone-800">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.6))}
            title="تكبير"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            title="تصغير"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              setMapStyle((s) => (s === 'streets' ? 'satellite' : s === 'satellite' ? 'dark' : 'streets'))
            }
            title="تغيير نمط الخريطة"
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Interactive Map Area */}
      <div className="relative w-full h-72 sm:h-80 overflow-hidden select-none">
        <div
          className="w-full h-full transition-transform duration-300 flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg viewBox="0 0 540 280" className="w-full h-full">
            {/* Grid & City Blocks Background */}
            <defs>
              <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="none" />
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={roadStroke[mapStyle]} strokeWidth="0.8" opacity="0.6" />
              </pattern>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
              </linearGradient>
            </defs>

            <rect width="540" height="280" fill="url(#gridPattern)" />

            {/* City Neighborhood Polygons */}
            <path
              d="M 20 20 L 160 30 L 140 120 L 30 100 Z"
              fill={mapStyle === 'streets' ? '#f1f5f9' : '#1e293b'}
              opacity="0.7"
            />
            <path
              d="M 220 40 L 360 20 L 340 100 L 240 110 Z"
              fill={mapStyle === 'streets' ? '#f1f5f9' : '#1e293b'}
              opacity="0.7"
            />
            <path
              d="M 380 140 L 510 130 L 490 240 L 360 250 Z"
              fill={mapStyle === 'streets' ? '#f1f5f9' : '#1e293b'}
              opacity="0.7"
            />
            <path
              d="M 40 150 L 180 160 L 160 260 L 20 250 Z"
              fill={mapStyle === 'streets' ? '#f1f5f9' : '#1e293b'}
              opacity="0.7"
            />

            {/* Main Roads Network */}
            <path
              d="M 0 80 Q 200 90 540 60"
              fill="none"
              stroke={roadStroke[mapStyle]}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 0 200 Q 260 230 540 180"
              fill="none"
              stroke={roadStroke[mapStyle]}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 120 0 Q 140 140 100 280"
              fill="none"
              stroke={roadStroke[mapStyle]}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 360 0 Q 320 140 380 280"
              fill="none"
              stroke={roadStroke[mapStyle]}
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Active Delivery Route Polyline */}
            <path
              d="M 50 220 L 120 190 L 190 210 L 260 140 L 340 160 L 420 90 L 490 110"
              fill="none"
              stroke={activePathStroke}
              strokeWidth="4"
              strokeDasharray="6 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />

            {/* Warehouse / Atelier Pin (Start) */}
            <g transform="translate(50, 220)">
              <circle r="14" fill="#0f172a" />
              <circle r="11" fill="#334155" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                🏢
              </text>
              <rect x="-35" y="16" width="70" height="16" rx="6" fill="#0f172a" fillOpacity="0.85" />
              <text x="0" y="27" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                مركز التجهيز
              </text>
            </g>

            {/* Destination Pin (Customer Address) */}
            <g transform="translate(490, 110)">
              {/* Pulse ripple */}
              <circle r="18" fill="#10b981" opacity="0.3" className="animate-ping" />
              <circle r="14" fill="#10b981" />
              <circle r="10" fill="#059669" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                📍
              </text>
              <rect x="-42" y="-28" width="84" height="18" rx="6" fill="#064e3b" fillOpacity="0.9" />
              <text x="0" y="-16" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="bold">
                عنوانك: {city}
              </text>
            </g>

            {/* Live Moving Courier Pin */}
            <g transform={`translate(${courierX}, ${courierY})`}>
              <circle r="16" fill="#f43f5e" opacity="0.3" className="animate-ping" />
              <circle r="12" fill="#e11d48" className="shadow-lg" />
              <circle r="10" fill="#be123c" />
              <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9">
                🛵
              </text>
              {/* ETA badge attached to courier */}
              <rect x="-32" y="-24" width="64" height="16" rx="6" fill="#881337" fillOpacity="0.95" />
              <text x="0" y="-13" textAnchor="middle" fill="#fecdd3" fontSize="8" fontWeight="bold">
                {etaMinutes} دقيقة للوصول
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Map Bottom Status Card */}
      <div className="p-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60 shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
              <span>{courierName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                على الطريق
              </span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                {city} - {address}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <Clock className="w-3 h-3" />
                الوصول المتوقع: {etaMinutes} دقيقة
              </span>
            </div>
          </div>
        </div>

        {/* Quick Contact Courier Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCallCourier}
            className="flex-1 sm:flex-initial bg-stone-900 hover:bg-stone-800 text-white font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5 text-rose-400" />
            <span>اتصال بالمندوب</span>
          </button>
          <button
            onClick={handleWhatsAppCourier}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>واتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
