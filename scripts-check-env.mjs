#!/usr/bin/env node

console.log('🔍 جارٍ التحقق من تكوين بيئة العمل...');

const warnings = [];
const info = [];

if (!process.env.GEMINI_API_KEY) {
  warnings.push('⚠️ GEMINI_API_KEY غير محدد: سيعمل التطبيق بالوضع التقديري الاحتياطي للرؤية');
} else {
  info.push('✅ GEMINI_API_KEY متوفر');
}

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  info.push('ℹ️ Supabase غير مرتبط: سيعمل التطبيق في الوضع المزدوج التلقائي (Local Cache & Mock)');
} else {
  info.push('✅ إعدادات Supabase متوفرة');
}

console.log('--- تقرير الفحص ---');
info.forEach((msg) => console.log(msg));
warnings.forEach((msg) => console.log(msg));
console.log('🚀 جاهز للتشغيل بنجاح!');
