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
  Link
} from 'lucide-react';
import { formatPrice, getProductMarketingLink } from '../utils/formatters';
import { TRANSLATIONS, CATEGORY_MAP_AR } from '../data/translations';
import { getColorStyle, getImageIndexForColor, getColorForImageIndex } from '../utils/colors';
import ProductDescription from './ProductDescription';

export default function ProductModal({ product, onClose, onAddToCart, onBuyNow, lang = 'fr' }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Product Specificities / Variants State (Sizes & Colors)
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [variantError, setVariantError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyProductLink = (e) => {
    e?.stopPropagation?.();
    if (!product) return;
    const link = getProductMarketingLink(product.id);
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
    setSelectedSize(product?.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
    setSelectedColor(product?.colors && product.colors.length > 0 ? product.colors[0] : '');
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
      setVariantError(t.variantsPrompt || 'Veuillez sélectionner une taille.');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setVariantError(t.variantsPrompt || 'Veuillez sélectionner une couleur.');
      return;
    }
    onAddToCart(product, quantity, { selectedSize, selectedColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuy = () => {
    if (isOutOfStock) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setVariantError(t.variantsPrompt || 'Veuillez sélectionner une taille.');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setVariantError(t.variantsPrompt || 'Veuillez sélectionner une couleur.');
      return;
    }
    onBuyNow(product, quantity, { selectedSize, selectedColor });
  };

  return (
    <>
      {/* Main Product Quick View Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-navy/60 backdrop-blur-sm animate-fadeIn">
        <div 
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] md:h-[660px] shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col md:flex-row overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Control Bar (Share Link for Ads / WhatsApp & Close) */}
          <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyProductLink}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md backdrop-blur-md border ${
                copiedLink
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-brand-orange dark:hover:text-brand-orange border-slate-200/80 dark:border-slate-700'
              }`}
              title="Copier le lien direct de cette page pour vos publicités ou WhatsApp"
            >
              {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5 text-brand-orange" />}
              <span className="hidden sm:inline">{copiedLink ? '✓ Lien copié !' : 'Partager / Lien Pub'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-white/90 dark:bg-slate-800/90 text-slate-500 hover:text-slate-900 dark:hover:text-white p-2 rounded-full transition-colors shadow-md backdrop-blur-md border border-slate-200/80 dark:border-slate-700"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Left Image Section & Interactive Zoom Container (Fixed & balanced, zero empty void) */}
          <div className="md:w-1/2 bg-slate-50 dark:bg-slate-850 p-5 sm:p-6 flex flex-col justify-between relative md:h-full shrink-0 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 select-none overflow-hidden">
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
              className="flex-1 flex items-center justify-center py-2 relative cursor-zoom-in overflow-hidden rounded-2xl group min-h-[220px] sm:min-h-[280px] md:min-h-0"
            >
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-brand-orange hover:text-white text-slate-800 dark:text-white shadow-lg transition-all active:scale-90 opacity-90 sm:opacity-0 group-hover:opacity-100 border border-slate-200 dark:border-slate-700"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-brand-orange hover:text-white text-slate-800 dark:text-white shadow-lg transition-all active:scale-90 opacity-90 sm:opacity-0 group-hover:opacity-100 border border-slate-200 dark:border-slate-700"
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

          {/* Right Info Section with independent scroll & sticky bottom CTA bar */}
          <div className="md:w-1/2 flex flex-col h-full overflow-hidden relative bg-white dark:bg-slate-900">
            {/* Scrollable details pane */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
              {/* Category & Rating */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                  {categoryLabel}
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating || '4.8'}</span>
                  <span className="text-slate-400">({product.reviewsCount || 24} avis)</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {titleText}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-brand-navy dark:text-white">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="text-base text-slate-400 line-through font-semibold">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>

              {/* Structured & Impactful Description (without redundant bottom cards) */}
              <div>
                <ProductDescription 
                  description={descText} 
                  lang={lang} 
                  showPhoneCTA={true} 
                  showTrustCards={false} 
                />
              </div>

              {/* Product Specificities & Variants: Sizes & Colors */}
              {!isOutOfStock && (product.sizes?.length > 0 || product.colors?.length > 0) && (
                <div className="space-y-3 pt-1">
                  {/* Sizes / Pointures Selection */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>👟</span>
                          <span>{t.selectSize || 'Pointure / Taille :'}</span>
                        </span>
                        {selectedSize && (
                          <span className="text-xs font-black text-brand-orange bg-brand-orange/10 dark:bg-brand-orange/20 px-2.5 py-0.5 rounded-lg border border-brand-orange/20">
                            {selectedSize}
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
                              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all duration-150 active:scale-95 ${
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
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>🎨</span>
                          <span>{t.selectColor || 'Couleur :'}</span>
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

              {/* Quantity Selector */}
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

              {/* Unified Compact Assurances & Stock Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 flex-wrap text-xs">
                {isOutOfStock ? (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.outOfStock}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.inStock} ({product.stockQuantity ?? 10})</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Truck className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                  <span>{t.shipping69 || 'Livraison à domicile'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-navy dark:text-sky-400 shrink-0" />
                  <span>{t.securePayment || 'Paiement à la livraison'}</span>
                </div>
              </div>
            </div>

            {/* Sticky Action CTAs Footer - Always visible without scrolling */}
            <div className="sticky bottom-0 z-30 p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] flex flex-col gap-2 shrink-0">
              <div className="flex flex-col sm:flex-row gap-2.5">
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

              {/* Express Algerian COD reassurance badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
                <span>{lang === 'ar' ? '🇩🇿 الدفع عند الاستلام (69 ولاية) • عاين سلعتك براحتك قبل الدفع' : '🇩🇿 Paiement à la livraison (69 Wilayas) • Vérifiez votre colis avant de payer'}</span>
              </div>
            </div>
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
