import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  PhoneCall
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
  compact = false,
  maxInitialBlocks = 4,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description || typeof description !== 'string' || !description.trim()) {
    return null;
  }

  const isRTLGlobal = lang === 'ar' || /[\u0600-\u06FF]/.test(description);
  const blocks = parseSmartDescription(description);

  if (!blocks || blocks.length === 0) {
    return (
      <div 
        dir={isRTLGlobal ? 'rtl' : 'ltr'} 
        className={`text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line ${className}`}
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-transparent border border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-extrabold shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-orange shrink-0 animate-pulse" />
                <span>{block.content}</span>
              </div>
            );

          case 'key-value':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className="flex items-start gap-2 p-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <span className="text-xs shrink-0 leading-none mt-0.5 text-brand-orange font-bold">
                  {block.icon || '✦'}
                </span>
                <div className="flex-1 min-w-0 leading-relaxed">
                  <span className="font-extrabold text-slate-900 dark:text-white mr-1.5">
                    {block.key} :
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {renderFormattedTextWithLinks(block.value)}
                  </span>
                </div>
              </div>
            );

          case 'bullet':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed px-0.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0">
                  {renderFormattedTextWithLinks(block.content)}
                </span>
              </div>
            );

          case 'callout':
            return (
              <div 
                key={block.id}
                dir={isBlockRTL ? 'rtl' : 'ltr'}
                className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm shrink-0 leading-none">{block.icon}</span>
                  <span className="text-slate-700 dark:text-slate-300 leading-tight">
                    {renderFormattedTextWithLinks(block.content)}
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
                className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal"
              >
                {renderFormattedTextWithLinks(block.content)}
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
            className="text-xs font-bold text-brand-orange hover:text-brand-orange-hover inline-flex items-center gap-1 transition-colors active:scale-95 py-0.5"
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
 * Automatically detects phone numbers in any text and renders them as clickable links
 */
function renderFormattedTextWithLinks(text) {
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
    const cleanTel = phoneStr.replace(/[\s.-]/g, '');

    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }

    parts.push(
      <a
        key={`tel-${idx}`}
        href={`tel:${cleanTel}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange font-bold text-xs transition-colors"
        title="Cliquer pour appeler"
        onClick={(e) => e.stopPropagation()}
      >
        <PhoneCall className="w-2.5 h-2.5" />
        <span>{phoneStr}</span>
      </a>
    );

    lastIndex = start + phoneStr.length;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
