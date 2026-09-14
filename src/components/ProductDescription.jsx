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
      className={`space-y-1.5 transition-all duration-300 ${className}`}
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
                    ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-2xs mb-1"
                    : "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-transparent border border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-extrabold shadow-2xs"
                }
              >
                <Sparkles className={`w-3 h-3 shrink-0 ${isDark ? 'text-amber-300' : 'text-brand-orange animate-pulse'}`} />
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
                    ? "flex items-start gap-2 text-xs sm:text-sm text-slate-200 py-0.5 leading-relaxed"
                    : "flex items-start gap-2 p-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                }
              >
                <span className={isDark ? "text-amber-400 font-bold shrink-0 mt-0.5 text-xs leading-none" : "text-xs shrink-0 leading-none mt-0.5 text-brand-orange font-bold"}>
                  {block.icon || '✦'}
                </span>
                <div className="flex-1 min-w-0 leading-relaxed">
                  <span className={isDark ? "font-bold text-amber-300 mr-1.5" : "font-extrabold text-slate-900 dark:text-white mr-1.5"}>
                    {block.key} :
                  </span>
                  <span className={isDark ? "text-slate-200 font-normal" : "text-slate-700 dark:text-slate-300 font-medium"}>
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
                className={
                  isDark
                    ? "font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-300 pt-2 pb-0.5 flex items-center gap-1.5"
                    : "font-black text-xs sm:text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200/70 dark:border-slate-700/70 pt-2 pb-1 flex items-center gap-2"
                }
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>{block.content}</span>
              </div>
            );

          case 'bullet':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className={
                  isDark
                    ? "flex items-start gap-2 text-xs sm:text-sm text-slate-200 py-0.5 leading-relaxed"
                    : "flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed px-1 py-0.5 text-slate-700 dark:text-slate-300 font-medium"
                }
              >
                {block.icon ? (
                  <span className="text-sm shrink-0 leading-none select-none mt-0.5">{block.icon}</span>
                ) : (
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-emerald-500'}`} />
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
                    ? "flex items-start gap-2 text-xs sm:text-sm text-slate-200 py-0.5 leading-relaxed"
                    : "flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                }
              >
                <span className="text-sm shrink-0 leading-none mt-0.5">{block.icon}</span>
                <span className="flex-1 min-w-0">
                  {renderFormattedTextWithLinks(block.content, isDark)}
                </span>
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
                    ? "text-xs sm:text-sm text-slate-200 leading-relaxed font-normal py-0.5"
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
                ? "text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors pt-0.5"
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
            ? "font-bold text-amber-300 tracking-wider"
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
