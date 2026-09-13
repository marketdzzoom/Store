import React, { useState } from 'react';
import { ShoppingBag, Plus, Eye, Star, Check, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { TRANSLATIONS, CATEGORY_MAP_AR } from '../data/translations';

export default function ProductCard({ product, onAddToCart, onBuyNow, onQuickView, lang = 'fr' }) {
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const isOutOfStock = product.inStock === false || product.stockQuantity === 0 || product.badge === 'Rupture de Stock' || product.badge === 'نفذت الكمية';

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleOrder = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product, 1);
    } else {
      onAddToCart(product);
    }
  };

  const discountPercent = product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : null;

  const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : product.image;
  const fallbackImg = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";

  // Dynamic Arabic Title & Description if provided
  const titleText = (lang === 'ar' && product.titleAr) ? product.titleAr : product.title;
  const descText = (lang === 'ar' && product.descriptionAr) ? product.descriptionAr : product.description;
  const categoryLabel = (lang === 'ar' && CATEGORY_MAP_AR[product.category]) ? CATEGORY_MAP_AR[product.category] : product.category;

  return (
    <div 
      onClick={() => onQuickView(product)}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-card dark:shadow-card-dark hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      <div>
        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {isOutOfStock ? (
            <span className="bg-red-700 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t.outOfStock}
            </span>
          ) : (
            product.badge && (
              <span className="bg-brand-orange text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider">
                {product.badge}
              </span>
            )
          )}
          {discountPercent && !isOutOfStock && (
            <span className="bg-amber-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Product Image Box */}
        <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img
            src={imgError || !primaryImage ? fallbackImg : primaryImage}
            alt={titleText}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />

          {/* Multiple images indicator badge */}
          {product.images && product.images.length > 1 && (
            <span className="absolute bottom-2.5 right-2.5 bg-brand-navy/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
              +{product.images.length} {t.photosCount}
            </span>
          )}

          <div className="absolute inset-0 bg-brand-navy/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="bg-white/90 hover:bg-white text-brand-navy p-3 rounded-full shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300 font-medium text-xs flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-brand-orange" />
              <span>{t.quickView}</span>
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5">
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-brand-orange uppercase tracking-wider">
              {categoryLabel || 'Général'}
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating || '4.8'}</span>
              <span className="text-slate-400 text-[10px]">({product.reviewsCount || 12})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg line-clamp-2 leading-snug group-hover:text-brand-orange transition-colors">
            {titleText}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {descText}
          </p>
        </div>
      </div>

      {/* Card Footer: Price & Direct Order CTA */}
      <div className="p-4 sm:p-5 pt-0 mt-auto border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-xs text-slate-400 block -mb-0.5 font-medium">{t.price}</span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-xl">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-slate-400 line-through font-medium">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quick Add icon button */}
          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAdd}
              className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 border ${
                added
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={t.addToCart}
            >
              {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          )}

          {/* Main Direct Order button */}
          <button
            type="button"
            onClick={handleOrder}
            disabled={isOutOfStock}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-brand-orange hover:bg-brand-orange-hover text-white shadow-brand-orange/20'
            }`}
          >
            {isOutOfStock ? (
              <span>{t.indisponible}</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{t.orderNow}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
