import type { SyntheticEvent } from 'react';

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';

/**
 * Ensures product image URLs are never empty ("") and safely replaces
 * unreachable cross-session blob: URLs with the store fallback image.
 */
export function getSafeImageSrc(url?: string | null): string {
  if (typeof url !== 'string') return FALLBACK_PRODUCT_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_PRODUCT_IMAGE;
  if (
    trimmed.startsWith('blob:') &&
    typeof window !== 'undefined' &&
    !trimmed.startsWith(`blob:${window.location.origin}/`)
  ) {
    return FALLBACK_PRODUCT_IMAGE;
  }
  return trimmed;
}

/**
 * Returns a trimmed non-empty URL or null (never ""), preventing React's
 * empty-string src="" warning on optional media elements.
 */
export function getNonEmptySrc(url?: string | null): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function handleProductImageError(e: SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = FALLBACK_PRODUCT_IMAGE;
}
