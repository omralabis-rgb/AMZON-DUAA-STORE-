-- =========================================================
-- Amazon Duaa: Supabase Full-Text Search (tsvector) & Fuzzy Trigram Matching (pg_trgm)
-- =========================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Add Generated tsvector Column on Products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  to_tsvector('arabic',
    coalesce(title_ar, '') || ' ' ||
    coalesce(description_ar, '') || ' ' ||
    coalesce(category_name, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '') || ' ' ||
    coalesce(ingredients, '') || ' ' ||
    coalesce(how_to_use, '')
  )
) STORED;

-- 3. Create GIN Indexes for Lightning-Fast Search & Trigram Matching
CREATE INDEX IF NOT EXISTS products_fts_gin_idx ON public.products USING gin(fts);
CREATE INDEX IF NOT EXISTS products_title_trgm_gin_idx ON public.products USING gin(title_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_category_trgm_gin_idx ON public.products USING gin(category_name gin_trgm_ops);

-- 4. Create Hybrid Fuzzy + Full-Text Search RPC Function
CREATE OR REPLACE FUNCTION public.search_products_fuzzy(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.1,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title_ar TEXT,
  description_ar TEXT,
  original_price NUMERIC,
  discount_price NUMERIC,
  stock_quantity INT,
  category_id UUID,
  category_name TEXT,
  tags TEXT[],
  image_url TEXT,
  ai_generated BOOLEAN,
  rating NUMERIC,
  reviews_count INT,
  how_to_use TEXT,
  ingredients TEXT,
  created_at TIMESTAMPTZ,
  featured BOOLEAN,
  rank REAL,
  similarity_score FLOAT,
  matched_reason TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  clean_query TEXT;
BEGIN
  clean_query := trim(search_query);
  IF clean_query = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title_ar,
    p.description_ar,
    p.original_price,
    p.discount_price,
    p.stock_quantity,
    p.category_id,
    p.category_name,
    p.tags,
    p.image_url,
    p.ai_generated,
    p.rating,
    p.reviews_count,
    p.how_to_use,
    p.ingredients,
    p.created_at,
    p.featured,
    ts_rank(p.fts, websearch_to_tsquery('arabic', clean_query)) AS rank,
    greatest(
      similarity(p.title_ar, clean_query),
      similarity(coalesce(p.category_name, ''), clean_query),
      similarity(array_to_string(p.tags, ' '), clean_query)
    )::FLOAT AS similarity_score,
    CASE
      WHEN p.title_ar ILIKE '%' || clean_query || '%' THEN 'تطابق في عنوان المنتج'
      WHEN ts_rank(p.fts, websearch_to_tsquery('arabic', clean_query)) > 0.1 THEN 'تطابق في الفهرس الكامل (Full-Text)'
      WHEN similarity(p.title_ar, clean_query) > similarity_threshold THEN 'تطابق ضبابي بحروف مقاربة (Fuzzy Match)'
      ELSE 'نتيجة ذات صلة دلالية'
    END AS matched_reason
  FROM public.products p
  WHERE
    p.fts @@ websearch_to_tsquery('arabic', clean_query)
    OR similarity(p.title_ar, clean_query) > similarity_threshold
    OR similarity(array_to_string(p.tags, ' '), clean_query) > similarity_threshold
    OR p.title_ar ILIKE '%' || clean_query || '%'
    OR array_to_string(p.tags, ' ') ILIKE '%' || clean_query || '%'
    OR p.description_ar ILIKE '%' || clean_query || '%'
  ORDER BY
    greatest(
      ts_rank(p.fts, websearch_to_tsquery('arabic', clean_query)),
      similarity(p.title_ar, clean_query)
    ) DESC,
    p.created_at DESC
  LIMIT max_results;
END;
$$;

-- 5. Grant Anonymous Public Access to the Search Function
REVOKE ALL ON FUNCTION public.search_products_fuzzy(TEXT, FLOAT, INT) FROM public;
GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(TEXT, FLOAT, INT) TO anon, authenticated;
