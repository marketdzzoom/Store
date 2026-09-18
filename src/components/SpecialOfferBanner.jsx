import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ShoppingBag, 
  Eye, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  ZoomIn
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { TRANSLATIONS } from '../data/translations';
import { getColorStyle, getImageIndexForColor, getColorForImageIndex } from '../utils/colors';
import ProductDescription from './ProductDescription';

export default function SpecialOfferBanner({ offer, products = [], onQuickView, onBuyNow, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 22 });

  const matchedProduct = (products && products.length > 0)
    ? (products.find((p) => p.id === 'prod-ugg' || p.title?.toLowerCase().includes('ugg')) || products.find((p) => p.id === offer?.productId || p.title === offer?.title))
    : null;

  const offerColors = (offer?.colors && offer.colors.length > 0)
    ? offer.colors
    : (matchedProduct?.colors || ["Beige", "Marron", "Noir"]);

  const offerSizes = (offer?.sizes && offer.sizes.length > 0)
    ? offer.sizes
    : (matchedProduct?.sizes || ["37", "38", "39", "40"]);

  const [selectedColor, setSelectedColor] = useState(() => (offerColors.length > 0 ? offerColors[0] : 'Beige'));
  const [selectedSize, setSelectedSize] = useState(() => (offerSizes.length > 0 ? offerSizes[0] : '38'));

  useEffect(() => {
    if (offerColors.length > 0 && (!selectedColor || !offerColors.includes(selectedColor))) {
      setSelectedColor(offerColors[0]);
    }
  }, [offerColors]);

  useEffect(() => {
    if (offerSizes.length > 0 && (!selectedSize || !offerSizes.includes(selectedSize))) {
      setSelectedSize(offerSizes[0]);
    }
  }, [offerSizes]);

  if (!offer || !offer.enabled) return null;

  const images = (offer.images && offer.images.length > 0)
    ? offer.images
    : [offer.image || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"];

  // Countdown timer ticking effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-play slideshow every 4 seconds only if multiple images
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => {
        const next = (prev + 1) % images.length;
        const matchedCol = getColorForImageIndex(next, matchedProduct || offer);
        if (matchedCol) setSelectedColor(matchedCol);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const discountPercent = offer.oldPrice 
    ? Math.round(((offer.oldPrice - offer.price) / offer.oldPrice) * 100)
    : null;

  const titleText = (lang === 'ar' && offer.titleAr) ? offer.titleAr : offer.title;
  const descText = (lang === 'ar' && offer.descriptionAr) ? offer.descriptionAr : offer.description;

  const handleSelectColor = (col) => {
    setSelectedColor(col);
    const matchedIdx = getImageIndexForColor(col, matchedProduct || offer, images);
    if (matchedIdx >= 0 && matchedIdx < images.length) {
      setActiveImageIndex(matchedIdx);
    }
  };

  const handleThumbnailClick = (idx) => {
    setActiveImageIndex(idx);
    const matchedCol = getColorForImageIndex(idx, matchedProduct || offer);
    if (matchedCol) {
      setSelectedColor(matchedCol);
    }
  };

  const handleNextImg = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => {
      const next = (prev + 1) % images.length;
      const matchedCol = getColorForImageIndex(next, matchedProduct || offer);
      if (matchedCol) setSelectedColor(matchedCol);
      return next;
    });
  };

  const handlePrevImg = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => {
      const next = (prev - 1 + images.length) % images.length;
      const matchedCol = getColorForImageIndex(next, matchedProduct || offer);
      if (matchedCol) setSelectedColor(matchedCol);
      return next;
    });
  };

  const offerProductObj = {
    id: offer.productId || matchedProduct?.id || 'prod-ugg',
    title: offer.title,
    titleAr: offer.titleAr,
    price: offer.price,
    oldPrice: offer.oldPrice,
    category: offer.category || 'Mode & Habillement',
    description: offer.description,
    descriptionAr: offer.descriptionAr,
    image: images[activeImageIndex] || images[0],
    images: images,
    colors: offerColors,
    sizes: offerSizes,
    selectedColor: selectedColor,
    selectedSize: selectedSize,
    inStock: true,
    badge: offer.tagline || 'Offre Spéciale'
  };

  const handleOpenUgg = (overrideColor = null, overrideSize = null) => {
    const target = matchedProduct || (products && products.find((p) => p.id === 'prod-ugg' || p.title?.toLowerCase().includes('ugg'))) || offerProductObj;
    const finalProd = {
      ...target,
      id: target.id || 'prod-ugg',
      selectedColor: overrideColor || selectedColor || target.selectedColor || (offerColors[0] || 'Beige'),
      selectedSize: overrideSize || selectedSize || target.selectedSize || (offerSizes[0] || '38')
    };
    onQuickView(finalProd);
  };

  return (
    <section className="dark relative overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy text-white py-10 md:py-14 px-4 sm:px-6 lg:px-8 border-b-4 border-brand-orange shadow-2xl">
      {/* Background Animated Glow Effects */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-orange/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Info & Timer (7 cols) */}
        <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
          
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-orange text-white font-black text-xs uppercase tracking-wider shadow-lg animate-bounce">
              <Zap className="w-4 h-4 fill-white" />
              {offer.tagline || "Vente Flash ⚡"}
            </span>

            {offer.seasonBadge && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>{offer.seasonBadge}</span>
              </span>
            )}
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-snug">
            {titleText}
          </h2>

          <div className="max-w-xl mx-auto lg:mx-0">
            <ProductDescription 
              description={descText} 
              lang={lang} 
              theme="dark"
              showPhoneCTA={false} 
              showTrustCards={false} 
            />
          </div>

          {/* Real Color Swatches Selection if product has colors */}
          {offerColors.length > 0 && (
            <div className="flex items-center justify-center lg:justify-start gap-2.5 pt-1 flex-wrap">
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <span>🎨</span>
                <span>{lang === 'ar' ? 'الألوان المتوفرة :' : 'Couleurs disponibles :'}</span>
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {offerColors.map((col) => {
                  const cStyle = getColorStyle(col);
                  const isSelected = selectedColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleSelectColor(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border backdrop-blur-sm ${
                        isSelected
                          ? 'bg-white/25 text-white border-brand-orange shadow-lg shadow-brand-orange/30 scale-105 ring-2 ring-brand-orange/40'
                          : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10 hover:border-white/30'
                      }`}
                      title={`Afficher la photo en ${col}`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full inline-block flex-shrink-0 ${
                          cStyle.isLight ? 'border border-slate-300' : ''
                        }`}
                        style={{ background: cStyle.background }}
                      />
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real Sizes / Pointures Selection */}
          {offerSizes.length > 0 && (
            <div className="flex items-center justify-center lg:justify-start gap-2.5 pt-1 flex-wrap">
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <span>👟</span>
                <span>{lang === 'ar' ? 'المقاسات المتوفرة :' : 'Pointures disponibles :'}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {offerSizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sz);
                        handleOpenUgg(null, sz);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 border backdrop-blur-sm ${
                        isSelected
                          ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/30 scale-105 ring-2 ring-brand-orange/40'
                          : 'bg-white/10 text-slate-200 border-white/20 hover:bg-white/20 hover:border-white/30'
                      }`}
                      title={`Sélectionner pointure ${sz}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price & Discount Display */}
          <div className="flex items-center justify-center lg:justify-start gap-4 pt-1">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-baseline gap-3 shadow-lg">
              <span className="text-xs text-slate-300 font-semibold">{t.price}:</span>
              <span className="text-2xl sm:text-3xl font-black text-brand-orange">
                {formatPrice(offer.price)}
              </span>
              {offer.oldPrice && (
                <span className="text-sm text-slate-400 line-through font-semibold">
                  {formatPrice(offer.oldPrice)}
                </span>
              )}
            </div>

            {discountPercent && (
              <span className="bg-red-600 text-white text-xs font-black px-3 py-2 rounded-2xl shadow-md">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Dynamic Countdown Timer */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center lg:justify-start gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-orange" />
              <span>{lang === 'ar' ? 'ينتهي العرض الخاص خلال:' : 'L\'offre spéciale se termine dans:'}</span>
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-2 text-center">
              <div className="bg-brand-navy border border-slate-700 px-3 py-2 rounded-xl shadow-md min-w-[54px]">
                <span className="text-lg sm:text-2xl font-black text-white block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'ساعة' : 'Heures'}</span>
              </div>
              <span className="text-xl font-bold text-brand-orange">:</span>

              <div className="bg-brand-navy border border-slate-700 px-3 py-2 rounded-xl shadow-md min-w-[54px]">
                <span className="text-lg sm:text-2xl font-black text-white block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'دقيقة' : 'Min'}</span>
              </div>
              <span className="text-xl font-bold text-brand-orange">:</span>

              <div className="bg-brand-navy border border-slate-700 px-3 py-2 rounded-xl shadow-md min-w-[54px]">
                <span className="text-lg sm:text-2xl font-black text-white block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'ar' ? 'ثانية' : 'Sec'}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-4">
            <button
              type="button"
              onClick={() => handleOpenUgg()}
              className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-xl hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{lang === 'ar' ? 'اطلب الآن - حذاء UGG ⚡' : 'Commander Chaussures UGG ⚡'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenUgg()}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3.5 px-5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-brand-orange" />
              <span>{lang === 'ar' ? 'معاينة الـ 8 صور والخصائص 👁️' : 'Voir les 8 Photos HD & Détails 👁️'}</span>
            </button>
          </div>
        </div>

        {/* Right Multi-Photo Interactive Gallery (5 cols) */}
        <div className="lg:col-span-5 relative">
          <div 
            onClick={() => handleOpenUgg()}
            className="relative mx-auto max-w-md bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/20 shadow-2xl group cursor-pointer"
          >
            {/* Main Carousel Active Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900/60 mb-3 border border-white/10">
              <img
                src={images[activeImageIndex]}
                alt={titleText}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              />

              {/* Photo Counter Pill Badge */}
              <div className="absolute top-3 left-3 bg-brand-navy/80 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow">
                <span>📸</span>
                <span>{activeImageIndex + 1} / {images.length}</span>
              </div>

              {/* Zoom HD Prompt Badge */}
              <div className="absolute top-3 right-3 bg-brand-navy/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow">
                <ZoomIn className="w-3.5 h-3.5 text-brand-orange" />
                <span>Zoom HD</span>
              </div>

              {/* Prev / Next Arrows if multi-images */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImg}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-brand-navy/80 hover:bg-brand-orange text-white p-2 rounded-full backdrop-blur-md transition-colors shadow z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-navy/80 hover:bg-brand-orange text-white p-2 rounded-full backdrop-blur-md transition-colors shadow z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Image Count Badge */}
              <span className="absolute bottom-2 right-2 bg-brand-navy/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                {activeImageIndex + 1} / {images.length} {t.photosCount}
              </span>
            </div>

            {/* Thumbnail Navigation Selector */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                {images.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThumbnailClick(idx);
                    }}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-brand-orange shadow-lg scale-105'
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Offre Vue ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
