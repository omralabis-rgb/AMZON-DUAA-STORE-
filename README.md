# أمازون دعاء | Amazon Duaa
### متجر التجارة والتجميل والعناية الفاخرة المدعوم بالذكاء الاصطناعي

منصة تجارة إلكترونية متطورة مخصصة لمنتجات التجميل والعناية الأصلية، تدمج بين تجربة تسوق تفاعلية سريعة وطلب مباشر عبر واتساب، مع محرك ذكاء اصطناعي (Gemini) لتحليل المنتجات وصياغة المحتوى التسويقي ومساعد إداري ذكي (AI Admin Copilot).

---

## 🌟 أبرز مميزات المشروع

- **🛒 واجهة متجر تفاعلية راقية (Storefront):**
  - عرض المنتجات بتصنيفات متعددة (عناية بالبشرة، عناية بالشعر، عطور، مكياج، عناية بالجسم).
  - بحث دلالي ذكي وسريع بالاسم، والوسوم، والمكونات، والفوائد العلاجية.
  - نظام تقييمات بالنجوم (1 إلى 5 نجوم) مع حاسبة متوسط التقييم المباشر، وتوزيع النجوم، وإضافة تقييمات العميلات فورياً.
  - نافذة نظرة سريعة (Quick View) وصفحة تفاصيل متكاملة مع باقات التوفير (Frequently Bought Together).

- **📲 نظام طلب مباشر فوري عبر واتساب (WhatsApp Direct Ordering):**
  - توليد رسائل طلب احترافية ومفصلة تتضمن تفاصيل السلة، الأسعار، العناوين، ورقم الطلب.
  - رقم الواتساب المعتمد: `+967 777 627 595`.
  - خيارات الدفع عند الاستلام أو التحويل مع حساب رسوم التوصيل والشحن المجاني التلقائي.

- **🤖 ذكاء اصطناعي مدمج (Powered by Google Gemini):**
  - **محلل المنتجات الذكي بالرؤية الحاسوبية:** تحليل صورة المنتج وتوليد العنوان التسويقي، الوصف، الفئة، والوسوم آلياً.
  - **المساعد الإداري الذكي (AI Admin Copilot):** مستشار تفاعلي للوحة التحكم لتحليل المخزون، والطلبات، ومقترحات التسويق.

- **🔐 لوحة تحكم إدارية متكاملة (Admin Dashboard):**
  - إدارة المنتجات والمخزون، وتعديل الأسعار والكميات.
  - متابعة الطلبات وتحديث حالات الشحن (قيد الانتظار، قيد التجهيز، تم الشحن، مكتمل).
  - إعدادات المتجر ورقم الواتساب ورسائل الترحيب مع حفظ التغييرات محلياً وسحابياً.

---

## 🚀 جاهزية المشروع للنشر (Readiness Status)

المشروع **جاهز 100%** للرفع على **GitHub** والاستضافة على **Vercel** وأي منصة سحابية أخرى:
- ✅ **مُهيأ لـ Vercel:** يتضمن ملف `vercel.json` ومسار Serverless Function في `api/index.ts` لدعم مسارات الـ API والـ SPA.
- ✅ **مُهيأ لـ GitHub:** ملف `.gitignore` نظيف يستثني الملفات غير الضرورية والمفاتيح السرية.
- ✅ **بناء خالي من الأخطاء:** تم فحص الكود بالكامل واجتياز اختبارات الـ TypeScript والـ Build بنجاح.

---

## 📋 دليل الرفع على GitHub (GitHub Push Guide)

اتبع الخطوات البسيطة التالية لرفع المشروع إلى حسابك على GitHub:

```bash
# 1. الدخول إلى مجلد المشروع
cd /path/to/project

# 2. تهيئة مستودع Git (إذا لم يكن مهيئاً)
git init

# 3. إضافة جميع الملفات
git add .

# 4. تسجيل أول Commit
git commit -m "feat: initial commit - Amazon Duaa full-stack commerce app"

# 5. تغيير اسم الفرع الرئيسي إلى main
git branch -M main

# 6. ربط المستودع بمستودعك على GitHub (استبدل الرابط برابط مستودعك)
git remote add origin https://github.com/YOUR_USERNAME/amazon-duaa-store.git

# 7. رفع الكود
git push -u origin main
```

---

## ⚡ خطوات الاستضافة على Vercel (Vercel Deployment)

1. توجه إلى موقع [Vercel](https://vercel.com) وسجل الدخول باستخدام حساب GitHub الخاص بك.
2. انقر على **"Add New..."** ثم اختر **"Project"**.
3. اختر مستودع المشروع `amazon-duaa-store` واضغط على **"Import"**.
4. سيتعرف Vercel تلقائياً على إعدادات المشروع عبر `vercel.json`:
   - **Framework Preset:** `Vite`
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. **إعداد متغيرات البيئة (Environment Variables):**
   في قسم **Environment Variables**، أضف المتغيرات التالية:
   - `GEMINI_API_KEY`: مفتاح الـ API الخاص بـ Google Gemini (لتشغيل الذكاء الاصطناعي والمساعد الإداري).
   - `VITE_WHATSAPP_NUMBER`: رقم الواتساب بدون علامة + (مثال: `967777627595`).
   - `VITE_SUPABASE_URL`: (اختياري) رابط مشروع Supabase للربط السحابي.
   - `VITE_SUPABASE_ANON_KEY`: (اختياري) المفتاح العام لـ Supabase.
6. اضغط على **"Deploy"**.
7. خلال أقل من دقيقة، سيكون موقعك منشوراً ومتاحاً عبر رابط عالمي سريع ومؤمن بشهادة SSL تلقائياً!

---

## 💻 التشغيل المحلي (Local Development)

لتشغيل المشروع محلياً على جهازك:

```bash
# 1. تثبيت الحزم
npm install

# 2. إنشاء ملف البيئة
cp .env.example .env

# 3. تشغيل خادم التطوير (الواجهة + الـ API)
npm run dev
```

افتح المتصفح على: `http://localhost:3000`

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion.
- **Backend / APIs:** Node.js, Express, Vercel Serverless Functions (`api/index.ts`).
- **AI Engine:** Google Gemini API (`@google/genai`).
- **Database & Sync:** Supabase JS Client & LocalStorage Auto-Sync.
- **Deployment Targets:** Vercel (Default), Render (`render.yaml`), Docker (`Dockerfile`).
