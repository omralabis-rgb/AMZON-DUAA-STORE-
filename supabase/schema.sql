-- =========================================================
-- جدول التصنيفات (Categories)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'Sparkles',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إدخال الأقسام الافتراضية
INSERT INTO public.categories (name_ar, slug, icon) VALUES
('عناية بالبشرة', 'skincare', 'Sparkles'),
('عناية بالشعر', 'haircare', 'Waves'),
('عطور', 'perfumes', 'Flame'),
('مكياج', 'makeup', 'Palette'),
('عناية بالجسم', 'bodycare', 'Heart')
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- جدول المنتجات (Products)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  description_ar TEXT,
  original_price DECIMAL(10, 2) NOT NULL CHECK (original_price >= 0),
  discount_price DECIMAL(10, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  image_url TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 1,
  how_to_use TEXT,
  ingredients TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- جدول الطلبات (Orders)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  city TEXT,
  address TEXT,
  notes TEXT,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  whatsapp_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- سياسات الأمان (Row Level Security - RLS)
-- =========================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الأقسام والمنتجات
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

-- السماح للجميع بإنشاء طلبات (من واجهة المتجر)
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

-- السماح للمشرفين بإدارة كافة البيانات
CREATE POLICY "Admin All Categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
