import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { parseSmartDescription } from '../utils/descriptionParser';

/**
 * Universal Smart Product Description
 * Renders any description dynamically into an organized, readable,
 * and high-impact layout with collapsible "Voir plus" support.
 * ZERO hardcoded domain assumptions.
 */
export default function ProductDescription({ 
  description, 
  lang = 'fr', 
  theme = 'auto', // 'auto' | 'light' | 'dark'
  compact = false,
  maxInitialBlocks = 4,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description || typeof description !== 'string' || !description.trim()) {
    return null;
  }

  const isDark = theme === 'dark' || (typeof className === 'string' && className.includes('theme-dark'));
  const isRTLGlobal = lang === 'ar' || /[\u0600-\u06FF]/.test(description);
  const blocks = parseSmartDescription(description);

  if (!blocks || blocks.length === 0) {
    return (
      <div 
        dir={isRTLGlobal ? 'rtl' : 'ltr'} 
        className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
          isDark ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'
        } ${className}`}
      >
        {description}
      </div>
    );
  }

  // Determine if we should enable the smart collapsible toggle
  const shouldCollapse = !compact && blocks.length > maxInitialBlocks;
  const displayedBlocks = shouldCollapse && !isExpanded 
    ? blocks.slice(0, maxInitialBlocks) 
    : blocks;

  return (
    <div 
      dir={isRTLGlobal ? 'rtl' : 'ltr'} 
      className={`space-y-2.5 transition-all duration-300 ${className}`}
    >
      {displayedBlocks.map((block) => {
        const isBlockRTL = block.isRTL ?? isRTLGlobal;

        switch (block.type) {
          case 'banner':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className={
                  isDark
                    ? "inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-brand-orange/15 to-amber-500/10 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-sm"
                    : "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-transparent border border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-extrabold shadow-2xs"
                }
              >
                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-300 animate-pulse' : 'text-brand-orange animate-pulse'}`} />
                <span>{block.content}</span>
              </div>
            );

          case 'key-value':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className={
                  isDark
                    ? "flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 hover:border-brand-orange/50 backdrop-blur-md text-xs sm:text-sm shadow-sm transition-all duration-200"
                    : "flex items-start gap-2 p-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                }
              >
                <span className={`text-xs shrink-0 leading-none mt-0.5 font-bold ${isDark ? 'text-brand-orange drop-shadow-sm' : 'text-brand-orange'}`}>
                  {block.icon || '✦'}
                </span>
                <div className="flex-1 min-w-0 leading-relaxed">
                  <span className={isDark ? "font-black text-white mr-1.5 tracking-wide" : "font-extrabold text-slate-900 dark:text-white mr-1.5"}>
                    {block.key} :
                  </span>
                  <span className={isDark ? "text-slate-200 font-medium" : "text-slate-700 dark:text-slate-300 font-medium"}>
                    {renderFormattedTextWithLinks(block.value, isDark)}
                  </span>
                </div>
              </div>
            );

          case 'subheading':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className={`font-black text-xs sm:text-sm uppercase tracking-wider pt-2 pb-1 flex items-center gap-2 ${
                  isDark ? 'text-slate-200 border-b border-white/10' : 'text-slate-800 dark:text-slate-200 border-b border-slate-200/70 dark:border-slate-700/70'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-brand-orange shrink-0 animate-pulse" />
                <span>{block.content}</span>
              </div>
            );

          case 'bullet':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed px-1 py-0.5 ${
                  isDark ? 'text-slate-100 font-medium' : 'text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                {block.icon ? (
                  <span className="text-base shrink-0 leading-none select-none">{block.icon}</span>
                ) : (
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-emerald-500'}`} />
                )}
                <span className="flex-1 min-w-0">
                  {renderFormattedTextWithLinks(block.content, isDark)}
                </span>
              </div>
            );

          case 'callout':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className={
                  isDark
                    ? "flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/[0.08] border border-white/15 text-slate-100 text-xs sm:text-sm backdrop-blur-md shadow-sm"
                    : "flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                }
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm shrink-0 leading-none">{block.icon}</span>
                  <span className={isDark ? "text-slate-200 font-medium leading-tight" : "text-slate-700 dark:text-slate-300 leading-tight"}>
                    {renderFormattedTextWithLinks(block.content, isDark)}
                  </span>
                </div>
              </div>
            );

          case 'paragraph':
          default:
            return (
              <p 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className={
                  isDark
                    ? "text-xs sm:text-sm text-slate-200 leading-relaxed font-normal"
                    : "text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal"
                }
              >
                {renderFormattedTextWithLinks(block.content, isDark)}
              </p>
            );
        }
      })}

      {/* Smart Collapsible "Voir plus / Voir moins" toggle */}
      {shouldCollapse && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={
              isDark
                ? "text-xs font-black inline-flex items-center gap-1.5 transition-all active:scale-95 py-1 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-brand-orange hover:text-amber-300 shadow-sm"
                : "text-xs font-bold text-brand-orange hover:text-brand-orange-hover inline-flex items-center gap-1 transition-colors active:scale-95 py-0.5"
            }
          >
            <span>
              {isExpanded
                ? (isRTLGlobal ? 'عرض تفاصيل أقل ▴' : 'Voir moins ▴')
                : (isRTLGlobal ? `عرض كامل التفاصيل (${blocks.length - maxInitialBlocks}+) ▾` : `Voir tous les détails (${blocks.length - maxInitialBlocks}+) ▾`)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Automatically highlights phone numbers in any text cleanly as bold text
 */
function renderFormattedTextWithLinks(text, isDark = false) {
  if (!text || typeof text !== 'string') return text;

  // Phone regex for Algeria and standard formats: 05/06/07 followed by 8 digits with optional spaces
  const phonePattern = /(?:(?:\+?213|0)[567](?:[\s.-]?\d{2}){4}|(?:\+?213|0)[567]\d{8})/g;
  
  const matches = [...text.matchAll(phonePattern)];
  if (matches.length === 0) {
    return text;
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match, idx) => {
    const start = match.index;
    const phoneStr = match[0];

    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }

    parts.push(
      <strong 
        key={`phone-${idx}`} 
        className={
          isDark
            ? "font-black text-brand-orange bg-white/10 px-2 py-0.5 rounded-lg border border-white/20 tracking-wider inline-block my-0.5"
            : "font-extrabold text-slate-900 dark:text-white tracking-wider"
        }
      >
        {phoneStr}
      </strong>
    );

    lastIndex = start + phoneStr.length;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
