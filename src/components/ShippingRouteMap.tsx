import React, { useMemo, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import {
  Truck,
  MapPin,
  Navigation,
  ShieldCheck,
  Clock,
  Compass,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Order } from '../types';

interface ShippingRouteMapProps {
  order: Order;
  className?: string;
}

// World / Middle-East TopoJSON CDN URL
const GEO_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

// Coordinates lookup for Yemeni, Saudi, and Regional cities (Longitude, Latitude)
const KNOWN_COORDINATES: Record<string, [number, number]> = {
  // Yemen
  'صنعاء': [44.2064, 15.3694],
  'sanaa': [44.2064, 15.3694],
  'sana\'a': [44.2064, 15.3694],
  'عدن': [45.0366, 12.7855],
  'aden': [45.0366, 12.7855],
  'تعز': [44.0135, 13.5789],
  'taiz': [44.0135, 13.5789],
  'الحديدة': [42.9545, 14.7979],
  'hodeidah': [42.9545, 14.7979],
  'المكلا': [49.1248, 14.5425],
  'حضرموت': [49.1248, 14.5425],
  'mukalla': [49.1248, 14.5425],
  'إب': [44.1843, 13.9759],
  'ibb': [44.1843, 13.9759],
  'ذمار': [44.4042, 14.5428],
  'dhamar': [44.4042, 14.5428],
  'مأرب': [45.3253, 15.4594],
  'marib': [45.3253, 15.4594],
  'سيئون': [48.7844, 15.9389],
  'sayun': [48.7844, 15.9389],

  // Saudi Arabia & Gulf
  'الرياض': [46.6753, 24.7136],
  'riyadh': [46.6753, 24.7136],
  'جدة': [39.1979, 21.4858],
  'jeddah': [39.1979, 21.4858],
  'مكة': [39.8262, 21.3891],
  'المدينة': [39.6122, 24.4672],
  'الدمام': [50.1033, 26.4207],
  'دبي': [55.2708, 25.2048],
  'dubai': [55.2708, 25.2048],
  'أبوظبي': [54.3773, 24.4539],
  'الدوحة': [51.5310, 25.2854],
  'مسقط': [58.4059, 23.5880],
  'الكويت': [47.9774, 29.3759],
  'المنامة': [50.5860, 26.2285],
  'القاهرة': [31.2357, 30.0444],
  'عمان': [35.9284, 31.9454],
};

// Store Main Fulfillment Hub (Sana'a Central Atelier)
const ORIGIN_HUB: { name: string; coordinates: [number, number] } = {
  name: 'مركز تجهيز أمازون دعاء المركزي (صنعاء)',
  coordinates: [44.2064, 15.3694],
};

function resolveCityCoordinates(cityStr?: string, addressStr?: string): [number, number] {
  const combined = `${cityStr || ''} ${addressStr || ''}`.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (combined.includes(key.toLowerCase())) {
      return coords;
    }
  }
  // Default delivery destination (Aden / Sana'a South if not matched)
  return [44.8, 14.1];
}

// Haversine distance in KM
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const ShippingRouteMap: React.FC<ShippingRouteMapProps> = ({ order, className = '' }) => {
  const [progress, setProgress] = useState(0.55);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedKmH, setSpeedKmH] = useState(62);

  const destinationCoords = useMemo(
    () => resolveCityCoordinates(order.city, order.address),
    [order.city, order.address]
  );

  const distanceKm = useMemo(
    () => Math.max(12, calculateDistance(ORIGIN_HUB.coordinates, destinationCoords)),
    [destinationCoords]
  );

  const coveredKm = Math.round(distanceKm * progress);
  const remainingKm = Math.max(1, distanceKm - coveredKm);

  // Calculate current courier position along the route
  const courierCoords = useMemo<[number, number]>(() => {
    const [lon1, lat1] = ORIGIN_HUB.coordinates;
    const [lon2, lat2] = destinationCoords;
    const curLon = lon1 + (lon2 - lon1) * progress;
    const curLat = lat1 + (lat2 - lat1) * progress;
    return [curLon, curLat];
  }, [destinationCoords, progress]);

  // Center point between origin & destination
  const centerPoint = useMemo<[number, number]>(() => {
    const [lon1, lat1] = ORIGIN_HUB.coordinates;
    const [lon2, lat2] = destinationCoords;
    return [(lon1 + lon2) / 2, (lat1 + lat2) / 2];
  }, [destinationCoords]);

  // Continuous smooth movement of the delivery vehicle
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.006;
        if (next >= 0.96) return 0.15; // smooth reset loop
        return Number(next.toFixed(4));
      });

      // Fluctuate speed realistically
      setSpeedKmH((prev) => {
        const jitter = Math.floor(Math.random() * 7) - 3;
        return Math.min(78, Math.max(45, prev + jitter));
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`bg-stone-900 text-white rounded-3xl overflow-hidden border border-stone-800 shadow-xl ${className}`}>
      {/* Map Header Controls */}
      <div className="p-4 sm:p-5 bg-stone-950/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/40">
            <Truck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-white">تتبع خط سير سيارة التوصيل (Live GPS)</h4>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                المندوب يتحرك الآن
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              الشحنة متجهة إلى: <strong className="text-rose-300">{order.city || 'وجهة العميل'}</strong> ({order.address})
            </p>
          </div>
        </div>

        {/* Live Distance, Speed & Play/Pause Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800 flex items-center gap-1.5 text-emerald-400 font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{speedKmH} كم/س</span>
          </div>

          <div className="bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800 flex items-center gap-1.5 text-stone-300">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>متبقي: {remainingKm} كم</span>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-stone-800 hover:bg-stone-700 text-white p-2 rounded-xl transition-colors cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت لحركة المركبة' : 'استئناف حركة المركبة'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 overflow-hidden">
        {/* Subtle Map Grid Lines Background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #1c1917 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 2300,
            center: centerPoint,
          }}
          className="w-full h-full"
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#292524"
                  stroke="#44403c"
                  strokeWidth={0.5}
                  className="hover:fill-stone-700 transition-colors focus:outline-hidden"
                  style={{ outline: 'none' }}
                />
              ))
            }
          </Geographies>

          {/* Full Planned Shipping Route (Dashed Neon Rose) */}
          <Line
            from={ORIGIN_HUB.coordinates}
            to={destinationCoords}
            stroke="#f43f5e"
            strokeWidth={3}
            strokeDasharray="5 5"
            strokeLinecap="round"
          />

          {/* Active Covered Path (Solid Glowing Emerald) */}
          <Line
            from={ORIGIN_HUB.coordinates}
            to={courierCoords}
            stroke="#10b981"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Origin Marker (Fulfillment Atelier) */}
          <Marker coordinates={ORIGIN_HUB.coordinates}>
            <circle r={6} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
            <circle r={14} fill="#f43f5e" opacity={0.25} className="animate-ping" />
            <text
              textAnchor="middle"
              y={-14}
              style={{
                fontFamily: 'Cairo, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: '#fda4af',
              }}
            >
              المركز الرئيسي
            </text>
          </Marker>

          {/* Dynamic Moving Delivery Truck Marker */}
          <Marker coordinates={courierCoords}>
            {/* Pulsing Radar Ring */}
            <circle r={24} fill="#10b981" opacity={0.18} className="animate-ping" />
            <circle r={16} fill="#10b981" opacity={0.3} />

            {/* Delivery Van Badge Container */}
            <g transform="translate(-16, -16)">
              <rect
                x="0"
                y="0"
                width="32"
                height="32"
                rx="10"
                fill="#0f172a"
                stroke="#10b981"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
              />

              {/* Delivery Truck SVG Icon */}
              <g transform="translate(6, 6) scale(0.85)">
                <path
                  d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M15 18H9"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.4-4.25A1 1 0 0 0 17.6 8H14v10"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="7" cy="18" r="2" fill="#10b981" />
                <circle cx="17" cy="18" r="2" fill="#38bdf8" />
              </g>
            </g>

            {/* Courier Floating Label */}
            <text
              textAnchor="middle"
              y={-22}
              style={{
                fontFamily: 'Cairo, sans-serif',
                fontSize: 10,
                fontWeight: '900',
                fill: '#6ee7b7',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              سيارة التوصيل 🚚
            </text>
          </Marker>

          {/* Destination Marker (Customer Destination) */}
          <Marker coordinates={destinationCoords}>
            <circle r={7} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
            <circle r={14} fill="#f59e0b" opacity={0.3} className="animate-ping" />
            <text
              textAnchor="middle"
              y={20}
              style={{
                fontFamily: 'Cairo, sans-serif',
                fontSize: 11,
                fontWeight: '900',
                fill: '#fde68a',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {order.city || 'نقطة الاستلام'} 📍
            </text>
          </Marker>
        </ComposableMap>

        {/* Live Delivery Info Card Overlay */}
        <div className="absolute bottom-3 right-3 left-3 sm:left-auto bg-stone-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-800 text-xs shadow-2xl flex items-center justify-between sm:justify-start gap-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <Truck className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="font-bold text-stone-200 block text-xs">سيارة التوصيل: أمازون دعاء إكسبريس</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-emerald-400 font-black text-xs">
                  تم إنجاز {Math.round(progress * 100)}% ({coveredKm} كم من {distanceKm} كم)
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-stone-400 block">إحداثيات المندوب</span>
            <span className="font-mono font-bold text-amber-300 text-xs">
              {courierCoords[0].toFixed(3)}°E, {courierCoords[1].toFixed(3)}°N
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Ribbon */}
      <div className="h-1.5 w-full bg-stone-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-rose-500 to-amber-400 transition-all duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Footer Info & Quality Steps */}
      <div className="p-3.5 sm:p-4 bg-stone-950 text-stone-400 text-xs flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/80">
        <div className="flex items-center gap-2 text-stone-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>السيارة مزودة بنظام تبريد ذكي للمحافظة على مستحضرات التجميل والعناية.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProgress(0.15)}
            className="text-[11px] text-stone-400 hover:text-rose-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة محاكاة المسار</span>
          </button>
        </div>
      </div>
    </div>
  );
};
