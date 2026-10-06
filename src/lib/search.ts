import { Product } from '../types';

/**
 * Arabic text normalization for fuzzy and semantic search
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variants
    .replace(/[إأآا]/g, 'ا')
    // Normalize Yeh / Alef Maksura
    .replace(/[يى]/g, 'ي')
    // Normalize Teh Marbuta / Heh
    .replace(/ة/g, 'ه')
    // Normalize spaces and lower case
    .trim()
    .toLowerCase();
}

/**
  Remove Arabic definite article "ال" if word starts with it
 */
export function removeAlPrefix(word: string): string {
  const norm = normalizeArabic(word);
  if (norm.startsWith('ال') && norm.length > 3) {
    return norm.substring(2);
  }
  return norm;
}

/**
 * Calculates trigram similarity (0.0 to 1.0) between two strings for fuzzy matching
 */
export function trigramSimilarity(str1: string, str2: string): number {
  const s1 = normalizeArabic(str1);
  const s2 = normalizeArabic(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const getTrigrams = (str: string) => {
    const padded = `  ${str} `;
    const trigrams = new Map<string, number>();
    for (let i = 0; i < padded.length - 2; i++) {
      const tri = padded.substring(i, i + 3);
      trigrams.set(tri, (trigrams.get(tri) || 0) + 1);
    }
    return trigrams;
  };

  const t1 = getTrigrams(s1);
  const t2 = getTrigrams(s2);

  let intersection = 0;
  let t1Total = 0;
  let t2Total = 0;

  t1.forEach((count, tri) => {
    t1Total += count;
    if (t2.has(tri)) {
      intersection += Math.min(count, t2.get(tri)!);
    }
  });

  t2.forEach((count) => {
    t2Total += count;
  });

  if (t1Total + t2Total === 0) return 0;
  return (2.0 * intersection) / (t1Total + t2Total);
}

/**
 * Semantic intent and synonym dictionary for beauty & cosmetics
 */
const BEAUTY_INTENTS: Record<string, string[]> = {
  // الترطيب والجفاف
  ترطيب: ['هيالورونيك', 'سيراميد', 'جفاف', 'مرطب', 'ماء', 'نضارة', 'جافة', 'ترميم'],
  جفاف: ['هيالورونيك', 'سيراميد', 'ترطيب', 'جافة', 'مقشر', 'زبدة', 'شيا'],
  تقشر: ['سيراميد', 'ترطيب', 'مقشر', 'حاجز'],

  // الشعر ومشاكله
  شعر: ['أرغان', 'كولاجين', 'ماسك', 'خصلات', 'تقصف', 'هيشان', 'تساقط', 'لمعان', 'حريري'],
  تقصف: ['أرغان', 'ترميم', 'كولاجين', 'أطراف', 'ماسك'],
  هيشان: ['أرغان', 'شعر', 'حريري', 'كولاجين'],
  تطويل: ['أرغان', 'بصيلات', 'كولاجين', 'تغذية'],

  // العطور والروائح
  عطر: ['مسك', 'بودرة', 'عود', 'أوركيد', 'عنبر', 'رائحة', 'ثبات', 'فوحان', 'بارفيوم'],
  مسك: ['بودرة', 'عطور', 'ملكي', 'نظافة', 'أبيض'],
  رائحة: ['عطر', 'مسك', 'ثبات', 'فواح', 'ورد', 'فانيليا'],
  ثبات: ['عطر', 'مسك', 'أوركيد', 'طويل'],

  // البشرة والنضارة
  نضارة: ['هيالورونيك', 'فيتامين', 'سيروم', 'إشراقة', 'تفتيح', 'بشرة'],
  تفتيح: ['فيتامين', 'نضارة', 'توحيد', 'قهوة', 'مقشر', 'سيروم'],
  حبوب: ['نياسيناميد', 'سيراميد', 'شاي', 'تنظيف'],
  احمرار: ['سيراميد', 'مهدئ', 'حساسة', 'نياسيناميد'],
  حساسة: ['سيراميد', 'مهدئ', 'خالي من العطور', 'حاجز'],

  // المكياج والشفاه
  مكياج: ['روج', 'شفاه', 'مخملي', 'مات', 'أحمر', 'توت'],
  روج: ['شفاه', 'مخملي', 'مات', 'أحمر', 'كاكاو', 'طويل'],
  شفايف: ['روج', 'شفاه', 'مرطب', 'مخملي'],

  // الجسم والسبا
  جسم: ['مقشر', 'قهوة', 'شيا', 'نعومة', 'لوشن', 'سبا'],
  سيلوليت: ['قهوة', 'مقشر', 'دورة دموية', 'شيا'],
  نعومة: ['مقشر', 'شيا', 'هيالورونيك', 'أرغان', 'حريري'],
};

export interface SearchMatch {
  product: Product;
  score: number;
  matchedReason?: string;
}

/**
 * Advanced Semantic & Fuzzy Matching Search Algorithm
 */
export function searchProducts(products: Product[], rawQuery: string): SearchMatch[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const normQuery = normalizeArabic(query);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  const strippedQueryTokens = queryTokens.map(removeAlPrefix);

  // Collect semantic expansion terms
  const expandedTerms = new Set<string>();
  queryTokens.forEach((token) => {
    const stripped = removeAlPrefix(token);
    for (const [key, synonyms] of Object.entries(BEAUTY_INTENTS)) {
      if (normalizeArabic(key).includes(stripped) || stripped.includes(normalizeArabic(key))) {
        synonyms.forEach((s) => expandedTerms.add(normalizeArabic(s)));
      }
    }
  });

  const results: SearchMatch[] = [];

  for (const product of products) {
    let score = 0;
    let matchedReason = '';

    const titleNorm = normalizeArabic(product.title_ar);
    const descNorm = normalizeArabic(product.description_ar);
    const catNorm = normalizeArabic(product.category_name);
    const tagsNorm = (product.tags || []).map(normalizeArabic);
    const ingredientsNorm = normalizeArabic(product.ingredients || '');
    const benefitsNorm = (product.key_benefits || []).map(normalizeArabic).join(' ');

    // 1. Exact or Full Phrase Match in Title (Highest Score)
    if (titleNorm.includes(normQuery)) {
      score += 100;
      matchedReason = 'تطابق في عنوان المنتج';
    }

    // 2. Trigram Fuzzy Similarity Matching (handles typos & near-matches)
    if (normQuery.length >= 2) {
      const triSim = trigramSimilarity(titleNorm, normQuery);
      if (triSim >= 0.25) {
        score += Math.round(triSim * 50);
        if (!matchedReason) {
          matchedReason = `مطابقة ضبابية (${Math.round(triSim * 100)}%)`;
        }
      }
    }

    // 2. Token Matching
    for (const token of strippedQueryTokens) {
      if (token.length < 2) continue;

      if (titleNorm.includes(token)) {
        score += 40;
        if (!matchedReason) matchedReason = 'تطابق في الاسم';
      }
      if (catNorm.includes(token)) {
        score += 35;
        if (!matchedReason) matchedReason = `ينتمي لقسم ${product.category_name}`;
      }
      if (tagsNorm.some((t) => t.includes(token))) {
        score += 25;
        if (!matchedReason) matchedReason = 'تطابق في الكلمات المفتاحية';
      }
      if (descNorm.includes(token)) {
        score += 15;
        if (!matchedReason) matchedReason = 'تطابق في وصف المنتج';
      }
      if (benefitsNorm.includes(token)) {
        score += 15;
      }
      if (ingredientsNorm.includes(token)) {
        score += 10;
        if (!matchedReason) matchedReason = 'متوافق مع المكونات';
      }
    }

    // 3. Semantic Synonym & Intent Matching
    for (const semTerm of expandedTerms) {
      if (titleNorm.includes(semTerm)) {
        score += 20;
        if (!matchedReason) matchedReason = `صلة دلالية: ${semTerm}`;
      } else if (tagsNorm.some((t) => t.includes(semTerm))) {
        score += 15;
      } else if (descNorm.includes(semTerm) || benefitsNorm.includes(semTerm)) {
        score += 10;
        if (!matchedReason) matchedReason = 'حل موصى به لهذا الاحتياج';
      }
    }

    // Bonus for featured or highly rated products
    if (score > 0) {
      if (product.featured) score += 5;
      if (product.rating && product.rating >= 4.8) score += 3;

      results.push({
        product,
        score,
        matchedReason: matchedReason || 'نتيجة ذات صلة',
      });
    }
  }

  // Sort by highest relevance score
  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Suggested popular queries for zero-state search bar
 */
export const POPULAR_SEARCH_TAGS = [
  { label: 'سيروم هيالورونيك', query: 'هيالورونيك' },
  { label: 'عطر مسك البودرة', query: 'مسك البودرة' },
  { label: 'زيت الأرغان للشعر', query: 'أرغان' },
  { label: 'ترطيب البشرة الجافة', query: 'ترطيب جفاف' },
  { label: 'كريم السيراميد', query: 'سيراميد' },
  { label: 'مقشر القهوة', query: 'مقشر قهوة' },
  { label: 'روج مخملي', query: 'روج' },
];
