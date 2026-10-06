import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Database, Key, Send, Sparkles } from 'lucide-react';

interface SupabaseCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseCodeModal: React.FC<SupabaseCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'edge' | 'upload' | 'store' | 'whatsapp' | 'env'>('sql');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const sqlCode = `-- 1️⃣ جداول وقواعد أمان Supabase
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.categories (name_ar, slug) VALUES
('عناية بالبشرة', 'skincare'),
('عناية بالشعر', 'haircare'),
('عطور', 'perfumes'),
('مكياج', 'makeup'),
('عناية بالجسم', 'bodycare')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  description_ar TEXT,
  original_price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  tags TEXT[],
  image_url TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin Write Products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- 🚀 Full-Text Search (tsvector) & Fuzzy Trigram Matching (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  to_tsvector('arabic',
    coalesce(title_ar, '') || ' ' ||
    coalesce(description_ar, '') || ' ' ||
    coalesce(category_name, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS products_fts_idx ON public.products USING gin(fts);
CREATE INDEX IF NOT EXISTS products_title_trgm_idx ON public.products USING gin(title_ar gin_trgm_ops);

-- RPC Function for Live Dynamic Fuzzy Search
CREATE OR REPLACE FUNCTION public.search_products_fuzzy(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.1,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id UUID, title_ar TEXT, description_ar TEXT,
  original_price NUMERIC, discount_price NUMERIC,
  stock_quantity INT, category_id UUID, category_name TEXT,
  tags TEXT[], image_url TEXT, ai_generated BOOLEAN,
  rating NUMERIC, reviews_count INT, how_to_use TEXT,
  ingredients TEXT, created_at TIMESTAMPTZ, featured BOOLEAN,
  rank REAL, similarity_score FLOAT, matched_reason TEXT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title_ar, p.description_ar, p.original_price, p.discount_price,
         p.stock_quantity, p.category_id, p.category_name, p.tags, p.image_url,
         p.ai_generated, p.rating, p.reviews_count, p.how_to_use, p.ingredients,
         p.created_at, p.featured,
         ts_rank(p.fts, websearch_to_tsquery('arabic', search_query)) AS rank,
         similarity(p.title_ar, search_query)::FLOAT AS similarity_score,
         'مطابقة ضبابية دقيقة' AS matched_reason
  FROM public.products p
  WHERE p.fts @@ websearch_to_tsquery('arabic', search_query)
     OR similarity(p.title_ar, search_query) > similarity_threshold
     OR p.title_ar ILIKE '%' || search_query || '%'
  ORDER BY greatest(ts_rank(p.fts, websearch_to_tsquery('arabic', search_query)), similarity(p.title_ar, search_query)) DESC
  LIMIT max_results;
END;
$$;
GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(TEXT, FLOAT, INT) TO anon, authenticated;
`;

  const edgeCode = `// 2️⃣ supabase/functions/generate-product-content/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const { imageBase64, mimeType } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // نموذج Gemini الأحدث
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.2 
      }
    });

    const prompt = \`
تحليل صورة منتج تجميل وإرجاع JSON عربي:
1. title_ar: عنوان قصير جذاب SEO (أقل من 60 حرف)
2. description_ar: وصف تسويقي (الفوائد، المكونات، طريقة الاستخدام)
3. category_name: من ["عناية بالبشرة", "عناية بالشعر", "عطور", "مكياج", "عناية بالجسم"]
4. tags: 5-7 كلمات مفتاحية

Format: {"title_ar": "string", "description_ar": "string", "category_name": "string", "tags": ["string"]}
\`;

    const imagePart = {
      inlineData: { 
        data: imageBase64.replace(/^data:image\\/\\w+;base64,/, ""), 
        mimeType: mimeType || "image/jpeg" 
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseData = JSON.parse(result.response.text());

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
`;

  const whatsappCode = `// 4️⃣ lib/whatsapp.ts
export function generateWhatsAppOrder(
  items: { title: string; price: number; quantity: number }[],
  total: number,
  phone: string = "966500000000"
): string {
  const message = \`
🛍️ *طلب جديد من المتجر*

\${items.map((item, i) => 
  \`\${i + 1}. \${item.title}
   الكمية: \${item.quantity} × \${item.price} ريال\`
).join('\\n\\n')}

💰 *الإجمالي: \${total} ريال*

شكراً لطلبكم!
  \`.trim();

  return \`https://wa.me/\${phone}?text=\${encodeURIComponent(message)}\`;
}
`;

  const envCode = `# 5️⃣ .env / Secrets
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_WHATSAPP_NUMBER=966500000000
`;

  const currentSnippet =
    activeTab === 'sql'
      ? sqlCode
      : activeTab === 'edge'
      ? edgeCode
      : activeTab === 'whatsapp'
      ? whatsappCode
      : envCode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div
        className="relative bg-stone-900 text-stone-100 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                حزمة الأكواد الجاهزة للنسخ (Supabase / Bolt / Lovable)
              </h3>
              <p className="text-xs text-stone-400">
                يمكنك نسخ أي كود بنقرة واحدة لتنفيذه في مشروعك الخارجي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-3 bg-stone-950/90 border-b border-stone-800 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sql'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Supabase SQL</span>
          </button>

          <button
            onClick={() => setActiveTab('edge')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'edge'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. Gemini Edge Function</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>3. كود رسائل واتساب</span>
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'env'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>4. متغيرات البيئة .env</span>
          </button>
        </div>

        {/* Code Viewer */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950 font-mono text-xs sm:text-sm text-stone-300">
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => copyToClipboard(currentSnippet, activeTab)}
              className="bg-stone-800 hover:bg-stone-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-colors border border-stone-700 shadow-sm"
            >
              {copied === activeTab ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الكود</span>
                </>
              )}
            </button>
          </div>

          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed select-all" dir="ltr">
            <code>{currentSnippet}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>💡 هذا التطبيق يعمل الآن بكامل ميزاته فوراً في المتصفح والسيرفر المدمج</span>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded-xl font-bold font-sans"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupabaseCodeModal;
