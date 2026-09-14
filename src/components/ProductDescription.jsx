import React from 'react';
import { 
  Truck, 
  ShieldCheck, 
  PhoneCall, 
  Sparkles, 
  CheckCircle2, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { parseProductDescription } from '../utils/descriptionParser';

export default function ProductDescription({ 
  description, 
  lang = 'fr', 
  showPhoneCTA = true, 
  showTrustCards = true,
  className = ''
}) {
  if (!description || typeof description !== 'string' || !description.trim()) {
    return null;
  }

  const isRTL = lang === 'ar' || /[\u0600-\u06FF]/.test(description);
  const parsed = parseProductDescription(description);

  // If parsing didn't find any specific sections, display standard readable formatted paragraphs
  const hasStructure = parsed && (
    parsed.headline || 
    (parsed.features && parsed.features.length > 0) || 
    (parsed.bulletPoints && parsed.bulletPoints.length > 0) || 
    parsed.delivery || 
    parsed.payment || 
    parsed.phone
  );

  if (!hasStructure) {
    return (
      <div 
        dir={isRTL ? 'rtl' : 'ltr'} 
        className={`text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line ${className}`}
      >
        {description}
      </div>
    );
  }

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className={`space-y-3.5 ${className}`}
    >
      {/* 1. Impactful Headline / Hook Banner */}
      {parsed.headline && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-transparent border border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-extrabold shadow-2xs">
          <Sparkles className="w-4 h-4 text-brand-orange shrink-0 animate-pulse" />
          <span>{parsed.headline}</span>
        </div>
      )}

      {/* 2. Main Lead / Intro Paragraph */}
      {parsed.intro && (
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
          {parsed.intro}
        </p>
      )}

      {/* 3. Structured Key Features & Specifications */}
      {parsed.features && parsed.features.length > 0 && (
        <div className="space-y-2 pt-0.5">
          {parsed.features.map((feat, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <span className="text-sm shrink-0 leading-none mt-0.5">
                {feat.icon || '✦'}
              </span>
              <div className="flex-1 min-w-0 leading-relaxed">
                <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">
                  {feat.key} :
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {feat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Additional Bullet Points */}
      {parsed.bulletPoints && parsed.bulletPoints.length > 0 && (
        <ul className="space-y-1.5 pt-0.5">
          {parsed.bulletPoints.map((bp, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{bp}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 5. Trust Assurances: Delivery & Payment Cards */}
      {showTrustCards && (parsed.delivery || parsed.payment) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {parsed.delivery && (
            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-extrabold text-emerald-950 dark:text-emerald-200 block text-[11px]">
                  {isRTL ? 'التوصيل السريع' : 'Livraison à domicile'}
                </span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-tight block mt-0.5">
                  {parsed.delivery}
                </span>
              </div>
            </div>
          )}

          {parsed.payment && (
            <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-sky-50/90 dark:bg-sky-950/30 border border-sky-200/90 dark:border-sky-800/60 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-extrabold text-sky-950 dark:text-sky-200 block text-[11px]">
                  {isRTL ? 'الدفع الآمن' : 'Paiement à la réception'}
                </span>
                <span className="text-[11px] text-sky-800 dark:text-sky-300 font-medium leading-tight block mt-0.5">
                  {parsed.payment}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Direct Order by Phone / Contact Callout */}
      {showPhoneCTA && parsed.phone && (
        <a
          href={`tel:${parsed.phone.replace(/[\s-]/g, '')}`}
          className="flex items-center justify-between gap-3 p-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-850 border border-amber-200/90 dark:border-slate-700 hover:border-brand-orange text-xs transition-all shadow-2xs hover:shadow-xs group"
          title={isRTL ? 'اضغط للاتصال المباشر' : 'Cliquer pour appeler directement'}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight truncate">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                {parsed.phoneLabel || (isRTL ? 'للطلب والاستفسار' : 'Pour commander ou information')} :
              </span>
              <span className="font-black text-slate-900 dark:text-white tracking-wide text-xs sm:text-sm">
                {parsed.phone}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-extrabold text-brand-orange bg-white dark:bg-slate-700 px-2.5 py-1 rounded-xl border border-brand-orange/20 shadow-2xs group-hover:bg-brand-orange group-hover:text-white transition-colors shrink-0">
            {isRTL ? 'اتصل الآن 📞' : 'Appeler 📞'}
          </span>
        </a>
      )}
    </div>
  );
}
