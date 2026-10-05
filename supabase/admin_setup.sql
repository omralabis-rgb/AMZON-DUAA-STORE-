-- =========================================================
-- إعداد حسابات المشرفين والأمان (Admin Setup)
-- =========================================================

-- جدول المشرفين المستقل (اختياري بجانب Supabase Auth)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('superadmin', 'manager', 'editor')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- سياسة الأمان للمشرفين
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin Read Profiles" ON public.admin_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "SuperAdmin Manage Profiles" ON public.admin_profiles FOR ALL USING (auth.role() = 'authenticated');
