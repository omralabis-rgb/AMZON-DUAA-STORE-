import React, { useState } from 'react';
import { Upload, Sparkles, Loader2, Image as ImageIcon, Check, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { Category, Product, StoreSettings } from '../types';
import { SAMPLE_AI_PRESETS } from '../data/initialData';

interface AdminProductFormProps {
  categories: Category[];
  onProductCreated: (product: Product) => void;
  settings: StoreSettings;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  categories,
  onProductCreated,
  settings,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title_ar: '',
    description_ar: '',
    original_price: '',
    discount_price: '',
    stock_quantity: '15',
    category_id: 'skincare',
    tags: [] as string[],
    tagsInput: '',
    how_to_use: '',
    ingredients: '',
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const urlToBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const analyzeImage = async (base64: string, mimeType: string = 'image/jpeg') => {
    setIsAnalyzing(true);
    setAiSuccess(false);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-product-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'تعذر تحليل الصورة بالذكاء الاصطناعي');
      }

      const aiData = await response.json();

      // Find matching category ID
      const matchedCat = categories.find(
        (c) => c.name_ar === aiData.category_name || aiData.category_name?.includes(c.name_ar)
      ) || categories[0];

      const tagsList = Array.isArray(aiData.tags) ? aiData.tags : ['عناية', 'جمال'];

      setFormData((prev) => ({
        ...prev,
        title_ar: aiData.title_ar || prev.title_ar,
        description_ar: aiData.description_ar || prev.description_ar,
        category_id: matchedCat.id,
        tags: tagsList,
        tagsInput: tagsList.join(', '),
        original_price: prev.original_price || (aiData.suggested_price ? String(aiData.suggested_price) : '95'),
        how_to_use: prev.how_to_use || 'يُستخدم على بشرة نظيفة ويدلك بلطف بحركات دائرية حتى الامتصاص.',
        ingredients: prev.ingredients || 'مستخلصات طبيعية، فيتامينات مغذية، ماء نقي، زيوت طبيعية أساسية.',
      }));

      setAiSuccess(true);
    } catch (err: any) {
      console.error('Error analyzing image:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const base64 = await fileToBase64(file);
      await analyzeImage(base64, file.type);
    } catch (err) {
      console.error('Failed to convert file to base64:', err);
    }
  };

  const handlePresetSelect = async (preset: (typeof SAMPLE_AI_PRESETS)[0]) => {
    setImagePreview(preset.url);
    setImageFile(null);
    setErrorMessage('');

    try {
      const base64 = await urlToBase64(preset.url);
      await analyzeImage(base64, 'image/jpeg');
    } catch (e) {
      // Fallback direct analyze
      await analyzeImage(preset.url, 'image/jpeg');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_ar || !formData.original_price || !imagePreview) {
      setErrorMessage('يرجى التأكد من رفع صورة المنتج وإدخال العنوان والسعر الأصلي');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === formData.category_id) || categories[0];

    const tagsArray = formData.tagsInput
      ? formData.tagsInput.split(/[,،]/).map((t) => t.trim()).filter(Boolean)
      : formData.tags;

    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      title_ar: formData.title_ar,
      description_ar: formData.description_ar,
      original_price: parseFloat(formData.original_price),
      discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
      stock_quantity: parseInt(formData.stock_quantity) || 10,
      category_id: selectedCategory.id,
      category_name: selectedCategory.name_ar,
      tags: tagsArray,
      image_url: imagePreview,
      ai_generated: aiSuccess,
      rating: 5.0,
      reviews_count: 1,
      how_to_use: formData.how_to_use,
      ingredients: formData.ingredients,
      created_at: new Date().toISOString(),
      featured: true,
    };

    onProductCreated(newProduct);

    // Reset Form
    setFormData({
      title_ar: '',
      description_ar: '',
      original_price: '',
      discount_price: '',
      stock_quantity: '15',
      category_id: categories[0]?.id || 'skincare',
      tags: [],
      tagsInput: '',
      how_to_use: '',
      ingredients: '',
    });
    setImagePreview('');
    setImageFile(null);
    setAiSuccess(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-600" />
            <span>إضافة منتج جديد بواسطة الذكاء الاصطناعي (Gemini Vision)</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            ارفع صورة لأي منتج تجميل، وسيقوم نموذج Gemini 3.8 Flash بتحليل الصورة وصياغة العنوان، الوصف التسويقي، وتحديد القسم والوسوم آلياً.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Test Images */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-stone-700 mb-2">
          ⚡ تجربة سريعة بضغطة واحدة (نماذج صور جاهزة لاختبار الرؤية الحاسوبية):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_AI_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="flex items-center gap-2.5 p-2 rounded-2xl border border-stone-200 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/50 transition-all text-right group"
            >
              <img
                src={preset.url}
                alt={preset.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200"
              />
              <div className="overflow-hidden">
                <span className="block text-xs font-bold text-stone-800 group-hover:text-rose-600 truncate">
                  {preset.name}
                </span>
                <span className="block text-[10px] text-stone-500 truncate">
                  تحليل تلقائي
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload Zone */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-stone-700 mb-2">صورة المنتج المُراد تحليله *</label>
        <div className="border-2 border-dashed border-stone-300 hover:border-rose-400 rounded-3xl p-6 sm:p-8 text-center bg-stone-50/50 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="product-image-upload"
          />

          <label htmlFor="product-image-upload" className="cursor-pointer block">
            {imagePreview ? (
              <div className="flex flex-col items-center">
                <div className="relative group/preview inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-60 rounded-2xl object-cover shadow-md mx-auto border border-stone-200"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 rounded-2xl opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-2">
                    <RefreshCw className="w-4 h-4" />
                    اضغط لتغيير الصورة
                  </div>
                </div>
                <span className="text-xs text-stone-500 mt-3 block">انقر على الصورة لاستبدالها</span>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-stone-500">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-stone-800 mb-1">
                  اسحب وأفلت صورة المنتج هنا، أو اضغط للاختيار من جهازك
                </p>
                <p className="text-xs text-stone-400">يدعم صيغ JPG، PNG، WEBP حتى 25 ميجابايت</p>
              </div>
            )}
          </label>
        </div>

        {/* AI Loading State */}
        {isAnalyzing && (
          <div className="flex items-center justify-center gap-3 p-4 mt-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 animate-pulse text-xs sm:text-sm font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
            <span>جاري تحليل صورة المنتج واستخراج المواصفات والكلمات المفتاحية بواسطة الذكاء الاصطناعي...</span>
          </div>
        )}

        {/* AI Success Notification */}
        {aiSuccess && !isAnalyzing && (
          <div className="flex items-center justify-between p-3.5 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
            <span className="flex items-center gap-2 font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              تم تحليل الصورة وتوليد الحقول بالذكاء الاصطناعي بنجاح! يمكنك مراجعتها وتعديلها أدناه.
            </span>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Gemini Vision
            </span>
          </div>
        )}
      </div>

      {/* Product Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            عنوان المنتج (SEO بالعربية) *
          </label>
          <input
            type="text"
            required
            value={formData.title_ar}
            onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
            placeholder="مثال: سيروم حمض الهيالورونيك 2% وفيتامين B5 للترطيب العميق"
            className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            الوصف التسويقي والفوائد
          </label>
          <textarea
            rows={4}
            value={formData.description_ar}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            placeholder="وصف جذاب يوضح طريقة حل المشكلة، النتائج المتوقعة، ونوع البشرة أو الشعر المناسب..."
            className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all leading-relaxed"
          />
        </div>

        {/* Categories & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              تصنيف المنتج
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              الكلمات المفتاحية والوسوم (مفصولة بفواصل)
            </label>
            <input
              type="text"
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              placeholder="نضارة, ترطيب_عميق, سيروم, عناية_يومية"
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              السعر الأصلي ({settings.currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.original_price}
              onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
              placeholder="120.00"
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              سعر بعد الخصم ({settings.currency})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.discount_price}
              onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
              placeholder="اتركه فارغاً إن لم يكن هناك خصم"
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              الكمية المتوفرة في المخزون *
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              placeholder="20"
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Additional Beauty Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">طريقة الاستخدام</label>
            <input
              type="text"
              value={formData.how_to_use}
              onChange={(e) => setFormData({ ...formData, how_to_use: e.target.value })}
              placeholder="ضعي قطرات بسيطة صباحاً ومساءً على بشرة رطبة..."
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">المكونات الفعالة</label>
            <input
              type="text"
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="حمض الهيالورونيك، فيتامين B5، ماء مقطر، خلاصة الصبار..."
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!formData.title_ar || !formData.original_price || !imagePreview || isAnalyzing}
          className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white py-4 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>حفظ ونشر المنتج في المتجر</span>
        </button>
      </form>
    </div>
  );
};
