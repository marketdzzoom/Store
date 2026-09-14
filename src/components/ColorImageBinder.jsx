import React, { useState } from 'react';
import { Camera, Check, Wand2, X, Link2, Sparkles, RefreshCw } from 'lucide-react';
import { getColorStyle } from '../utils/colors';

/**
 * Visual 1-Click Color-to-Photo Association Component
 * Allows sellers to visually bind each color variant to its exact photo thumbnail.
 * Eliminates wrong photo switching caused by arbitrary order in photo galleries.
 */
export default function ColorImageBinder({
  colors = [],
  images = [],
  colorImageMap = {},
  onChange = () => {},
  lang = 'fr'
}) {
  const [toastMessage, setToastMessage] = useState(null);

  // If no colors are entered or only 1 image exists, don't show the binder
  if (!colors || colors.length === 0 || !images || images.length <= 1) {
    return null;
  }

  // Helper to get active photo index for a color
  const getMappedIndex = (colorName) => {
    if (!colorImageMap || !colorName) return -1;
    const clean = String(colorName).trim().toLowerCase();
    const val = colorImageMap[colorName] ?? colorImageMap[clean];
    if (val === undefined || val === null) return -1;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const foundIdx = images.findIndex((img) => img === val);
      return foundIdx;
    }
    return -1;
  };

  // Toggle binding a photo to a color
  const handleTogglePhoto = (colorName, imgIndex) => {
    const currentIdx = getMappedIndex(colorName);
    const newMap = { ...colorImageMap };

    if (currentIdx === imgIndex) {
      // Unlink
      delete newMap[colorName];
      delete newMap[colorName.toLowerCase()];
    } else {
      // Link to this photo index
      newMap[colorName] = imgIndex;
    }

    onChange(newMap);
  };

  // Unlink a single color
  const handleUnlink = (colorName) => {
    const newMap = { ...colorImageMap };
    delete newMap[colorName];
    delete newMap[colorName.toLowerCase()];
    onChange(newMap);
  };

  // Unlink all
  const handleResetAll = () => {
    onChange({});
    showToast(lang === 'ar' ? 'تم إلغاء جميع الارتباطات' : 'Toutes les liaisons ont été réinitialisées');
  };

  // Auto-detect matching photos by keywords in image URLs
  const handleAutoDetect = () => {
    let matchedCount = 0;
    const newMap = { ...colorImageMap };

    colors.forEach((col) => {
      const cleanCol = col.toLowerCase().trim();
      const words = cleanCol.split(/[\s-]+/).filter((w) => w.length > 2);

      for (let i = 0; i < images.length; i++) {
        const imgUrl = String(images[i]).toLowerCase();
        const hasMatch = words.some((w) => imgUrl.includes(w));
        if (hasMatch) {
          newMap[col] = i;
          matchedCount++;
          break;
        }
      }
    });

    onChange(newMap);

    if (matchedCount > 0) {
      showToast(
        lang === 'ar'
          ? `تم ربط ${matchedCount} لون تلقائياً!`
          : `${matchedCount} couleur(s) liée(s) automatiquement selon le nom !`
      );
    } else {
      showToast(
        lang === 'ar'
          ? 'لم يتم العثور على تطابق تلقائي. يرجى الاختيار يدوياً.'
          : 'Aucun mot-clé détecté dans les liens. Cliquez sur les photos pour lier manuellement.'
      );
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const mappedColorsCount = colors.filter((c) => getMappedIndex(c) !== -1).length;

  return (
    <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border-2 border-dashed border-amber-300/80 dark:border-amber-600/60 shadow-xs space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-brand-orange shrink-0" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              📸 Liaison intelligente Couleurs ➔ Photos
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
              {mappedColorsCount} / {colors.length} liée(s)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Cliquez sur la vraie photo de chaque couleur. Quand le client clique sur une couleur, sa photo s'affichera immédiatement !
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleAutoDetect}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
            title="Détecter automatiquement si les liens de photos contiennent le nom de la couleur"
          >
            <Wand2 className="w-3 h-3 text-amber-600" />
            <span>🪄 Détection auto</span>
          </button>

          {mappedColorsCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 transition-colors"
              title="Réinitialiser toutes les liaisons"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-2 rounded-xl bg-amber-500 text-white text-[11px] font-bold text-center animate-fadeIn shadow-sm">
          {toastMessage}
        </div>
      )}

      {/* Color Rows */}
      <div className="space-y-2">
        {colors.map((colName) => {
          const cStyle = getColorStyle(colName);
          const activeIdx = getMappedIndex(colName);
          const isMapped = activeIdx >= 0 && activeIdx < images.length;

          return (
            <div
              key={colName}
              className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-2"
            >
              {/* Color Header & Status */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full inline-block flex-shrink-0 ${
                      cStyle.isLight ? 'border border-slate-400' : ''
                    }`}
                    style={{ background: cStyle.background }}
                  />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    {colName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isMapped ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Photo #{activeIdx + 1} liée</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnlink(colName)}
                        className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold underline px-1"
                        title="Délier cette couleur"
                      >
                        Délier
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Cliquez sur la photo ci-dessous pour la lier
                    </span>
                  )}
                </div>
              </div>

              {/* Photos Row */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                {images.map((imgUrl, imgIdx) => {
                  const isThisSelected = activeIdx === imgIdx;
                  return (
                    <button
                      key={imgIdx}
                      type="button"
                      onClick={() => handleTogglePhoto(colName, imgIdx)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all active:scale-95 group ${
                        isThisSelected
                          ? 'ring-2 ring-brand-orange border-2 border-brand-orange shadow-md scale-105'
                          : 'border border-slate-200 dark:border-slate-700 opacity-65 hover:opacity-100 hover:border-brand-orange/60'
                      }`}
                      title={`Associer la photo #${imgIdx + 1} à ${colName}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${imgIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute top-1 left-1 px-1 py-0.2 rounded text-[9px] font-extrabold shadow-xs ${
                          isThisSelected
                            ? 'bg-brand-orange text-white'
                            : 'bg-black/60 text-white'
                        }`}
                      >
                        #{imgIdx + 1}
                      </span>
                      {isThisSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
