import React, { useState, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  Filter,
  ArrowUpDown,
  Search,
  MessageSquare,
  Sparkles,
  ChevronDown,
  User,
  Heart,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { ProductReview } from '../types';
import { StarRating } from './StarRating';

interface ProductReviewsSectionProps {
  productId: string;
  productTitle: string;
  reviews: ProductReview[];
  onAddReview: (review: ProductReview) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productTitle,
  reviews,
  onAddReview,
}) => {
  // State for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // State for filtering & sorting
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Helpful votes state (local tracking for UX delight)
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [userVoted, setUserVoted] = useState<Record<string, boolean>>({});

  // Calculations: Average rating & breakdown
  const totalCount = reviews.length;
  const averageRating = useMemo(() => {
    if (totalCount === 0) return 0;
    const sum = reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0);
    return Number((sum / totalCount).toFixed(1));
  }, [reviews, totalCount]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      if (counts[rounded] !== undefined) {
        counts[rounded]++;
      }
    });
    return counts;
  }, [reviews]);

  const recommendPercentage = useMemo(() => {
    if (totalCount === 0) return 100;
    const positive = reviews.filter((r) => r.rating >= 4).length;
    return Math.round((positive / totalCount) * 100);
  }, [reviews, totalCount]);

  // Handle new review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!author.trim()) {
      setFormError('يرجى إدخال اسمك الكريم.');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setFormError('يرجى اختيار التقييم بالنجوم من 1 إلى 5.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setFormError('يرجى كتابة تفاصيل تقييمك وتجربتك (على الأقل 5 أحرف).');
      return;
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      author: author.trim(),
      rating,
      date: 'اليوم',
      title: title.trim() || undefined,
      comment: comment.trim(),
      verifiedPurchase: true,
      wouldRecommend,
      helpfulCount: 0,
    };

    onAddReview(newReview);

    // Reset form state
    setAuthor('');
    setTitle('');
    setComment('');
    setRating(5);
    setWouldRecommend(true);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setIsFormOpen(false);
    }, 1800);
  };

  // Toggle helpful vote
  const handleToggleHelpful = (reviewId: string, initialCount = 0) => {
    if (userVoted[reviewId]) return;

    setUserVoted((prev) => ({ ...prev, [reviewId]: true }));
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] ?? initialCount) + 1,
    }));
  };

  // Filtered & sorted reviews list
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        const matchesStar = starFilter === 'all' || Math.round(r.rating) === starFilter;
        const matchesSearch =
          !searchKeyword.trim() ||
          r.author.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          r.comment.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (r.title && r.title.toLowerCase().includes(searchKeyword.toLowerCase()));
        return matchesStar && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return b.rating - a.rating;
        if (sortBy === 'lowest') return a.rating - b.rating;
        // Default newest
        return 0;
      });
  }, [reviews, starFilter, searchKeyword, sortBy]);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-sm mb-16" id="reviews-section">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              تقييمات وتجارب العميلات
            </h2>
            <span className="bg-rose-50 text-rose-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-100">
              {totalCount} {totalCount === 1 ? 'تقييم' : 'تقييماً'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            آراء موثوقة وتجارب واقعية من عميلات جربن هذا المنتج في روتينهن اليومي
          </p>
        </div>

        <button
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setFormError('');
          }}
          className="bg-stone-900 hover:bg-rose-900 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0 cursor-pointer active:scale-98"
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>إغلاق النموذج</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-rose-400" />
              <span>أضيفي تقييمك ورأيك</span>
            </>
          )}
        </button>
      </div>

      {/* Write Review Form Card */}
      {isFormOpen && (
        <div className="mt-8 bg-gradient-to-br from-stone-50 via-rose-50/20 to-amber-50/20 p-6 sm:p-8 rounded-3xl border border-rose-200/80 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-stone-900 text-sm sm:text-base">
                  كتابة تقييم وتجربة جديدة
                </h3>
                <p className="text-[11px] text-stone-500">
                  لرأيك أهمية بالغة في مساعدة باقي العميلات في اختيار المنتج الأنسب
                </p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              نشر فوري ومباشر
            </span>
          </div>

          {formSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-sm">شكراً لكِ! تم تسجيل تقييمك بنجاح.</h4>
              <p className="text-xs text-emerald-700">
                تم تحديث متوسط تقييم المنتج فورياً وإضافة رأيك إلى القائمة.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-5">
              {formError && (
                <div className="p-3.5 bg-rose-100/80 border border-rose-300 text-rose-900 rounded-2xl text-xs flex items-center gap-2 font-bold animate-in shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Star Rating Selection */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  اختر تقييمك الإجمالي (1 - 5 نجوم): <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <StarRating
                    rating={rating}
                    size="xl"
                    interactive={true}
                    onChange={(newVal) => setRating(newVal)}
                    showLabel={true}
                  />
                </div>
              </div>

              {/* Author & Optional Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    الاسم أو اللقب: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="مثال: سارة الشمري"
                    className="w-full text-xs sm:text-sm p-3 bg-white border border-stone-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    عنوان التقييم أو خلاصة التجربة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: ترطيب فوري ومظهر نضر وطبيعي"
                    className="w-full text-xs sm:text-sm p-3 bg-white border border-stone-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* Comment Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  تفاصيل تجربتك مع المنتج: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="كيف كان ملمس المستحضر؟ ما هي التغييرات التي لاحظتيها على بشرتك أو شعرك؟ هل أعجبتك الرائحة وسرعة الامتصاص؟"
                  className="w-full text-xs sm:text-sm p-3.5 bg-white border border-stone-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>

              {/* Recommendation Checkbox */}
              <div className="flex items-center gap-2.5 bg-white/70 p-3 rounded-2xl border border-stone-200/80">
                <input
                  type="checkbox"
                  id="recommend-check"
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  className="w-4 h-4 rounded-md text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="recommend-check" className="text-xs font-bold text-stone-800 cursor-pointer">
                  نعم، أوصي باقتناء هذا المنتج لصديقاتي وعميلات المتجر 👍
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold px-7 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98"
                >
                  نشر التقييم فورياً
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Average Rating & Breakdown Showcase (Amazon Tier) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-stone-50/80 rounded-3xl p-6 sm:p-8 border border-stone-200/80">
        
        {/* Left Column: Big Average Score (4 cols) */}
        <div className="lg:col-span-4 text-center lg:text-right border-b lg:border-b-0 lg:border-l border-stone-200 pb-6 lg:pb-0 lg:pl-8">
          <div className="flex items-baseline justify-center lg:justify-start gap-2">
            <span className="text-5xl sm:text-6xl font-black text-stone-900 tracking-tight font-sans">
              {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
            </span>
            <span className="text-sm sm:text-base font-bold text-stone-400">من 5 نجوم</span>
          </div>

          <div className="my-2.5 flex justify-center lg:justify-start">
            <StarRating rating={averageRating > 0 ? averageRating : 5} size="lg" />
          </div>

          <p className="text-xs font-bold text-stone-700 mt-1">
            بناءً على {totalCount} {totalCount === 1 ? 'تقييم موثق' : 'تقييماً موثقاً'}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-100/60 font-black px-3 py-1.5 rounded-full border border-rose-200/60">
            <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
            <span>{recommendPercentage}% من العميلات ينصحن بهذا المنتج</span>
          </div>
        </div>

        {/* Right Column: 5-Star Breakdown Bars (8 cols) */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-2">
            <span>توزيع التقييمات حسب عدد النجوم:</span>
            {starFilter !== 'all' && (
              <button
                onClick={() => setStarFilter('all')}
                className="text-rose-600 hover:text-rose-800 font-black flex items-center gap-1 cursor-pointer"
              >
                <span>عرض كافة التقييمات ({totalCount})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars] || 0;
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const isSelected = starFilter === stars;

            return (
              <button
                key={stars}
                type="button"
                onClick={() => setStarFilter(isSelected ? 'all' : stars)}
                className={`w-full group flex items-center gap-3 text-xs p-1.5 rounded-xl transition-all cursor-pointer ${
                  isSelected ? 'bg-amber-100/80 ring-2 ring-amber-400' : 'hover:bg-stone-200/50'
                }`}
                title={`تصفية حسب ${stars} نجوم (${count})`}
              >
                {/* Star Label */}
                <span className="w-16 text-right font-bold text-stone-700 group-hover:text-amber-700 shrink-0 flex items-center gap-1">
                  <span>{stars} نجوم</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>

                {/* Progress Bar Container */}
                <div className="flex-1 h-3.5 bg-stone-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stars >= 4
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : stars === 3
                        ? 'bg-amber-300'
                        : 'bg-stone-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Percentage & Count */}
                <span className="w-12 text-left font-black text-stone-800 shrink-0 font-sans">
                  {percentage}%
                </span>
                <span className="w-10 text-left text-stone-400 text-[11px] shrink-0 font-sans">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-6 border-t border-stone-100">
        
        {/* Star Rating Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setStarFilter('all')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
              starFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            الكل ({totalCount})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(starFilter === s ? 'all' : s)}
              className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                starFilter === s
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[10px] opacity-80">({ratingCounts[s] || 0})</span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Keyword Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="ابحث في التجارب..."
              className="w-full text-xs pr-8 pl-3 py-2 bg-stone-100 border border-transparent rounded-xl focus:bg-white focus:border-stone-300 focus:outline-hidden transition-all"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-stone-100 border border-transparent rounded-xl px-3 py-2 font-bold text-stone-700 focus:bg-white focus:border-stone-300 focus:outline-hidden cursor-pointer"
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="highest">الأعلى تقييماً (5-1)</option>
            <option value="lowest">الأقل تقييماً (1-5)</option>
          </select>
        </div>
      </div>

      {/* Reviews List Grid */}
      <div className="mt-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200 p-8 space-y-3">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-700 text-sm">لا توجد تقييمات مطابقة لهذا البحث</h4>
            <p className="text-xs text-stone-400">
              يمكنك مسح الفلتر أو تجربة البحث عن كلمة أخرى، أو كوني أول من يكتب تقييماً بهذا التقييم.
            </p>
            <button
              onClick={() => {
                setStarFilter('all');
                setSearchKeyword('');
              }}
              className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl mt-2 cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReviews.map((rev) => {
              const currentHelpful = helpfulVotes[rev.id] ?? (rev.helpfulCount || 0);
              const isVoted = userVoted[rev.id];

              // Initials avatar
              const initials = rev.author
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('');

              return (
                <div
                  key={rev.id}
                  className="p-5 rounded-3xl bg-stone-50/70 hover:bg-stone-50 border border-stone-200/80 hover:border-stone-300 transition-all flex flex-col justify-between shadow-2xs group"
                >
                  <div>
                    {/* Top Row: Stars + Date */}
                    <div className="flex items-center justify-between mb-3">
                      <StarRating rating={rev.rating} size="sm" />
                      <span className="text-[11px] text-stone-400 font-medium">{rev.date}</span>
                    </div>

                    {/* Review Title if present */}
                    {rev.title && (
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm mb-1.5 leading-snug">
                        "{rev.title}"
                      </h4>
                    )}

                    {/* Review Body */}
                    <p className="text-xs text-stone-700 leading-relaxed mb-4 whitespace-pre-line">
                      {rev.comment}
                    </p>
                  </div>

                  {/* Footer Row: Author, Verified Badge, Helpful vote */}
                  <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                        {initials || <User className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="font-bold text-stone-900 block text-xs leading-none">
                          {rev.author}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="text-emerald-700 flex items-center gap-1 font-semibold text-[10px] mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            مشترٍ تم التحقق منه
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Helpful Vote Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(rev.id, rev.helpfulCount || 0)}
                      disabled={isVoted}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        isVoted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-white hover:bg-stone-200/70 text-stone-600 border border-stone-200 shadow-2xs'
                      }`}
                      title="هل كان هذا التقييم مفيداً؟"
                    >
                      <ThumbsUp className={`w-3 h-3 ${isVoted ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                      <span>{isVoted ? 'مفيد' : 'مفيد'}</span>
                      {currentHelpful > 0 && <span className="font-sans">({currentHelpful})</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
