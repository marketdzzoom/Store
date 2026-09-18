import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Star, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckCheck,
  Zap,
  PhoneCall,
  Phone,
  MessageSquare
} from 'lucide-react';
import { formatPrice, getProductMarketingLink, formatDZPhoneDisplay } from '../utils/formatters';
import { TRANSLATIONS, CATEGORY_MAP_AR } from '../data/translations';
import { getColorStyle, getImageIndexForColor, getColorForImageIndex } from '../utils/colors';
import ProductDescription from './ProductDescription';

export default function ProductModal({ product, onClose, onAddToCart, onBuyNow, storePhone, lang = 'fr' }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Product Specificities / Variants State (Sizes & Colors)
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [variantError, setVariantError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const activePhone = (storePhone && storePhone !== '0550000000' && storePhone !== '0550 00 00 00') ? storePhone : '+213663085069';
  const phoneDisplay = activePhone.includes('663') ? '0663 08 50 69' : formatDZPhoneDisplay(activePhone);
  const sizeSelectorRef = useRef(null);

  const handleCopyProductLink = (e) => {
    e?.stopPropagation?.();
    if (!product) return;
    const link = getProductMarketingLink(product);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {});
    }
  };

  // HD Interactive Zoom States
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isHoveringZoom, setIsHoveringZoom] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [imgError, setImgError] = useState(false);

  const imageRef = useRef(null);
  const touchStartXRef = useRef(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const fallbackImg = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";

  // Safe image list resolution even if product is null
  const imageList = product
    ? ((product.images && product.images.length > 0) ? product.images : [product.image || fallbackImg])
    : [];

  const handlePrevImage = (e) => {
    e?.stopPropagation?.();
    setZoomLevel(1);
    setImgError(false);
    if (imageList.length > 0) {
      setSelectedImageIndex((prev) => {
        const next = (prev === 0 ? imageList.length - 1 : prev - 1);
        const col = getColorForImageIndex(next, product);
        if (col) setSelectedColor(col);
        return next;
      });
    }
  };

  const handleNextImage = (e) => {
    e?.stopPropagation?.();
    setZoomLevel(1);
    setImgError(false);
    if (imageList.length > 0) {
      setSelectedImageIndex((prev) => {
        const next = (prev === imageList.length - 1 ? 0 : prev + 1);
        const col = getColorForImageIndex(next, product);
        if (col) setSelectedColor(col);
        return next;
      });
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    if (e.changedTouches && e.changedTouches[0]) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartXRef.current - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          handleNextImage();
        } else {
          handlePrevImage();
        }
      }
    }
    touchStartXRef.current = null;
  };

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setZoomLevel(1);
    setIsZoomModalOpen(false);
    setImgError(false);
    setSelectedSize(product?.selectedSize || (product?.sizes && product.sizes.length > 0 ? product.sizes[0] : ''));
    setSelectedColor(product?.selectedColor || (product?.colors && product.colors.length > 0 ? product.colors[0] : ''));
    setVariantError('');
  }, [product]);

  // Keyboard navigation when zoom modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isZoomModalOpen) return;
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        setIsZoomModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomModalOpen, imageList.length]);

  if (!product) return null;

  const isOutOfStock = product.inStock === false || product.stockQuantity === 0 || product.badge === 'Rupture de Stock' || product.badge === 'نفذت الكمية';

  const currentImage = imageList[selectedImageIndex] || imageList[0] || fallbackImg;

  const titleText = (lang === 'ar' && product.titleAr) ? product.titleAr : product.title;
  const descText = (lang === 'ar' && product.descriptionAr) ? product.descriptionAr : product.description;
  const categoryLabel = (lang === 'ar' && CATEGORY_MAP_AR[product.category]) ? CATEGORY_MAP_AR[product.category] : product.category;

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setVariantError(t.variantsPrompt || (lang === 'ar' ? 'يرجى اختيار المقاس (37، 38، 39 أو 40)' : 'Veuillez sélectionner votre pointure (37, 38, 39 ou 40).'));
      if (sizeSelectorRef.current) {
        sizeSelectorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setVariantError(t.variantsPrompt || (lang === 'ar' ? 'يرجى اختيار اللون' : 'Veuillez sélectionner une couleur.'));
      return;
    }
    onAddToCart(product, quantity, { selectedSize, selectedColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuy = () => {
    if (isOutOfStock) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setVariantError(t.variantsPrompt || (lang === 'ar' ? 'يرجى اختيار المقاس (37، 38، 39 أو 40)' : 'Veuillez sélectionner votre pointure (37, 38, 39 ou 40).'));
      if (sizeSelectorRef.current) {
        sizeSelectorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setVariantError(t.variantsPrompt || (lang === 'ar' ? 'يرجى اختيار اللون' : 'Veuillez sélectionner une couleur.'));
      return;
    }
    onBuyNow(product, quantity, { selectedSize, selectedColor });
  };

  return (
    <>
      {/* Main Product Quick View Modal / Full Mobile Landing Page */}
      <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 sm:backdrop-blur-sm animate-fadeIn overflow-hidden">
        <div 
          className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 relative flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Mobile & Desktop Navigation Bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 md:absolute md:top-3.5 md:right-3.5 md:p-0 md:bg-transparent md:border-0 md:justify-end">
            {/* Mobile Left: Back / Close button */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                type="button"
                onClick={onClose}
                className="p-1 -ml-1 text-slate-700 dark:text-slate-200 hover:text-brand-orange flex items-center gap-1 font-extrabold text-xs active:scale-95"
                aria-label="Fermer et retourner à la boutique"
              >
                <ChevronLeft className="w-5 h-5 text-brand-orange" />
                <span>{lang === 'ar' ? 'المتجر' : 'Boutique'}</span>
              </button>
            </div>

            {/* Right Actions: Phone Call, Share / Ad link, Close */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <a
                href={`tel:${activePhone.replace(/[\s\.-]/g, '')}`}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 flex items-center gap-1.5 active:scale-95 shadow-xs"
                title="Appeler le service client"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-extrabold">{phoneDisplay}</span>
              </a>

              <button
                type="button"
                onClick={handleCopyProductLink}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md backdrop-blur-md border ${
                  copiedLink
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                    : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-brand-orange dark:hover:text-brand-orange border-slate-200/80 dark:border-slate-700'
                }`}
                title="Copier le lien direct de cette page pour vos publicités ou WhatsApp"
              >
                {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5 text-brand-orange" />}
                <span className="text-[11px] sm:text-xs">{copiedLink ? (lang === 'ar' ? 'تم النسخ!' : 'Lien copié !') : (lang === 'ar' ? 'مشاركة' : 'Lien Pub')}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-white/90 dark:bg-slate-800/90 text-slate-500 hover:text-slate-900 dark:hover:text-white p-1.5 sm:p-2 rounded-full transition-colors shadow-md backdrop-blur-md border border-slate-200/80 dark:border-slate-700 active:scale-95"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Left Image Section & Interactive Zoom Container (Fixed & balanced, zero empty void) */}
          <div className="md:w-1/2 bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 md:p-6 flex flex-col justify-between relative md:h-full shrink-0 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 select-none overflow-hidden">
            {isOutOfStock ? (
              <span className="absolute top-4 left-4 z-10 bg-red-700 text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shadow flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t.outOfStock}
              </span>
            ) : (
              product.badge && (
                <span className="absolute top-4 left-4 z-10 bg-brand-orange text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shadow">
                  {product.badge}
                </span>
              )
            )}

            {/* Main Interactive Zoomable Image Box */}
            <div 
              ref={imageRef}
              onMouseEnter={() => setIsHoveringZoom(true)}
              onMouseLeave={() => setIsHoveringZoom(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setIsZoomModalOpen(true)}
              className="flex-1 flex items-center justify-center py-2 relative cursor-zoom-in overflow-hidden rounded-2xl group min-h-[240px] sm:min-h-[280px] md:min-h-0"
            >
              {/* Photo Counter Pill Badge */}
              {imageList.length > 1 && (
                <div className="absolute top-3 left-3 z-20 bg-brand-navy/85 text-white text-[11px] font-mono font-black px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-md">
                  <span>📸</span>
                  <span>{selectedImageIndex + 1} / {imageList.length}</span>
                </div>
              )}

              {/* Active Color Pill Badge on Image */}
              {(() => {
                const activeCol = getColorForImageIndex(selectedImageIndex, product);
                if (!activeCol) return null;
                const cStyle = getColorStyle(activeCol);
                return (
                  <div className="absolute top-3 right-3 z-20 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow border border-slate-200 dark:border-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cStyle.background }} />
                    <span>{activeCol}</span>
                  </div>
                );
              })()}

              <img
                src={imgError ? fallbackImg : currentImage}
                alt={titleText}
                onError={() => setImgError(true)}
                className={`max-h-64 sm:max-h-72 md:max-h-80 w-full object-contain rounded-2xl transition-transform duration-300 ${
                  isHoveringZoom ? 'scale-125' : 'scale-100'
                } ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
                style={
                  isHoveringZoom
                    ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                    : { transformOrigin: 'center center' }
                }
              />

              {/* Prev / Next photo navigation arrows on modal preview */}
              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage(e);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-2 rounded-full bg-white/95 dark:bg-slate-900/95 hover:bg-brand-orange hover:text-white text-slate-800 dark:text-white shadow-lg transition-all active:scale-90 opacity-95 sm:opacity-0 group-hover:opacity-100 border border-slate-200 dark:border-slate-700"
                    title="Photo précédente"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage(e);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-2 rounded-full bg-white/95 dark:bg-slate-900/95 hover:bg-brand-orange hover:text-white text-slate-800 dark:text-white shadow-lg transition-all active:scale-90 opacity-95 sm:opacity-0 group-hover:opacity-100 border border-slate-200 dark:border-slate-700"
                    title="Photo suivante"
                    aria-label="Photo suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Hover Zoom Prompt Badge */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-brand-navy/80 text-white text-[10px] font-bold px-3 py-0.5 rounded-full backdrop-blur-md opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-md pointer-events-none">
                <ZoomIn className="w-3 h-3 text-brand-orange" />
                <span>{t.zoomHint}</span>
              </div>
            </div>

            {/* Multiple Image Gallery Thumbnails */}
            {imageList.length > 1 && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      const matchedColor = getColorForImageIndex(idx, product);
                      if (matchedColor) {
                        setSelectedColor(matchedColor);
                        setVariantError('');
                      }
                    }}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-brand-orange shadow-md scale-105'
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Info Section with independent scroll on desktop & unified single-scroll on mobile */}
          <div className="md:w-1/2 flex flex-col md:h-full md:overflow-hidden relative bg-white dark:bg-slate-900">
            {/* Details pane: smooth single-scroll on mobile with pb-28 to clear fixed bottom bar */}
            <div className="flex-1 md:overflow-y-auto p-4 sm:p-6 md:p-7 space-y-4 pb-28 md:pb-4">
              {/* Category & Rating */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                  {categoryLabel}
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating || '4.9'}</span>
                  <span className="text-slate-400">({product.reviewsCount || 48} avis)</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                {titleText}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-brand-orange">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="text-base text-slate-400 line-through font-semibold">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                {product.oldPrice && (
                  <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                    -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Product Specificities & Variants: Sizes & Colors */}
              {!isOutOfStock && (product.sizes?.length > 0 || product.colors?.length > 0) && (
                <div className="space-y-3 pt-1">
                  {/* Sizes / Pointures Selection */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div 
                      ref={sizeSelectorRef}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        variantError && !selectedSize
                          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-400/50'
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>👟</span>
                          <span>{t.selectSize || (lang === 'ar' ? 'المقاس / الحجم :' : 'Pointure / Taille :')}</span>
                        </span>
                        {selectedSize && (
                          <span className="text-xs font-black text-brand-orange bg-brand-orange/10 dark:bg-brand-orange/20 px-2.5 py-0.5 rounded-lg border border-brand-orange/30">
                            Pointure {selectedSize}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.sizes.map((sz) => {
                          const isSelected = selectedSize === sz;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => {
                                setSelectedSize(sz);
                                setVariantError('');
                              }}
                              className={`min-w-[50px] py-2 px-3.5 rounded-xl text-xs sm:text-sm font-black border transition-all duration-150 active:scale-95 ${
                                isSelected
                                  ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/30 scale-105 ring-2 ring-brand-orange/30'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-orange/60 hover:bg-slate-50 dark:hover:bg-slate-750'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Colors Selection */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>🎨</span>
                          <span>{t.selectColor || (lang === 'ar' ? 'اللون :' : 'Couleur :')}</span>
                        </span>
                        {selectedColor && (() => {
                          const selStyle = getColorStyle(selectedColor);
                          return (
                            <span className="text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 shadow-2xs">
                              <span
                                className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${
                                  selStyle.isLight ? 'border border-slate-400' : ''
                                }`}
                                style={{ background: selStyle.background }}
                              />
                              <span>{selectedColor}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.colors.map((col) => {
                          const isSelected = selectedColor === col;
                          const cStyle = getColorStyle(col);
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => {
                                setSelectedColor(col);
                                setVariantError('');
                                const matchedIdx = getImageIndexForColor(col, product, imageList);
                                if (matchedIdx >= 0 && matchedIdx < imageList.length) {
                                  setSelectedImageIndex(matchedIdx);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95 flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-900 dark:bg-brand-orange text-white border-slate-900 dark:border-brand-orange shadow-md scale-105 ring-2 ring-brand-orange/40'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-orange/60 hover:bg-slate-50 dark:hover:bg-slate-750'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full inline-block flex-shrink-0 transition-transform ${
                                  isSelected ? 'scale-110 ring-1 ring-white/80' : ''
                                } ${cStyle.isLight ? 'border border-slate-350 dark:border-slate-500' : ''}`}
                                style={{ background: cStyle.background }}
                              />
                              <span>{col}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {variantError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{variantError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Algerian Fast COD Assurances & Stock Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 flex-wrap text-xs">
                {isOutOfStock ? (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.outOfStock}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.inStock} ({product.stockQuantity ?? 100})</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Truck className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span>{lang === 'ar' ? 'توصيل 69 ولاية' : 'Livraison 69 Wilayas'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-navy dark:text-sky-400 shrink-0" />
                  <span>{lang === 'ar' ? 'دفع عند الاستلام' : 'Paiement à la livraison'}</span>
                </div>
              </div>

              {/* Structured & Impactful Description */}
              <div>
                <ProductDescription 
                  description={descText} 
                  lang={lang} 
                  showPhoneCTA={true} 
                  showTrustCards={false} 
                />
              </div>

              {/* Direct Customer Service & WhatsApp Order Assistance Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-slate-800 dark:to-slate-850 rounded-2xl border border-amber-300/60 dark:border-amber-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-brand-orange" />
                    <span>{lang === 'ar' ? 'طلب فوري أو استفسار عبر الهاتف / واتساب :' : 'Commande express par téléphone ou WhatsApp :'}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${activePhone.replace(/[\s\.-]/g, '')}`}
                    className="py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white hover:border-brand-orange flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-orange" />
                    <span className="truncate">{phoneDisplay}</span>
                  </a>
                  <a
                    href={`https://wa.me/${activePhone.replace(/[\s\+\.-]/g, '')}?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${titleText} (Prix: ${formatPrice(product.price)})`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Quantity Selector on Desktop */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4 py-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.quantity}</span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Sticky Action CTAs Footer */}
            <div className="hidden md:flex p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] flex-col gap-2 shrink-0">
              <div className="flex gap-2.5">
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-brand-orange shrink-0" />
                  <span>{isOutOfStock ? t.indisponible : added ? t.added : t.addToCart}</span>
                </button>

                <button
                  onClick={handleBuy}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-white ${
                    isOutOfStock
                      ? 'bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange-hover hover:to-amber-600 shadow-brand-orange/30 hover:shadow-glow ring-2 ring-brand-orange/20'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current text-white shrink-0 animate-pulse" />
                  <span>{t.buyNow || 'Acheter maintenant'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center">
                <span>{lang === 'ar' ? '🇩🇿 الدفع عند الاستلام (69 ولاية) • عاين سلعتك براحتك قبل الدفع' : '🇩🇿 Paiement à la livraison (69 Wilayas) • Vérifiez votre colis avant de payer'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Floating Bottom CTA Bar */}
        <div 
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex items-center justify-between gap-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-black text-brand-orange leading-none">
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate mt-0.5">
              {lang === 'ar' ? '🇩🇿 دفع عند الاستلام' : '🇩🇿 Paiement à réception'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95"
              title={t.addToCart}
            >
              <ShoppingBag className="w-5 h-5 text-brand-orange" />
            </button>

            <button
              type="button"
              onClick={handleBuy}
              disabled={isOutOfStock}
              className="flex-1 max-w-[210px] py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-xl text-white bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange-hover hover:to-amber-600 shadow-brand-orange/30 active:scale-95 flex items-center justify-center gap-2 ring-2 ring-brand-orange/20"
            >
              <Zap className="w-4 h-4 fill-white shrink-0 animate-pulse" />
              <span>{lang === 'ar' ? 'شراء الآن ⚡' : 'Acheter direct ⚡'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen HD Zoom Modal */}
      {isZoomModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 animate-fadeIn select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Controls Bar */}
          <div className="flex items-center justify-between text-white z-30 px-3 sm:px-5 py-2.5 bg-slate-900/70 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h3 className="font-extrabold text-xs sm:text-sm truncate max-w-[160px] sm:max-w-md">{titleText}</h3>
              {imageList.length > 1 && (
                <span className="text-[10px] sm:text-xs font-mono font-bold bg-white/10 text-brand-orange px-2.5 py-1 rounded-lg border border-white/10 flex-shrink-0 shadow-sm">
                  {selectedImageIndex + 1} / {imageList.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                className="p-2 bg-slate-800/80 hover:bg-brand-orange rounded-xl transition-colors active:scale-95"
                title="Zoom Avant (+)"
              >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                className="p-2 bg-slate-800/80 hover:bg-brand-orange rounded-xl transition-colors active:scale-95"
                title="Zoom Arrière (-)"
              >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-2 bg-slate-800/80 hover:bg-brand-orange rounded-xl transition-colors active:scale-95"
                title="Réinitialiser le zoom"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-2 bg-slate-800/80 hover:bg-red-600 rounded-xl transition-colors ml-1 sm:ml-2 active:scale-95"
                title="Fermer (Échap)"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Image Container with Floating Navigation Arrows */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-2 sm:p-4 relative my-2">
            
            {/* Previous Photo Arrow */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-4 rounded-full bg-slate-900/85 hover:bg-brand-orange text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-200 active:scale-90 hover:scale-110 flex items-center justify-center group"
                title="Photo précédente (Flèche gauche ou glisser)"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="w-5 h-5 sm:w-8 sm:h-8 transition-transform group-hover:-translate-x-1" />
              </button>
            )}

            {/* Main Zoomed Image */}
            <img
              src={imgError ? fallbackImg : currentImage}
              alt={titleText}
              onError={() => setImgError(true)}
              className="max-h-[78vh] sm:max-h-[84vh] max-w-[88vw] object-contain transition-transform duration-200 cursor-grab active:cursor-grabbing shadow-2xl rounded-2xl select-none"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {/* Next Photo Arrow */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-4 rounded-full bg-slate-900/85 hover:bg-brand-orange text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-200 active:scale-90 hover:scale-110 flex items-center justify-center group"
                title="Photo suivante (Flèche droite ou glisser)"
                aria-label="Photo suivante"
              >
                <ChevronRight className="w-5 h-5 sm:w-8 sm:h-8 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Navigation */}
          {imageList.length > 1 && (
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 py-2 z-20 overflow-x-auto max-w-full px-2 no-scrollbar">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setSelectedImageIndex(idx);
                  }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx 
                      ? 'border-brand-orange scale-110 shadow-lg shadow-brand-orange/30' 
                      : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                  }`}
                >
                  <img src={img} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
