import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle,
  Layers,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Plus,
  Play,
  RotateCcw,
  Eye,
  FileText,
  Sliders,
  PackageCheck,
  Tag,
  DollarSign,
  Film
} from 'lucide-react';
import { Category, Product, StoreSettings } from '../types';
import { SAMPLE_AI_PRESETS } from '../data/initialData';
import { AIVideoStudio } from './AIVideoStudio';

export interface BatchProductItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize: string;
  fileKey?: string;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'saved' | 'error';
  progress: number; // 0 - 100
  errorMessage?: string;
  title_ar: string;
  description_ar: string;
  category_id: string;
  category_name: string;
  original_price: string;
  discount_price: string;
  stock_quantity: string;
  tags: string[];
  tagsInput: string;
  how_to_use: string;
  ingredients: string;
  ai_generated: boolean;
}

interface AdminProductFormProps {
  categories: Category[];
  onProductCreated: (product: Product) => void;
  onProductsCreated?: (products: Product[]) => void;
  settings: StoreSettings;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  categories,
  onProductCreated,
  onProductsCreated,
  settings,
}) => {
  // Mode selection: 'batch' for multi-upload, 'video' for AI video studio, 'single' for manual form
  const [activeMode, setActiveMode] = useState<'batch' | 'video' | 'single'>('batch');

  // Images / Batch Queue State
  const [images, setImages] = useState<BatchProductItem[]>([]);
  // Maintain alias for batchItems to ensure 100% compatibility across existing component logic
  const batchItems = images;
  const setBatchItems = setImages;

  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState<BatchProductItem | null>(null);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  // References for persistent FIFO queue across consecutive batch selections
  const batchItemsRef = useRef<BatchProductItem[]>(images);
  batchItemsRef.current = images;
  const pendingQueueRef = useRef<BatchProductItem[]>([]);
  const activeWorkersCountRef = useRef<number>(0);

  // Single Product Form Fields
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);
  const [singleImagePreview, setSingleImagePreview] = useState<string>('');
  const [isSingleAnalyzing, setIsSingleAnalyzing] = useState(false);
  const [singleAiSuccess, setSingleAiSuccess] = useState(false);
  const [singleErrorMessage, setSingleErrorMessage] = useState('');

  const [singleFormData, setSingleFormData] = useState({
    title_ar: '',
    description_ar: '',
    original_price: '',
    discount_price: '',
    stock_quantity: '15',
    category_id: categories[0]?.id || 'skincare',
    tags: [] as string[],
    tagsInput: '',
    how_to_use: '',
    ingredients: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Helper to get unique fingerprint for files to prevent duplicates
  const getFileFingerprint = (file: File): string => {
    return `${file.name}_${file.size}_${file.lastModified}`;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return url;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return url;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(url);
      });
    } catch {
      return url;
    }
  };

  // Helper to send image to AI API
  const requestAiAnalysis = async (base64: string, mimeType: string = 'image/jpeg') => {
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

    return await response.json();
  };

  // --- BATCH PROCESSING ENGINE ---

  // Process a single item within the batch without mutating or losing other items
  const processBatchItem = async (item: BatchProductItem): Promise<BatchProductItem> => {
    try {
      // Step 1: Update progress to converting
      setBatchItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', progress: 25 } : i))
      );

      let base64 = '';
      let mimeType = 'image/jpeg';

      if (item.file) {
        base64 = await fileToBase64(item.file);
        mimeType = item.file.type || 'image/jpeg';
      } else if (item.previewUrl) {
        base64 = await urlToBase64(item.previewUrl);
      }

      // Step 2: Sending to Gemini API
      setBatchItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, progress: 60 } : i))
      );

      const aiData = await requestAiAnalysis(base64, mimeType);

      // Find matching category
      const matchedCat =
        categories.find(
          (c) => c.name_ar === aiData.category_name || aiData.category_name?.includes(c.name_ar)
        ) || categories[0];

      const tagsList = Array.isArray(aiData.tags) ? aiData.tags : ['عناية_فاخرة', 'جمال', 'أصلي'];
      const suggestedPrice = aiData.suggested_price ? String(aiData.suggested_price) : '120';

      const updatedItem: BatchProductItem = {
        ...item,
        status: 'completed',
        progress: 100,
        title_ar: aiData.title_ar || 'مستحضر تجميلي فاخر',
        description_ar: aiData.description_ar || 'تركيبة غنية ومبتكرة تمنح البشرة والشعر تغذية ونضارة استثنائية.',
        category_id: matchedCat.id,
        category_name: matchedCat.name_ar,
        original_price: suggestedPrice,
        discount_price: '',
        stock_quantity: '15',
        tags: tagsList,
        tagsInput: tagsList.join(', '),
        how_to_use: 'يُستخدم على بشرة نظيفة ويدلك بلطف بحركات دائرية حتى الامتصاص.',
        ingredients: 'مستخلصات طبيعية 100%، فيتامينات مغذية، ماء نقي، زيوت أساسية.',
        ai_generated: true,
      };

      // Safely update this item while preserving all other items in prev
      setBatchItems((prev) =>
        prev.map((i) => {
          if (i.id !== item.id) return i;
          return {
            ...i,
            ...updatedItem,
            // Keep any user edits that may have occurred
            title_ar: i.title_ar && i.title_ar !== i.fileName ? i.title_ar : updatedItem.title_ar,
            description_ar: i.description_ar || updatedItem.description_ar,
            original_price: i.original_price && i.original_price !== '110' ? i.original_price : updatedItem.original_price,
            discount_price: i.discount_price || updatedItem.discount_price,
            stock_quantity: i.stock_quantity || updatedItem.stock_quantity,
          };
        })
      );
      return updatedItem;
    } catch (err: any) {
      console.error(`Batch item failed [${item.fileName}]:`, err);
      const failedItem: BatchProductItem = {
        ...item,
        status: 'error',
        progress: 100,
        errorMessage: err.message || 'فشل الاتصال بخدمة الذكاء الاصطناعي',
      };
      setBatchItems((prev) => prev.map((i) => (i.id === item.id ? failedItem : i)));
      return failedItem;
    }
  };

  // Persistent Queue Worker (handles multiple batches added at any time)
  const enqueueBatchItems = useCallback((itemsToEnqueue: BatchProductItem[]) => {
    if (itemsToEnqueue.length === 0) return;

    // Push new items to the FIFO queue
    pendingQueueRef.current.push(...itemsToEnqueue);
    setIsBatchProcessing(true);

    const maxConcurrency = 2; // Safe parallel workers to prevent AI rate limiting

    const startWorker = async () => {
      while (pendingQueueRef.current.length > 0) {
        const nextItem = pendingQueueRef.current.shift();
        if (nextItem) {
          try {
            await processBatchItem(nextItem);
          } catch (err) {
            console.error('Error in batch worker for item:', nextItem.fileName, err);
          }
        }
      }

      activeWorkersCountRef.current = Math.max(0, activeWorkersCountRef.current - 1);
      if (activeWorkersCountRef.current === 0) {
        setIsBatchProcessing(false);
      }
    };

    // Spawn workers up to maxConcurrency
    while (
      activeWorkersCountRef.current < maxConcurrency &&
      activeWorkersCountRef.current < (pendingQueueRef.current.length + activeWorkersCountRef.current)
    ) {
      activeWorkersCountRef.current += 1;
      startWorker();
    }
  }, [categories]);

  // Handle addition of multiple files (File Picker or Drag & Drop) - Refactored to use 'files' array instead of files[0]
  const handleAddFiles = (fileInput: FileList | File[]) => {
    const rawFiles = Array.from(fileInput);
    const videoFiles = rawFiles.filter((file) => file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name));

    // If video files were provided, seamlessly switch to AI Video Studio
    if (videoFiles.length > 0 && rawFiles.length === videoFiles.length) {
      setActiveMode('video');
      setBatchNotice('تم الكشف عن ملفات فيديو؛ تم التبديل إلى استوديو الفيديو الذكي لمعالجتها بدقة.');
      return;
    }

    // Convert FileList or File[] into a standard 'files' array
    const files: File[] = rawFiles.filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;

    // Filter duplicates by filename or size before they enter the processing queue
    const existingFileNames = new Set(images.map((img) => img.fileName.toLowerCase()));
    const existingFileSizes = new Set(images.map((img) => img.fileSize));

    const uniqueFiles: File[] = [];
    const seenNames = new Set<string>();
    const seenSizes = new Set<string>();

    for (const file of files) {
      const formattedSize = formatFileSize(file.size);
      const nameLower = file.name.toLowerCase();

      // Check for duplicates by filename or size
      const isDuplicateByName = existingFileNames.has(nameLower) || seenNames.has(nameLower);
      const isDuplicateBySize = (existingFileSizes.has(formattedSize) && existingFileNames.has(nameLower)) ||
                                (seenNames.has(nameLower) && seenSizes.has(formattedSize));

      if (!isDuplicateByName && !isDuplicateBySize) {
        seenNames.add(nameLower);
        seenSizes.add(formattedSize);
        uniqueFiles.push(file);
      }
    }

    const skippedCount = files.length - uniqueFiles.length;

    if (uniqueFiles.length === 0) {
      setBatchNotice('تم تجاهل الصور المحددة لأنها مضافة مسبقاً في القائمة (تمت تصفية التكرار حسب اسم الملف والحجم).');
      return;
    }

    if (skippedCount > 0) {
      setBatchNotice(`تمت إضافة ${uniqueFiles.length} صور جديدة وتخطي ${skippedCount} صور مكررة.`);
    } else {
      setBatchNotice(`تمت إضافة ${uniqueFiles.length} صور جديدة إلى طابور المعالجة.`);
    }

    const newImages: BatchProductItem[] = uniqueFiles.map((file, idx) => ({
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      file,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileKey: getFileFingerprint(file),
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      title_ar: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      description_ar: '',
      category_id: categories[0]?.id || 'skincare',
      category_name: categories[0]?.name_ar || 'عناية بالبشرة',
      original_price: '110',
      discount_price: '',
      stock_quantity: '15',
      tags: ['عناية', 'جمال'],
      tagsInput: 'عناية, جمال',
      how_to_use: '',
      ingredients: '',
      ai_generated: false,
    }));

    // Implement 'setImages(prev => [...prev, ...newImages])' pattern to ensure new selections append to existing uploads rather than replacing them
    setImages((prev) => [...prev, ...newImages]);

    // Enqueue newly added items into the persistent queue
    enqueueBatchItems(newImages);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Load sample presets into batch - SAFE APPEND & DEDUPLICATE
  const handleAddPresetBatch = () => {
    const existingTitles = new Set(batchItemsRef.current.map((i) => i.title_ar));
    const presetsToAdd = SAMPLE_AI_PRESETS.filter((p) => !existingTitles.has(p.name));

    if (presetsToAdd.length === 0) {
      setBatchNotice('تمت إضافة النماذج التجريبية مسبقاً إلى القائمة.');
      return;
    }

    const presetItems: BatchProductItem[] = presetsToAdd.map((preset, idx) => ({
      id: `preset-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      fileName: `${preset.name}.jpg`,
      fileSize: '1.2 MB',
      fileKey: `preset_${preset.name}`,
      previewUrl: preset.url,
      status: 'pending',
      progress: 0,
      title_ar: preset.name,
      description_ar: '',
      category_id: categories[0]?.id || 'skincare',
      category_name: categories[0]?.name_ar || 'عناية بالبشرة',
      original_price: '125',
      discount_price: '',
      stock_quantity: '20',
      tags: ['عناية_فاخرة', 'أصلي'],
      tagsInput: 'عناية_فاخرة, أصلي',
      how_to_use: '',
      ingredients: '',
      ai_generated: false,
    }));

    setBatchNotice(`تمت إضافة ${presetItems.length} نماذج تجريبية جديدة إلى القائمة.`);
    // Strictly append without replacing previous items
    setBatchItems((prev) => [...prev, ...presetItems]);
    enqueueBatchItems(presetItems);
  };

  // Retry failed items safely without affecting completed or pending items
  const handleRetryFailed = () => {
    const failedItems = batchItems.filter((i) => i.status === 'error');
    if (failedItems.length === 0) return;

    const resetItems = failedItems.map((i) => ({
      ...i,
      status: 'pending' as const,
      progress: 0,
      errorMessage: undefined,
    }));

    setBatchItems((prev) =>
      prev.map((i) => {
        const match = resetItems.find((r) => r.id === i.id);
        return match ? match : i;
      })
    );

    enqueueBatchItems(resetItems);
  };

  // Remove single item from batch
  const handleRemoveBatchItem = (id: string) => {
    pendingQueueRef.current = pendingQueueRef.current.filter((i) => i.id !== id);
    setBatchItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedEditItem?.id === id) {
      setSelectedEditItem(null);
    }
  };

  // Clear all items in batch
  const handleClearBatch = () => {
    if (batchItems.length === 0) return;
    if (window.confirm('هل تريد مسح قائمة الرفع الجماعي بالكامل؟')) {
      pendingQueueRef.current = [];
      setBatchItems([]);
      setSelectedEditItem(null);
      setBatchNotice(null);
    }
  };

  // Clear only previously saved/published items from view
  const handleClearSaved = () => {
    setBatchItems((prev) => prev.filter((i) => i.status !== 'saved'));
    setBatchNotice('تم إخفاء المنتجات المنشورة من قائمة الرفع مع بقائها في المتجر.');
  };

  // Convert Batch Item to Product entity
  const mapBatchItemToProduct = (item: BatchProductItem): Product => {
    const selectedCat = categories.find((c) => c.id === item.category_id) || categories[0];
    const tagsArray = item.tagsInput
      ? item.tagsInput.split(/[,،]/).map((t) => t.trim()).filter(Boolean)
      : item.tags;

    return {
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title_ar: item.title_ar,
      description_ar: item.description_ar || 'منتج أصلي فاخر للعناية والجمال.',
      original_price: parseFloat(item.original_price) || 120,
      discount_price: item.discount_price ? parseFloat(item.discount_price) : null,
      stock_quantity: parseInt(item.stock_quantity) || 15,
      category_id: selectedCat.id,
      category_name: selectedCat.name_ar,
      tags: tagsArray.length > 0 ? tagsArray : ['عناية', 'جمال'],
      image_url: item.previewUrl,
      ai_generated: item.ai_generated,
      rating: 5.0,
      reviews_count: 1,
      how_to_use: item.how_to_use || 'يُستخدم على بشرة نظيفة ويدلك بلطف.',
      ingredients: item.ingredients || 'مستخلصات طبيعية وزيوت مغذية.',
      created_at: new Date().toISOString(),
      featured: true,
    };
  };

  // Save ALL completed items to store - MARKS THEM AS SAVED WITHOUT DELETING OR LOSING THEM
  const handleSaveAllCompleted = () => {
    const completedItems = batchItems.filter((i) => i.status === 'completed');
    if (completedItems.length === 0) return;

    const newProducts = completedItems.map(mapBatchItemToProduct);

    if (onProductsCreated) {
      onProductsCreated(newProducts);
    } else {
      newProducts.forEach((p) => onProductCreated(p));
    }

    // Mark as saved so items remain in UI with all data, instead of being discarded!
    const completedIds = new Set(completedItems.map((i) => i.id));
    setBatchItems((prev) =>
      prev.map((i) => (completedIds.has(i.id) ? { ...i, status: 'saved' as const } : i))
    );
    setSelectedEditItem(null);
    setBatchNotice(`تم نشر ${newProducts.length} منتجات في المتجر بنجاح!`);
  };

  // Save single item from edit modal
  const handleSaveEditedItem = (updated: BatchProductItem) => {
    setBatchItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedEditItem(null);
  };

  // --- SINGLE MANUAL FORM HANDLERS ---
  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Uses a 'files' array instead of direct files[0]
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    // If multiple images are picked, route all of them to batch processing queue without losing any files
    if (files.length > 1) {
      handleAddFiles(files);
      setActiveMode('batch');
      return;
    }

    const file = files[0];
    setSingleImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSingleImagePreview(objectUrl);
    setIsSingleAnalyzing(true);
    setSingleAiSuccess(false);
    setSingleErrorMessage('');

    try {
      const base64 = await fileToBase64(file);
      const aiData = await requestAiAnalysis(base64, file.type);

      const matchedCat =
        categories.find(
          (c) => c.name_ar === aiData.category_name || aiData.category_name?.includes(c.name_ar)
        ) || categories[0];

      const tagsList = Array.isArray(aiData.tags) ? aiData.tags : ['عناية', 'جمال'];

      setSingleFormData((prev) => ({
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
      setSingleAiSuccess(true);
    } catch (err: any) {
      console.error('Error analyzing single image:', err);
      setSingleErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي');
    } finally {
      setIsSingleAnalyzing(false);
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFormData.title_ar || !singleFormData.original_price || !singleImagePreview) {
      setSingleErrorMessage('يرجى التأكد من رفع صورة المنتج وإدخال العنوان والسعر الأصلي');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === singleFormData.category_id) || categories[0];
    const tagsArray = singleFormData.tagsInput
      ? singleFormData.tagsInput.split(/[,،]/).map((t) => t.trim()).filter(Boolean)
      : singleFormData.tags;

    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      title_ar: singleFormData.title_ar,
      description_ar: singleFormData.description_ar,
      original_price: parseFloat(singleFormData.original_price),
      discount_price: singleFormData.discount_price ? parseFloat(singleFormData.discount_price) : null,
      stock_quantity: parseInt(singleFormData.stock_quantity) || 15,
      category_id: selectedCategory.id,
      category_name: selectedCategory.name_ar,
      tags: tagsArray,
      image_url: singleImagePreview,
      ai_generated: singleAiSuccess,
      rating: 5.0,
      reviews_count: 1,
      how_to_use: singleFormData.how_to_use,
      ingredients: singleFormData.ingredients,
      created_at: new Date().toISOString(),
      featured: true,
    };

    onProductCreated(newProduct);

    // Reset Form
    setSingleFormData({
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
    setSingleImagePreview('');
    setSingleImageFile(null);
    setSingleAiSuccess(false);
  };

  // Batch stats
  const totalCount = batchItems.length;
  const completedCount = batchItems.filter((i) => i.status === 'completed').length;
  const savedCount = batchItems.filter((i) => i.status === 'saved').length;
  const processingCount = batchItems.filter((i) => i.status === 'processing').length;
  const pendingCount = batchItems.filter((i) => i.status === 'pending').length;
  const errorCount = batchItems.filter((i) => i.status === 'error').length;
  const overallProgress =
    totalCount > 0
      ? Math.round(((completedCount + savedCount + errorCount) / totalCount) * 100)
      : 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
      {/* Header & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-stone-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-600" />
            <span>نظام رفع ومعالجة صور المنتجات بالذكاء الاصطناعي</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            يدعم رفع صور متعددة دفعة واحدة (Batch Upload) مع دمج تراكمي تلقائي ومعالجة متوازية آمنة.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('batch')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'batch'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4 text-rose-600" />
            <span>الرفع الجماعي للصور</span>
            {batchItems.length > 0 && (
              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                {batchItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('video')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'video'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Film className="w-4 h-4 text-rose-600" />
            <span>استوديو الفيديو الذكي (AI Video Studio)</span>
            <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
              5s Reels ✨
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('single')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'single'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Plus className="w-4 h-4 text-rose-600" />
            <span>إضافة منتج يدوي / فردي</span>
          </button>
        </div>
      </div>

      {/* ===================== MODE 1: BATCH UPLOAD ===================== */}
      {activeMode === 'batch' && (
        <div className="space-y-6">
          {/* Informational Notification Banner (Duplicates skipped / Batches appended) */}
          {batchNotice && (
            <div className="flex items-center justify-between gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-bold animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{batchNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setBatchNotice(null)}
                className="text-blue-500 hover:text-blue-800 text-xs px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Preset Test Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-rose-950 font-bold">
              <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
              <span>هل تريد تجربة الرفع الجماعي أو إضافة نماذج تجريبية جديدة؟</span>
            </div>
            <button
              type="button"
              onClick={handleAddPresetBatch}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>إضافة 3 نماذج تجريبية إلى القائمة الحالية</span>
            </button>
          </div>

          {/* Drag & Drop Multi-file Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              isDragging
                ? 'border-rose-500 bg-rose-50/70 scale-[1.01]'
                : 'border-stone-300 hover:border-rose-400 bg-stone-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
                e.target.value = ''; // Reset input so next selections always fire onChange
              }}
              className="hidden"
              id="product-batch-upload"
            />

            <label htmlFor="product-batch-upload" className="cursor-pointer block">
              <div className="w-16 h-16 rounded-2xl bg-rose-100/70 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 mb-1">
                اسحب وأفلت صوراً إضافية هنا، أو اضغط لاختيار دفعة جديدة من جهازك
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                يمكنك رفع <strong>عدة دفعات متتالية</strong> (دفعة أولى ثم ثانية ثم ثالثة)؛ ستُضاف كل دفعة تلقائياً إلى القائمة السابقة دون حذف أو استبدال أي صور قديمة.
              </p>
              <div className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:bg-rose-600 transition-colors">
                <Plus className="w-4 h-4" />
                <span>إضافة مجموعة صور جديدة (Append Multiple Files)</span>
              </div>
            </label>
          </div>

          {/* Overall Batch Progress Banner */}
          {totalCount > 0 && (
            <div className="bg-stone-900 text-white rounded-3xl p-5 shadow-lg border border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black">
                    {isBatchProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <PackageCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-sm">
                      حالة طابور المعالجة الجماعية ({completedCount + savedCount} من {totalCount} جاهزة/منشورة)
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {isBatchProcessing
                        ? `جاري معالجة ${processingCount} صور بالتوازي (${pendingCount} في الانتظار)...`
                        : completedCount > 0
                        ? `✨ يوجد ${completedCount} منتجات مكتملة وجاهزة للنشر دفعة واحدة!`
                        : savedCount > 0
                        ? `🎉 جميع الصور منشورة بنجاح في المتجر (${savedCount} منتجات).`
                        : 'تم إيقاف أو انتهاء المعالجة.'}
                    </p>
                  </div>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={handleRetryFailed}
                      disabled={isBatchProcessing}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة محاولة الصور المتعثرة ({errorCount})</span>
                    </button>
                  )}

                  {completedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveAllCompleted}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ ونشر جميع المنتجات المكتملة ({completedCount})</span>
                    </button>
                  )}

                  {savedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSaved}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      title="إخفاء المنتجات المنشورة فقط من قائمة الرفع"
                    >
                      <span>إخفاء المنشور ({savedCount})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClearBatch}
                    disabled={isBatchProcessing}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                    title="مسح القائمة بالكامل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Queue Grid of Uploaded Images */}
          {batchItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  <span>قائمة الصور قيد المعالجة والمراجعة ({batchItems.length})</span>
                </h3>
                <span className="text-xs text-stone-400">
                  {completedCount} جاهزة • {savedCount} منشورة • {processingCount + pendingCount} قيد المعالجة
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batchItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 transition-all relative flex flex-col justify-between ${
                      item.status === 'saved'
                        ? 'border-teal-300 bg-teal-50/20 shadow-xs'
                        : item.status === 'completed'
                        ? 'border-emerald-200 shadow-xs'
                        : item.status === 'processing'
                        ? 'border-rose-300 ring-2 ring-rose-100 shadow-sm'
                        : item.status === 'error'
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* Top Item Info */}
                    <div className="flex gap-3 items-start">
                      <div className="relative shrink-0">
                        <img
                          src={item.previewUrl}
                          alt={item.fileName}
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-xs"
                        />
                        {item.status === 'saved' && (
                          <div className="absolute -top-1.5 -right-1.5 bg-teal-600 text-white rounded-full p-0.5 shadow-sm" title="تم النشر بالمتجر">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        {item.status === 'completed' && (
                          <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm" title="جاهز للإضافة">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-sm" title="تعذر التحليل">
                            <XCircle className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-stone-900 truncate" title={item.title_ar}>
                            {item.title_ar}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchItem(item.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="حذف من الطابور"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-stone-400">{item.fileSize}</span>
                          <span className="text-stone-300">•</span>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                            {item.category_name}
                          </span>
                        </div>

                        {(item.status === 'completed' || item.status === 'saved') && (
                          <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-stone-900">
                            <span>السعر: {item.original_price} {settings.currency}</span>
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                              Gemini AI ✨
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      {item.status === 'processing' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-rose-600">
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              جاري التحليل...
                            </span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-600 h-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {item.status === 'pending' && (
                        <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-stone-300 animate-pulse" />
                          <span>في الانتظار بالطابور...</span>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="text-[11px] text-rose-600 font-bold flex items-center justify-between">
                          <span className="truncate">{item.errorMessage || 'تعذر التحليل'}</span>
                          <button
                            type="button"
                            onClick={() => processBatchItem(item)}
                            className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-800 px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer"
                          >
                            إعادة محاولة
                          </button>
                        </div>
                      )}

                      {item.status === 'completed' && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            جاهز للإضافة
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedEditItem(item)}
                            className="text-[11px] text-stone-600 hover:text-rose-600 font-bold flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>مراجعة / تعديل</span>
                          </button>
                        </div>
                      )}

                      {item.status === 'saved' && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                            <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                            تم النشر بالمتجر ✓
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedEditItem(item)}
                            className="text-[11px] text-stone-600 hover:text-teal-700 font-bold flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>عرض البيانات</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== MODE 2: AI VIDEO STUDIO ===================== */}
      {activeMode === 'video' && (
        <AIVideoStudio
          categories={categories}
          onProductCreated={onProductCreated}
          onProductsCreated={onProductsCreated}
          settings={settings}
        />
      )}

      {/* ===================== MODE 3: SINGLE MANUAL FORM ===================== */}
      {activeMode === 'single' && (
        <form onSubmit={handleSingleSubmit} className="space-y-6">
          {singleErrorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{singleErrorMessage}</span>
            </div>
          )}

          {/* Single Image Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">صورة المنتج *</label>
            <div className="border-2 border-dashed border-stone-300 hover:border-rose-400 rounded-3xl p-6 text-center bg-stone-50/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleSingleFileChange}
                className="hidden"
                id="product-single-image-upload"
              />

              <label htmlFor="product-single-image-upload" className="cursor-pointer block">
                {singleImagePreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={singleImagePreview}
                      alt="Preview"
                      className="max-h-52 rounded-2xl object-cover shadow-md mx-auto border border-stone-200"
                    />
                    <span className="text-xs text-stone-500 mt-2 block">انقر لاستبدال الصورة</span>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-stone-500">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-stone-800 mb-1">
                      اضغط لاختيار صورة المنتج لتحليلها
                    </p>
                    <p className="text-xs text-stone-400">JPG، PNG، WEBP</p>
                  </div>
                )}
              </label>
            </div>

            {isSingleAnalyzing && (
              <div className="flex items-center justify-center gap-3 p-3.5 mt-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                <span>جاري تحليل الصورة وتوليد المواصفات بالذكاء الاصطناعي...</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              عنوان المنتج (بالعربية) *
            </label>
            <input
              type="text"
              required
              value={singleFormData.title_ar}
              onChange={(e) => setSingleFormData({ ...singleFormData, title_ar: e.target.value })}
              placeholder="مثال: سيروم حمض الهيالورونيك وفيتامين B5"
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">الوصف التسويقي</label>
            <textarea
              rows={3}
              value={singleFormData.description_ar}
              onChange={(e) => setSingleFormData({ ...singleFormData, description_ar: e.target.value })}
              placeholder="وصف مميزات ونتائج المنتج..."
              className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">التصنيف</label>
              <select
                value={singleFormData.category_id}
                onChange={(e) => setSingleFormData({ ...singleFormData, category_id: e.target.value })}
                className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
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
                الوسوم (مفصولة بفواصل)
              </label>
              <input
                type="text"
                value={singleFormData.tagsInput}
                onChange={(e) => setSingleFormData({ ...singleFormData, tagsInput: e.target.value })}
                placeholder="ترطيب, نضارة, سيروم"
                className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                السعر الأصلي ({settings.currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={singleFormData.original_price}
                onChange={(e) => setSingleFormData({ ...singleFormData, original_price: e.target.value })}
                placeholder="120"
                className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                سعر الخصم ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={singleFormData.discount_price}
                onChange={(e) => setSingleFormData({ ...singleFormData, discount_price: e.target.value })}
                placeholder="اختياري"
                className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">الكمية بالمخزون *</label>
              <input
                type="number"
                min="0"
                required
                value={singleFormData.stock_quantity}
                onChange={(e) => setSingleFormData({ ...singleFormData, stock_quantity: e.target.value })}
                placeholder="15"
                className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!singleFormData.title_ar || !singleFormData.original_price || !singleImagePreview || isSingleAnalyzing}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>حفظ ونشر المنتج الفردي</span>
          </button>
        </form>
      )}

      {/* ===================== EDIT / REVIEW MODAL FOR INDIVIDUAL BATCH ITEM ===================== */}
      {selectedEditItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-base text-stone-900">مراجعة وتعديل بيانات المنتج</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEditItem(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <img
                  src={selectedEditItem.previewUrl}
                  alt={selectedEditItem.title_ar}
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200"
                />
                <div>
                  <span className="font-bold text-stone-800 block text-sm">{selectedEditItem.title_ar}</span>
                  <span className="text-stone-400 text-[11px]">{selectedEditItem.fileName}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">عنوان المنتج</label>
                <input
                  type="text"
                  value={selectedEditItem.title_ar}
                  onChange={(e) =>
                    setSelectedEditItem({ ...selectedEditItem, title_ar: e.target.value })
                  }
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">الوصف التسويقي</label>
                <textarea
                  rows={3}
                  value={selectedEditItem.description_ar}
                  onChange={(e) =>
                    setSelectedEditItem({ ...selectedEditItem, description_ar: e.target.value })
                  }
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">التصنيف</label>
                  <select
                    value={selectedEditItem.category_id}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value);
                      setSelectedEditItem({
                        ...selectedEditItem,
                        category_id: e.target.value,
                        category_name: cat ? cat.name_ar : selectedEditItem.category_name,
                      });
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">السعر الأصلي ({settings.currency})</label>
                  <input
                    type="number"
                    value={selectedEditItem.original_price}
                    onChange={(e) =>
                      setSelectedEditItem({ ...selectedEditItem, original_price: e.target.value })
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">الوسوم (مفصولة بفواصل)</label>
                <input
                  type="text"
                  value={selectedEditItem.tagsInput}
                  onChange={(e) =>
                    setSelectedEditItem({ ...selectedEditItem, tagsInput: e.target.value })
                  }
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedEditItem(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 font-bold hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEditedItem(selectedEditItem)}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductForm;
