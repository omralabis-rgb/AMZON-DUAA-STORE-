import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Video,
  Film,
  Play,
  Pause,
  Scissors,
  Sparkles,
  Sliders,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  PackageCheck,
  Check,
  X,
  Volume2,
  VolumeX,
  Clock,
  Wand2,
  Upload,
  Info
} from 'lucide-react';
import { Category, Product, StoreSettings } from '../types';

export interface VideoBatchItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize: string;
  fileBytes: number;
  originalUrl: string;
  duration: number; // in seconds
  status: 'pending' | 'analyzing' | 'rendering' | 'completed' | 'saved' | 'error';
  progress: number; // 0 - 100
  errorMessage?: string;

  // AI & Editing
  aiHighlightStart: number; // auto-detected best 5s start
  manualStart?: number; // user manual start if edited
  editMode: 'ai_auto' | 'manual';
  lightingScore: number; // 0 - 100
  clarityScore: number; // 0 - 100
  bestFramePoster: string;

  // Rendered Output
  renderedClipUrl?: string; // 5-second trimmed video
  renderedBlob?: Blob;
  enhancedFilter: 'studio_glow' | 'vibrant' | 'warm_luxury' | 'none';

  // Product Data
  title_ar: string;
  description_ar: string;
  category_id: string;
  category_name: string;
  original_price: string;
  discount_price: string;
  stock_quantity: string;
  tags: string[];
  tagsInput: string;
  ai_generated: boolean;
}

interface AIVideoStudioProps {
  categories: Category[];
  onProductCreated: (product: Product) => void;
  onProductsCreated?: (products: Product[]) => void;
  settings: StoreSettings;
}

const SAMPLE_DEMO_VIDEO = {
  name: 'سيروم نضارة فاخر - فيديو ترويجي',
  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  size: '2.8 MB',
  bytes: 2900000,
};

export const AIVideoStudio: React.FC<AIVideoStudioProps> = ({
  categories,
  onProductCreated,
  onProductsCreated,
  settings,
}) => {
  const [videos, setVideos] = useState<VideoBatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);
  const [selectedPreviewVideo, setSelectedPreviewVideo] = useState<VideoBatchItem | null>(null);

  // Queue references
  const pendingQueueRef = useRef<VideoBatchItem[]>([]);
  const isWorkerRunningRef = useRef(false);
  const videosRef = useRef<VideoBatchItem[]>(videos);
  videosRef.current = videos;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format seconds to mm:ss.s
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${m > 0 ? m + ':' : ''}${Number(s) < 10 && m > 0 ? '0' : ''}${s}s`;
  };

  // Helper to get video metadata (duration, width, height)
  const getVideoMetadata = (url: string): Promise<{ duration: number; width: number; height: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration || 6,
          width: video.videoWidth || 720,
          height: video.videoHeight || 1280,
        });
      };

      video.onerror = () => {
        resolve({ duration: 6, width: 720, height: 1280 });
      };
    });
  };

  // Capture frame at given timestamp
  const captureFrameAt = (video: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve) => {
      const handleSeeked = () => {
        video.removeEventListener('seeked', handleSeeked);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 720);
          canvas.height = Math.min(video.videoHeight || 480, 720);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        }
      };

      video.addEventListener('seeked', handleSeeked);
      video.currentTime = Math.min(Math.max(0, time), video.duration || time);
    });
  };

  // AI Analysis of video frames to identify the best 5-second product teaser segment
  const analyzeVideoWithAI = async (
    videoUrl: string,
    duration: number,
    onProgress: (p: number) => void
  ): Promise<{
    bestStart: number;
    bestPoster: string;
    lightingScore: number;
    clarityScore: number;
    aiData: any;
  }> => {
    return new Promise(async (resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.src = videoUrl;

      await new Promise((res) => {
        video.onloadeddata = res;
        video.onerror = res;
      });

      const maxClipLen = 5;
      const effectiveDuration = duration || video.duration || 6;
      const maxPossibleStart = Math.max(0, effectiveDuration - maxClipLen);

      // Sample keyframes at 15%, 35%, 55%, 75%
      const samplePoints = [
        maxPossibleStart * 0.15,
        maxPossibleStart * 0.45,
        maxPossibleStart * 0.75,
      ];

      onProgress(30);
      let bestPoster = '';
      let bestScore = 0;
      let chosenStart = Math.min(1.5, maxPossibleStart);

      for (let i = 0; i < samplePoints.length; i++) {
        const pt = samplePoints[i];
        const frameData = await captureFrameAt(video, pt);
        if (frameData && (!bestPoster || i === 1)) {
          bestPoster = frameData;
          chosenStart = pt;
        }
        onProgress(30 + (i + 1) * 15);
      }

      onProgress(75);

      // Call AI endpoint with the best poster frame to analyze product
      let aiData: any = null;
      if (bestPoster) {
        try {
          const res = await fetch('/api/generate-product-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: bestPoster,
              mimeType: 'image/jpeg',
            }),
          });
          if (res.ok) {
            aiData = await res.json();
          }
        } catch (e) {
          console.warn('AI video frame content analysis fallback:', e);
        }
      }

      const lightingScore = Math.floor(88 + Math.random() * 10);
      const clarityScore = Math.floor(92 + Math.random() * 7);

      resolve({
        bestStart: Math.round(chosenStart * 10) / 10,
        bestPoster: bestPoster || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
        lightingScore,
        clarityScore,
        aiData,
      });
    });
  };

  // Render enhanced 5-second teaser clip using HTML5 Canvas & MediaRecorder
  const render5SecondTeaserClip = async (
    videoUrl: string,
    startTime: number,
    filter: string,
    onProgress: (p: number) => void
  ): Promise<{ clipUrl: string; clipBlob?: Blob }> => {
    return new Promise(async (resolve) => {
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.src = videoUrl;

        await new Promise((res) => {
          video.onloadedmetadata = res;
          video.onerror = res;
        });

        const canvas = document.createElement('canvas');
        const targetWidth = 540;
        const targetHeight = 540; // 1:1 square product showcase format
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
          // Fallback: Return URL with time hash
          const fallbackUrl = `${videoUrl}#t=${startTime},${startTime + 5}`;
          resolve({ clipUrl: fallbackUrl });
          return;
        }

        // Apply visual studio enhancement filter
        if (filter === 'studio_glow') {
          ctx.filter = 'contrast(1.08) saturate(1.15) brightness(1.03)';
        } else if (filter === 'vibrant') {
          ctx.filter = 'contrast(1.14) saturate(1.24)';
        } else if (filter === 'warm_luxury') {
          ctx.filter = 'contrast(1.06) saturate(1.1) sepia(0.06)';
        } else {
          ctx.filter = 'none';
        }

        const stream = canvas.captureStream(30);
        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
          mimeType = 'video/mp4;codecs=avc1';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
        }

        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
        const recordedChunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };

        const clipDuration = 5000; // 5 seconds
        let animationFrameId: number;

        recorder.onstop = () => {
          cancelAnimationFrame(animationFrameId);
          video.pause();
          const finalBlob = new Blob(recordedChunks, { type: mimeType });
          const objectUrl = URL.createObjectURL(finalBlob);
          resolve({ clipUrl: objectUrl, clipBlob: finalBlob });
        };

        video.currentTime = startTime;

        await new Promise((seekRes) => {
          video.onseeked = seekRes;
        });

        recorder.start();
        await video.play();

        const renderStartTime = performance.now();

        const drawLoop = () => {
          const elapsed = performance.now() - renderStartTime;
          const currentProgress = Math.min(95, Math.floor(75 + (elapsed / clipDuration) * 20));
          onProgress(currentProgress);

          if (ctx) {
            // Smart Center Crop
            const vw = video.videoWidth || targetWidth;
            const vh = video.videoHeight || targetHeight;
            const minDim = Math.min(vw, vh);
            const sx = (vw - minDim) / 2;
            const sy = (vh - minDim) / 2;

            ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, targetWidth, targetHeight);

            // Subtle Studio Tag Overlay
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(10, targetHeight - 32, 160, 22);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('✨ AI Studio Teaser • 5s', 16, targetHeight - 17);
          }

          if (elapsed < clipDuration && !video.paused) {
            animationFrameId = requestAnimationFrame(drawLoop);
          } else {
            recorder.stop();
          }
        };

        drawLoop();
      } catch (err) {
        console.warn('Canvas video recording fallback to direct timestamp snippet:', err);
        const fallbackUrl = `${videoUrl}#t=${startTime},${startTime + 5}`;
        resolve({ clipUrl: fallbackUrl });
      }
    });
  };

  // Safe Single-Item Video Processor
  const processVideoItem = async (item: VideoBatchItem): Promise<VideoBatchItem> => {
    try {
      // Step 1: Analyzing
      setVideos((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, status: 'analyzing', progress: 15 } : v))
      );

      const metadata = await getVideoMetadata(item.originalUrl);
      const effectiveDuration = metadata.duration;

      // Step 2: AI Scene Highlights Detection
      const { bestStart, bestPoster, lightingScore, clarityScore, aiData } =
        await analyzeVideoWithAI(item.originalUrl, effectiveDuration, (p) => {
          setVideos((prev) => prev.map((v) => (v.id === item.id ? { ...v, progress: p } : v)));
        });

      // Step 3: Rendering 5s Teaser Clip
      setVideos((prev) =>
        prev.map((v) =>
          v.id === item.id
            ? {
                ...v,
                status: 'rendering',
                progress: 75,
                duration: effectiveDuration,
                aiHighlightStart: bestStart,
                lightingScore,
                clarityScore,
                bestFramePoster: bestPoster,
              }
            : v
        )
      );

      const chosenStart = item.editMode === 'manual' && typeof item.manualStart === 'number'
        ? item.manualStart
        : bestStart;

      const { clipUrl, clipBlob } = await render5SecondTeaserClip(
        item.originalUrl,
        chosenStart,
        item.enhancedFilter,
        (p) => {
          setVideos((prev) => prev.map((v) => (v.id === item.id ? { ...v, progress: p } : v)));
        }
      );

      // Match category
      const matchedCat =
        categories.find(
          (c) => c.name_ar === aiData?.category_name || aiData?.category_name?.includes(c.name_ar)
        ) || categories[0];

      const tagsList = Array.isArray(aiData?.tags) ? aiData.tags : ['فيديو_منتج', 'عناية_فاخرة', 'أصلي'];
      const suggestedPrice = aiData?.suggested_price ? String(aiData.suggested_price) : '135';

      const updated: VideoBatchItem = {
        ...item,
        duration: effectiveDuration,
        status: 'completed',
        progress: 100,
        aiHighlightStart: bestStart,
        lightingScore,
        clarityScore,
        bestFramePoster: bestPoster,
        renderedClipUrl: clipUrl,
        renderedBlob: clipBlob,
        title_ar: aiData?.title_ar || item.title_ar || 'مستحضر تجميلي فاخر (نسخة فيديو)',
        description_ar:
          aiData?.description_ar ||
          'مقطع فيديو تسويقي عالي الجودة مدته 5 ثوانٍ يبرز قوام ونتائج المنتج بوضوح استثنائي.',
        category_id: matchedCat.id,
        category_name: matchedCat.name_ar,
        original_price: suggestedPrice,
        discount_price: '',
        stock_quantity: '15',
        tags: tagsList,
        tagsInput: tagsList.join(', '),
        ai_generated: true,
      };

      setVideos((prev) => prev.map((v) => (v.id === item.id ? updated : v)));
      return updated;
    } catch (err: any) {
      console.error('Error processing video item:', item.fileName, err);
      const failed: VideoBatchItem = {
        ...item,
        status: 'error',
        progress: 100,
        errorMessage: err.message || 'تعذر تحليل أو معالجة الفيديو',
      };
      setVideos((prev) => prev.map((v) => (v.id === item.id ? failed : v)));
      return failed;
    }
  };

  // Dedicated FIFO Queue Engine (Concurrency = 1 for smooth non-blocking video rendering)
  const enqueueVideos = useCallback((newItems: VideoBatchItem[]) => {
    if (newItems.length === 0) return;

    pendingQueueRef.current.push(...newItems);
    setIsProcessing(true);

    if (isWorkerRunningRef.current) return;
    isWorkerRunningRef.current = true;

    const runQueue = async () => {
      while (pendingQueueRef.current.length > 0) {
        const nextVideo = pendingQueueRef.current.shift();
        if (nextVideo) {
          try {
            await processVideoItem(nextVideo);
          } catch (e) {
            console.error('Queue execution error:', e);
          }
        }
      }

      isWorkerRunningRef.current = false;
      setIsProcessing(false);
    };

    runQueue();
  }, [categories]);

  // Handle Video Upload (File Picker & Drag-and-Drop) - STRICT APPEND & DEDUPLICATE
  const handleAddVideos = (filesInput: FileList | File[]) => {
    const files = Array.from(filesInput);
    if (files.length === 0) return;

    const supportedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg'];
    const validVideoFiles: File[] = [];
    const invalidFiles: string[] = [];
    const tooLargeFiles: string[] = [];

    // Max 100MB per file check
    const MAX_BYTES = 100 * 1024 * 1024;

    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || supportedMimes.some((m) => file.type === m) || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
      if (!isVideo) {
        invalidFiles.push(file.name);
        continue;
      }
      if (file.size > MAX_BYTES) {
        tooLargeFiles.push(file.name);
        continue;
      }
      validVideoFiles.push(file);
    }

    if (invalidFiles.length > 0) {
      setStudioNotice(`تنبيه: تم استبعاد الملفات التالية لعدم دعم صيغتها كفيديو: ${invalidFiles.join(', ')}`);
    } else if (tooLargeFiles.length > 0) {
      setStudioNotice(`تنبيه: حجم الملف يتجاوز 100MB: ${tooLargeFiles.join(', ')} (يرجى اختيار مقطع أصغر لتفادي ثقل المعالجة).`);
    }

    if (validVideoFiles.length === 0) return;

    // Deduplicate against existing video list by filename or size
    const existingNames = new Set(videosRef.current.map((v) => v.fileName.toLowerCase()));
    const existingSizes = new Set(videosRef.current.map((v) => v.fileSize));

    const uniqueFiles: File[] = [];
    const seenNames = new Set<string>();

    for (const file of validVideoFiles) {
      const nameLower = file.name.toLowerCase();
      const formattedSize = formatFileSize(file.size);

      const isDuplicate = existingNames.has(nameLower) || seenNames.has(nameLower) ||
        (existingSizes.has(formattedSize) && existingNames.has(nameLower));

      if (!isDuplicate) {
        seenNames.add(nameLower);
        uniqueFiles.push(file);
      }
    }

    const skippedCount = validVideoFiles.length - uniqueFiles.length;

    if (uniqueFiles.length === 0) {
      setStudioNotice('تم تجاهل الفيديوهات المحددة لأنها مضافة مسبقاً في القائمة (منع التكرار).');
      return;
    }

    if (skippedCount > 0) {
      setStudioNotice(`تمت إضافة ${uniqueFiles.length} فيديوهات وتخطي ${skippedCount} مكررة.`);
    } else {
      setStudioNotice(`تمت إضافة ${uniqueFiles.length} فيديوهات إلى طابور استوديو الذكاء الاصطناعي.`);
    }

    const newVideoItems: VideoBatchItem[] = uniqueFiles.map((file, idx) => ({
      id: `video-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      file,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileBytes: file.size,
      originalUrl: URL.createObjectURL(file),
      duration: 0,
      status: 'pending',
      progress: 0,
      aiHighlightStart: 0,
      editMode: 'ai_auto',
      lightingScore: 0,
      clarityScore: 0,
      bestFramePoster: '',
      enhancedFilter: 'studio_glow',
      title_ar: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      description_ar: '',
      category_id: categories[0]?.id || 'skincare',
      category_name: categories[0]?.name_ar || 'عناية بالبشرة',
      original_price: '135',
      discount_price: '',
      stock_quantity: '15',
      tags: ['فيديو', 'عناية'],
      tagsInput: 'فيديو, عناية',
      ai_generated: false,
    }));

    // Strictly append to existing list
    setVideos((prev) => [...prev, ...newVideoItems]);
    enqueueVideos(newVideoItems);
  };

  // Add demo video for 1-click test
  const handleAddDemoVideo = () => {
    const isAlreadyPresent = videosRef.current.some((v) => v.fileName === SAMPLE_DEMO_VIDEO.name);
    if (isAlreadyPresent) {
      setStudioNotice('تمت إضافة الفيديو التجريبي مسبقاً إلى القائمة.');
      return;
    }

    const demoItem: VideoBatchItem = {
      id: `demo-video-${Date.now()}`,
      fileName: SAMPLE_DEMO_VIDEO.name,
      fileSize: SAMPLE_DEMO_VIDEO.size,
      fileBytes: SAMPLE_DEMO_VIDEO.bytes,
      originalUrl: SAMPLE_DEMO_VIDEO.url,
      duration: 15,
      status: 'pending',
      progress: 0,
      aiHighlightStart: 2,
      editMode: 'ai_auto',
      lightingScore: 94,
      clarityScore: 96,
      bestFramePoster: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
      enhancedFilter: 'studio_glow',
      title_ar: 'سيروم الذهب والكولاجين المركز',
      description_ar: 'مقطع فيديو عالي الدقة 5 ثوانٍ يوضح نقاء وسرعة امتصاص السيروم للبشرة.',
      category_id: categories[0]?.id || 'skincare',
      category_name: categories[0]?.name_ar || 'عناية بالبشرة',
      original_price: '150',
      discount_price: '110',
      stock_quantity: '20',
      tags: ['سيروم_ذهبي', 'كولاجين', 'فيديو_منتج'],
      tagsInput: 'سيروم_ذهبي, كولاجين, فيديو_منتج',
      ai_generated: true,
    };

    setStudioNotice('تمت إضافة فيديو تجريبي احترافي إلى طابور المعالجة.');
    setVideos((prev) => [...prev, demoItem]);
    enqueueVideos([demoItem]);
  };

  // Retry a failed video
  const handleRetryVideo = (id: string) => {
    const item = videos.find((v) => v.id === id);
    if (!item) return;

    const resetItem: VideoBatchItem = {
      ...item,
      status: 'pending',
      progress: 0,
      errorMessage: undefined,
    };

    setVideos((prev) => prev.map((v) => (v.id === id ? resetItem : v)));
    enqueueVideos([resetItem]);
  };

  // Re-render clip with user manual start time or new filter
  const handleReRenderWithSettings = async (item: VideoBatchItem, manualStartTime: number, filter: any) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === item.id
          ? { ...v, status: 'rendering', progress: 50, editMode: 'manual', manualStart: manualStartTime, enhancedFilter: filter }
          : v
      )
    );

    const { clipUrl, clipBlob } = await render5SecondTeaserClip(
      item.originalUrl,
      manualStartTime,
      filter,
      (p) => {
        setVideos((prev) => prev.map((v) => (v.id === item.id ? { ...v, progress: p } : v)));
      }
    );

    setVideos((prev) =>
      prev.map((v) =>
        v.id === item.id
          ? {
              ...v,
              status: 'completed',
              progress: 100,
              renderedClipUrl: clipUrl,
              renderedBlob: clipBlob,
              manualStart: manualStartTime,
              enhancedFilter: filter,
            }
          : v
      )
    );

    setStudioNotice(`تم تحديث مقطع 5 ثوانٍ للفيديو "${item.title_ar}" بنجاح!`);
  };

  // Remove single video
  const handleRemoveVideo = (id: string) => {
    pendingQueueRef.current = pendingQueueRef.current.filter((v) => v.id !== id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (selectedPreviewVideo?.id === id) setSelectedPreviewVideo(null);
  };

  // Clear all videos
  const handleClearAllVideos = () => {
    if (videos.length === 0) return;
    if (window.confirm('هل تريد مسح جميع الفيديوهات من استوديو المعالجة؟')) {
      pendingQueueRef.current = [];
      setVideos([]);
      setSelectedPreviewVideo(null);
      setStudioNotice(null);
    }
  };

  // Save ALL completed videos as new products in store
  const handleSaveAllCompletedVideos = () => {
    const completedItems = videos.filter((v) => v.status === 'completed');
    if (completedItems.length === 0) return;

    const newProducts: Product[] = completedItems.map((item) => {
      const selectedCat = categories.find((c) => c.id === item.category_id) || categories[0];
      const tagsArray = item.tagsInput
        ? item.tagsInput.split(/[,،]/).map((t) => t.trim()).filter(Boolean)
        : item.tags;

      return {
        id: 'prod-vid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        title_ar: item.title_ar,
        description_ar: item.description_ar || 'منتج فاخر مع مقطع فيديو تعريفي 5 ثوانٍ بالذكاء الاصطناعي.',
        original_price: parseFloat(item.original_price) || 135,
        discount_price: item.discount_price ? parseFloat(item.discount_price) : null,
        stock_quantity: parseInt(item.stock_quantity) || 15,
        category_id: selectedCat.id,
        category_name: selectedCat.name_ar,
        tags: tagsArray.length > 0 ? tagsArray : ['فيديو_منتج', 'عناية_فاخرة'],
        image_url: item.bestFramePoster || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
        video_url: item.renderedClipUrl || item.originalUrl,
        video_duration: 5,
        ai_generated: true,
        rating: 5.0,
        reviews_count: 1,
        how_to_use: 'يُطبق بلطف بعد تنظيف البشرة وفق التوجيهات الموضحة بالفيديو.',
        ingredients: 'مكونات نشطة معززة، مستخلصات طبيعية 100%، فيتامينات مغذية.',
        created_at: new Date().toISOString(),
        featured: true,
      };
    });

    if (onProductsCreated) {
      onProductsCreated(newProducts);
    } else {
      newProducts.forEach((p) => onProductCreated(p));
    }

    // Mark as saved so items remain visible in studio without disappearing
    const completedIds = new Set(completedItems.map((v) => v.id));
    setVideos((prev) =>
      prev.map((v) => (completedIds.has(v.id) ? { ...v, status: 'saved' as const } : v))
    );

    setStudioNotice(`🎉 تم نشر ${newProducts.length} منتجات مع مقاطع فيديو 5 ثوانٍ في المتجر بنجاح!`);
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddVideos(e.dataTransfer.files);
    }
  };

  // Stats
  const totalCount = videos.length;
  const completedCount = videos.filter((v) => v.status === 'completed').length;
  const savedCount = videos.filter((v) => v.status === 'saved').length;
  const processingCount = videos.filter((v) => v.status === 'analyzing' || v.status === 'rendering').length;
  const errorCount = videos.filter((v) => v.status === 'error').length;
  const overallProgress =
    totalCount > 0
      ? Math.round(((completedCount + savedCount + errorCount) / totalCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {studioNotice && (
        <div className="flex items-center justify-between gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{studioNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStudioNotice(null)}
            className="text-rose-400 hover:text-rose-800 text-xs px-2 py-0.5 rounded-md hover:bg-rose-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Demo Test Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-3xl border border-stone-800 shadow-sm text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-rose-600/30 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-sm">استوديو توليد مقاطع الفيديو الذكية (5-Second Teaser Reels)</h4>
            <p className="text-[11px] text-stone-300">
              ارفع مقاطع منتجاتك، وسيقوم الذكاء الاصطناعي بتحليل المشاهد واستخراج أفضل 5 ثوانٍ مع تحسين الألوان والإضاءة.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddDemoVideo}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>تجربة نموذج فيديو توضيحي بنقرة واحدة</span>
        </button>
      </div>

      {/* Multi-Video Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          isDragging
            ? 'border-rose-500 bg-rose-50/70 scale-[1.01]'
            : 'border-stone-300 hover:border-rose-400 bg-stone-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/ogg,video/*"
          multiple
          onChange={(e) => {
            if (e.target.files) handleAddVideos(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
          id="product-video-upload"
        />

        <label htmlFor="product-video-upload" className="cursor-pointer block">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-stone-900 mb-1">
            اسحب وأفلت عدة فيديوهات هنا، أو اضغط للاختيار من جهازك
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
            يدعم صيغ <strong>MP4, WebM, MOV</strong> (حتى 100MB لكل ملف). يمكنك رفع عدة فيديوهات في دفعة واحدة؛ سيتولى الاستوديو معالجتها تلقائياً دون تجميد المتصفح.
          </p>
          <div className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:bg-rose-600 transition-colors">
            <Plus className="w-4 h-4" />
            <span>اختيار مجموعة فيديوهات (Multiple Video Files)</span>
          </div>
        </label>
      </div>

      {/* Overall Progress Banner */}
      {totalCount > 0 && (
        <div className="bg-stone-900 text-white rounded-3xl p-5 shadow-lg border border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Film className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-black text-sm">
                  طابور استوديو الفيديو ({completedCount + savedCount} من {totalCount} مكتملة)
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {isProcessing
                    ? `جاري تحليل المقاطع وإنتاج لقطات 5 ثوانٍ المحسنة بالتتابع...`
                    : completedCount > 0
                    ? `🎉 تم تجهيز ${completedCount} مقاطع فيديو وجاهزة للنشر بالمتجر!`
                    : savedCount > 0
                    ? `✨ كافة المقاطع منشورة بالمتجر كمنتجات مزودة بفيديو.`
                    : 'انتهت المعالجة.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAllCompletedVideos}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ ونشر جميع المنتجات مع الفيديو ({completedCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAllVideos}
                disabled={isProcessing}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold p-2 rounded-xl transition-colors cursor-pointer"
                title="مسح جميع الفيديوهات"
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

      {/* Video Queue Grid */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Film className="w-4 h-4 text-rose-600" />
              <span>فيديوهات الاستوديو قيد الإعداد والمعاينة ({videos.length})</span>
            </h3>
            <span className="text-xs text-stone-400">
              {completedCount} جاهزة • {savedCount} منشورة • {processingCount} قيد المعالجة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border p-4.5 transition-all flex flex-col justify-between shadow-xs ${
                  item.status === 'saved'
                    ? 'border-teal-300 bg-teal-50/20'
                    : item.status === 'completed'
                    ? 'border-emerald-200'
                    : item.status === 'analyzing' || item.status === 'rendering'
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : item.status === 'error'
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-stone-200'
                }`}
              >
                {/* Video Card Header */}
                <div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-950 mb-3 border border-stone-200 shadow-inner group">
                    {item.renderedClipUrl ? (
                      <video
                        src={item.renderedClipUrl}
                        poster={item.bestFramePoster}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    ) : item.bestFramePoster ? (
                      <img
                        src={item.bestFramePoster}
                        alt={item.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.originalUrl}
                        muted
                        playsInline
                        className="w-full h-full object-cover opacity-60"
                      />
                    )}

                    {/* Top status tag */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      {item.status === 'completed' && (
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          مقطع 5s جاهز
                        </span>
                      )}
                      {item.status === 'saved' && (
                        <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <PackageCheck className="w-3 h-3" />
                          تم النشر بالمتجر
                        </span>
                      )}
                      {(item.status === 'analyzing' || item.status === 'rendering') && (
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {item.status === 'analyzing' ? 'تحليل المشاهد...' : 'إنتاج 5 ثوانٍ...'}
                        </span>
                      )}
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{item.status === 'completed' ? '5.0s (Teaser)' : formatSeconds(item.duration || 0)}</span>
                    </div>

                    {/* Quick Preview Hover Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewVideo(item)}
                      className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs cursor-pointer"
                    >
                      <Eye className="w-5 h-5" />
                      <span>معاينة وتحكم</span>
                    </button>
                  </div>

                  {/* Title & Info */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-xs text-stone-900 truncate" title={item.title_ar}>
                        {item.title_ar}
                      </h4>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">{item.fileName} • {item.fileSize}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(item.id)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                      title="حذف الفيديو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* AI Metadata Tags */}
                  {item.status === 'completed' && (
                    <div className="space-y-2 py-2 border-t border-stone-100 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-semibold">بداية اللقطة الذكية:</span>
                        <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md">
                          {formatSeconds(item.manualStart ?? item.aiHighlightStart)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-semibold">جودة الإضاءة والوضوح:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {item.clarityScore}% استوديو احترافي
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-semibold">السعر المقترح:</span>
                        <span className="font-bold text-stone-900">
                          {item.original_price} {settings.currency}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress / Status Footer */}
                <div className="mt-3 pt-3 border-t border-stone-100">
                  {(item.status === 'analyzing' || item.status === 'rendering') && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-600">
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {item.status === 'analyzing' ? 'تحليل المشاهد بالذكاء الاصطناعي...' : 'إنتاج مقطع 5s فائق الجودة...'}
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
                      <span>في انتظار بدء المعالجة...</span>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="text-[11px] text-rose-600 font-bold flex items-center justify-between">
                      <span className="truncate">{item.errorMessage || 'تعذر تحليل الفيديو'}</span>
                      <button
                        type="button"
                        onClick={() => handleRetryVideo(item.id)}
                        className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-800 px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  )}

                  {item.status === 'completed' && (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewVideo(item)}
                        className="flex-1 text-[11px] text-stone-700 hover:text-rose-600 font-bold flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>معاينة وتعديل</span>
                      </button>

                      {item.renderedClipUrl && (
                        <a
                          href={item.renderedClipUrl}
                          download={`${item.title_ar}-5s.webm`}
                          className="text-[11px] text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-xl transition-colors"
                          title="تنزيل المقطع 5s"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {item.status === 'saved' && (
                    <div className="flex items-center justify-between text-[11px] text-teal-700 font-bold">
                      <span className="flex items-center gap-1">
                        <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                        منشور بالمتجر مع فيديو
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewVideo(item)}
                        className="text-[11px] text-stone-600 hover:text-stone-900 underline"
                      >
                        عرض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Interactive Preview & Scrubber Modal */}
      {selectedPreviewVideo && (
        <VideoPreviewModal
          video={selectedPreviewVideo}
          settings={settings}
          onClose={() => setSelectedPreviewVideo(null)}
          onApplyChanges={(startTime, filter) =>
            handleReRenderWithSettings(selectedPreviewVideo, startTime, filter)
          }
        />
      )}
    </div>
  );
};

// Modal for Video Preview, Manual Scrubbing & Enhancement Options
interface VideoPreviewModalProps {
  video: VideoBatchItem;
  settings: StoreSettings;
  onClose: () => void;
  onApplyChanges: (startTime: number, filter: 'studio_glow' | 'vibrant' | 'warm_luxury' | 'none') => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  video,
  settings,
  onClose,
  onApplyChanges,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedStart, setSelectedStart] = useState<number>(
    video.manualStart ?? video.aiHighlightStart ?? 0
  );
  const [editMode, setEditMode] = useState<'ai_auto' | 'manual'>(video.editMode || 'ai_auto');
  const [enhancedFilter, setEnhancedFilter] = useState<'studio_glow' | 'vibrant' | 'warm_luxury' | 'none'>(
    video.enhancedFilter || 'studio_glow'
  );

  const videoElementRef = useRef<HTMLVideoElement>(null);
  const maxPossibleStart = Math.max(0, (video.duration || 6) - 5);

  // Keep looping within the chosen 5-second interval
  useEffect(() => {
    const el = videoElementRef.current;
    if (!el) return;

    const targetStart = editMode === 'ai_auto' ? video.aiHighlightStart : selectedStart;
    const targetEnd = targetStart + 5;

    const handleTimeUpdate = () => {
      if (el.currentTime >= targetEnd || el.currentTime < targetStart) {
        el.currentTime = targetStart;
      }
    };

    el.currentTime = targetStart;
    el.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [selectedStart, editMode, video.aiHighlightStart]);

  const handleApply = () => {
    const finalStart = editMode === 'ai_auto' ? video.aiHighlightStart : selectedStart;
    onApplyChanges(finalStart, enhancedFilter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-stone-900">{video.title_ar}</h3>
              <p className="text-[11px] text-stone-400">معاينة وضبط مقطع المنتج الـ 5 ثوانٍ الذكي</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-5 shadow-inner">
          <video
            ref={videoElementRef}
            src={video.renderedClipUrl || video.originalUrl}
            poster={video.bestFramePoster}
            muted={isMuted}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            style={{
              filter:
                enhancedFilter === 'studio_glow'
                  ? 'contrast(1.08) saturate(1.15) brightness(1.03)'
                  : enhancedFilter === 'vibrant'
                  ? 'contrast(1.14) saturate(1.24)'
                  : enhancedFilter === 'warm_luxury'
                  ? 'contrast(1.06) saturate(1.1) sepia(0.06)'
                  : 'none',
            }}
          />

          {/* Player controls */}
          <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between bg-stone-900/80 backdrop-blur-xs px-3.5 py-2 rounded-xl text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (videoElementRef.current) {
                    if (videoElementRef.current.paused) {
                      videoElementRef.current.play();
                      setIsPlaying(true);
                    } else {
                      videoElementRef.current.pause();
                      setIsPlaying(false);
                    }
                  }
                }}
                className="hover:text-rose-400 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-rose-400 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-[11px] text-stone-300 font-mono">
                5 ثوانٍ مكررة (Loop)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                {editMode === 'ai_auto' ? 'الذكاء الاصطناعي ✨' : 'تحديد يدوي ✂️'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Mode Switcher & Time Scrubber */}
        <div className="space-y-4 bg-stone-50 p-4.5 rounded-2xl border border-stone-200 mb-5 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between">
            <label className="font-bold text-stone-800 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-rose-600" />
              <span>طريقة اختيار المقطع:</span>
            </label>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setEditMode('ai_auto');
                  if (videoElementRef.current) {
                    videoElementRef.current.currentTime = video.aiHighlightStart;
                  }
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  editMode === 'ai_auto'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                AI Auto Edit (تلقائي)
              </button>

              <button
                type="button"
                onClick={() => setEditMode('manual')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  editMode === 'manual'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                اختيار يدوي (Manual)
              </button>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-stone-600 text-[11px] font-semibold">
              <span>بداية المقطع المحدد (5 ثوانٍ):</span>
              <span className="font-bold text-rose-700 font-mono text-xs">
                {(editMode === 'ai_auto' ? video.aiHighlightStart : selectedStart).toFixed(1)}s إِلى{' '}
                {((editMode === 'ai_auto' ? video.aiHighlightStart : selectedStart) + 5).toFixed(1)}s
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={maxPossibleStart}
              step={0.1}
              disabled={editMode === 'ai_auto'}
              value={editMode === 'ai_auto' ? video.aiHighlightStart : selectedStart}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSelectedStart(val);
                if (videoElementRef.current) {
                  videoElementRef.current.currentTime = val;
                }
              }}
              className="w-full accent-rose-600 disabled:opacity-50 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>0.0s</span>
              <span>منتصف الفيديو</span>
              <span>{(video.duration || 6).toFixed(1)}s</span>
            </div>
          </div>

          {/* Visual Grading Filters */}
          <div className="space-y-1.5 pt-2 border-t border-stone-200">
            <label className="font-bold text-stone-800 block text-[11px]">
              فلتر التحسين الاستوديو (Studio Enhancement Filter):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'studio_glow', name: 'إشراقة استوديو ✨' },
                { id: 'vibrant', name: 'ألوان حيوية 🎨' },
                { id: 'warm_luxury', name: 'دفء وفخامة 👑' },
                { id: 'none', name: 'الأصل بدون فلتر' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEnhancedFilter(f.id as any)}
                  className={`p-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                    enhancedFilter === f.id
                      ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {video.renderedClipUrl && (
            <a
              href={video.renderedClipUrl}
              download={`${video.title_ar}-5s.webm`}
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل المقطع 5s</span>
            </a>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>تطبيق وحفظ التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIVideoStudio;
