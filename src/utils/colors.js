/**
 * Zoom Market Dz - Color Mapping & Utility
 * Maps French, Arabic, and English color names or custom hex/CSS values
 * to accurate, real-world visual colors and CSS styles.
 */

// Popular color definitions with real hex values and light detection
export const COLOR_MAP = {
  // Noir & nuances
  'noir': { hex: '#111827', isLight: false, label: 'Noir', labelAr: 'أسود' },
  'black': { hex: '#111827', isLight: false, label: 'Noir', labelAr: 'أسود' },
  'أسود': { hex: '#111827', isLight: false, label: 'Noir', labelAr: 'أسود' },
  'اسود': { hex: '#111827', isLight: false, label: 'Noir', labelAr: 'أسود' },
  'noir mat': { hex: '#1F2937', isLight: false, label: 'Noir Mat', labelAr: 'أسود مطفي' },
  'noir all-black': { hex: '#0B0F17', isLight: false, label: 'Noir Intense', labelAr: 'أسود داكن' },

  // Blanc & nuances
  'blanc': { hex: '#FFFFFF', isLight: true, label: 'Blanc', labelAr: 'أبيض' },
  'white': { hex: '#FFFFFF', isLight: true, label: 'Blanc', labelAr: 'أبيض' },
  'أبيض': { hex: '#FFFFFF', isLight: true, label: 'Blanc', labelAr: 'أبيض' },
  'ابيض': { hex: '#FFFFFF', isLight: true, label: 'Blanc', labelAr: 'أبيض' },
  'blanc casse': { hex: '#FAF7F2', isLight: true, label: 'Blanc Cassé', labelAr: 'أوف وايت' },
  'blanc cassé': { hex: '#FAF7F2', isLight: true, label: 'Blanc Cassé', labelAr: 'أوف وايت' },
  'off-white': { hex: '#FAF7F2', isLight: true, label: 'Blanc Cassé', labelAr: 'أوف وايت' },

  // Gris
  'gris': { hex: '#6B7280', isLight: false, label: 'Gris', labelAr: 'رمادي' },
  'grey': { hex: '#6B7280', isLight: false, label: 'Gris', labelAr: 'رمادي' },
  'gray': { hex: '#6B7280', isLight: false, label: 'Gris', labelAr: 'رمادي' },
  'رمادي': { hex: '#6B7280', isLight: false, label: 'Gris', labelAr: 'رمادي' },
  'gris clair': { hex: '#D1D5DB', isLight: true, label: 'Gris Clair', labelAr: 'رمادي فاتح' },
  'gris anthracite': { hex: '#374151', isLight: false, label: 'Anthracite', labelAr: 'رمادي فحمي' },
  'anthracite': { hex: '#374151', isLight: false, label: 'Anthracite', labelAr: 'رمادي فحمي' },

  // Bleus
  'bleu': { hex: '#2563EB', isLight: false, label: 'Bleu', labelAr: 'أزرق' },
  'blue': { hex: '#2563EB', isLight: false, label: 'Bleu', labelAr: 'أزرق' },
  'أزرق': { hex: '#2563EB', isLight: false, label: 'Bleu', labelAr: 'أزرق' },
  'ازرق': { hex: '#2563EB', isLight: false, label: 'Bleu', labelAr: 'أزرق' },
  'bleu marine': { hex: '#1E3A8A', isLight: false, label: 'Bleu Marine', labelAr: 'أزرق داكن (كحلي)' },
  'navy': { hex: '#1E3A8A', isLight: false, label: 'Bleu Marine', labelAr: 'كحلي' },
  'كحلي': { hex: '#1E3A8A', isLight: false, label: 'Bleu Marine', labelAr: 'كحلي' },
  'bleu nuit': { hex: '#0F172A', isLight: false, label: 'Bleu Nuit', labelAr: 'أزرق ليلي' },
  'bleu ciel': { hex: '#38BDF8', isLight: false, label: 'Bleu Ciel', labelAr: 'أزرق سماوي' },
  'sky blue': { hex: '#38BDF8', isLight: false, label: 'Bleu Ciel', labelAr: 'سماوي' },
  'سماوي': { hex: '#38BDF8', isLight: false, label: 'Bleu Ciel', labelAr: 'سماوي' },
  'bleu roi': { hex: '#1D4ED8', isLight: false, label: 'Bleu Roi', labelAr: 'أزرق ملكي' },
  'turquoise': { hex: '#06B6D4', isLight: false, label: 'Turquoise', labelAr: 'فيروزي' },
  'فيروزي': { hex: '#06B6D4', isLight: false, label: 'Turquoise', labelAr: 'فيروزي' },

  // Rouges & Bordeaux
  'rouge': { hex: '#DC2626', isLight: false, label: 'Rouge', labelAr: 'أحمر' },
  'red': { hex: '#DC2626', isLight: false, label: 'Rouge', labelAr: 'أحمر' },
  'أحمر': { hex: '#DC2626', isLight: false, label: 'Rouge', labelAr: 'أحمر' },
  'احمر': { hex: '#DC2626', isLight: false, label: 'Rouge', labelAr: 'أحمر' },
  'bordeaux': { hex: '#800020', isLight: false, label: 'Bordeaux', labelAr: 'عنابي (خمري)' },
  'burgundy': { hex: '#800020', isLight: false, label: 'Bordeaux', labelAr: 'عنابي' },
  'عنابي': { hex: '#800020', isLight: false, label: 'Bordeaux', labelAr: 'عنابي' },
  'خمري': { hex: '#800020', isLight: false, label: 'Bordeaux', labelAr: 'خمري' },
  'grenat': { hex: '#6B1123', isLight: false, label: 'Grenat', labelAr: 'عنابي غامق' },

  // Verts
  'vert': { hex: '#16A34A', isLight: false, label: 'Vert', labelAr: 'أخضر' },
  'green': { hex: '#16A34A', isLight: false, label: 'Vert', labelAr: 'أخضر' },
  'أخضر': { hex: '#16A34A', isLight: false, label: 'Vert', labelAr: 'أخضر' },
  'اخضر': { hex: '#16A34A', isLight: false, label: 'Vert', labelAr: 'أخضر' },
  'vert olive': { hex: '#556B2F', isLight: false, label: 'Vert Olive', labelAr: 'زيتي' },
  'olive': { hex: '#556B2F', isLight: false, label: 'Olive', labelAr: 'زيتي' },
  'زيتي': { hex: '#556B2F', isLight: false, label: 'Olive', labelAr: 'زيتي' },
  'kaki': { hex: '#707A58', isLight: false, label: 'Kaki', labelAr: 'كاكي' },
  'khaki': { hex: '#707A58', isLight: false, label: 'Kaki', labelAr: 'كاكي' },
  'كاكي': { hex: '#707A58', isLight: false, label: 'Kaki', labelAr: 'كاكي' },
  'vert bouteille': { hex: '#14532D', isLight: false, label: 'Vert Forêt', labelAr: 'أخضر داكن' },
  'vert menthe': { hex: '#34D399', isLight: false, label: 'Vert Menthe', labelAr: 'أخضر نعناعي' },
  'menthe': { hex: '#34D399', isLight: false, label: 'Menthe', labelAr: 'نعناعي' },

  // Marrons, Beiges & Camels
  'marron': { hex: '#78350F', isLight: false, label: 'Marron', labelAr: 'بني' },
  'brown': { hex: '#78350F', isLight: false, label: 'Marron', labelAr: 'بني' },
  'بني': { hex: '#78350F', isLight: false, label: 'Marron', labelAr: 'بني' },
  'chocolat': { hex: '#451A03', isLight: false, label: 'Chocolat', labelAr: 'بني شوكولا' },
  'camel': { hex: '#C19A6B', isLight: false, label: 'Camel', labelAr: 'جملي' },
  'جملي': { hex: '#C19A6B', isLight: false, label: 'Camel', labelAr: 'جملي' },
  'beige': { hex: '#E5D9C5', isLight: true, label: 'Beige', labelAr: 'بيج' },
  'بيج': { hex: '#E5D9C5', isLight: true, label: 'Beige', labelAr: 'بيج' },
  'creme': { hex: '#FEF3C7', isLight: true, label: 'Crème', labelAr: 'سكري' },
  'crème': { hex: '#FEF3C7', isLight: true, label: 'Crème', labelAr: 'سكري' },
  'سكري': { hex: '#FEF3C7', isLight: true, label: 'Crème', labelAr: 'سكري' },
  'taupe': { hex: '#8B8589', isLight: false, label: 'Taupe', labelAr: 'رمادي ترابي' },

  // Roses, Violets & Oranges
  'rose': { hex: '#EC4899', isLight: false, label: 'Rose', labelAr: 'وردي' },
  'pink': { hex: '#EC4899', isLight: false, label: 'Rose', labelAr: 'وردي' },
  'وردي': { hex: '#EC4899', isLight: false, label: 'Rose', labelAr: 'وردي' },
  'زهري': { hex: '#EC4899', isLight: false, label: 'Rose', labelAr: 'زهري' },
  'rose poudré': { hex: '#FBCFE8', isLight: true, label: 'Rose Poudré', labelAr: 'وردي فاتح' },
  'rose fuchsia': { hex: '#D946EF', isLight: false, label: 'Fuchsia', labelAr: 'فوشيا' },
  'fuchsia': { hex: '#D946EF', isLight: false, label: 'Fuchsia', labelAr: 'فوشيا' },
  'orange': { hex: '#EA580C', isLight: false, label: 'Orange', labelAr: 'برتقالي' },
  'برتقالي': { hex: '#EA580C', isLight: false, label: 'Orange', labelAr: 'برتقالي' },
  'corail': { hex: '#F87171', isLight: false, label: 'Corail', labelAr: 'مرجاني' },
  'jaune': { hex: '#EAB308', isLight: false, label: 'Jaune', labelAr: 'أصفر' },
  'yellow': { hex: '#EAB308', isLight: false, label: 'Jaune', labelAr: 'أصفر' },
  'أصفر': { hex: '#EAB308', isLight: false, label: 'Jaune', labelAr: 'أصفر' },
  'اصفر': { hex: '#EAB308', isLight: false, label: 'Jaune', labelAr: 'أصفر' },
  'moutarde': { hex: '#CA8A04', isLight: false, label: 'Moutarde', labelAr: 'خردلي' },
  'خردلي': { hex: '#CA8A04', isLight: false, label: 'Moutarde', labelAr: 'خردلي' },
  'violet': { hex: '#7C3AED', isLight: false, label: 'Violet', labelAr: 'بنفسجي' },
  'purple': { hex: '#7C3AED', isLight: false, label: 'Violet', labelAr: 'بنفسجي' },
  'بنفسجي': { hex: '#7C3AED', isLight: false, label: 'Violet', labelAr: 'بنفسجي' },
  'lilas': { hex: '#C084FC', isLight: false, label: 'Lilas', labelAr: 'ليلكي' },
  'lavande': { hex: '#A855F7', isLight: false, label: 'Lavande', labelAr: 'لافندر' },

  // Métalliques & Spéciaux
  'dore': { hex: '#D97706', gradient: 'linear-gradient(135deg, #F59E0B, #FDE68A, #D97706)', isLight: false, label: 'Doré', labelAr: 'ذهبي' },
  'doré': { hex: '#D97706', gradient: 'linear-gradient(135deg, #F59E0B, #FDE68A, #D97706)', isLight: false, label: 'Doré', labelAr: 'ذهبي' },
  'gold': { hex: '#D97706', gradient: 'linear-gradient(135deg, #F59E0B, #FDE68A, #D97706)', isLight: false, label: 'Doré', labelAr: 'ذهبي' },
  'ذهبي': { hex: '#D97706', gradient: 'linear-gradient(135deg, #F59E0B, #FDE68A, #D97706)', isLight: false, label: 'Doré', labelAr: 'ذهبي' },
  'argente': { hex: '#9CA3AF', gradient: 'linear-gradient(135deg, #F3F4F6, #9CA3AF, #D1D5DB)', isLight: false, label: 'Argenté', labelAr: 'فضي' },
  'argenté': { hex: '#9CA3AF', gradient: 'linear-gradient(135deg, #F3F4F6, #9CA3AF, #D1D5DB)', isLight: false, label: 'Argenté', labelAr: 'فضي' },
  'silver': { hex: '#9CA3AF', gradient: 'linear-gradient(135deg, #F3F4F6, #9CA3AF, #D1D5DB)', isLight: false, label: 'Argenté', labelAr: 'فضي' },
  'فضي': { hex: '#9CA3AF', gradient: 'linear-gradient(135deg, #F3F4F6, #9CA3AF, #D1D5DB)', isLight: false, label: 'Argenté', labelAr: 'فضي' },
  'bronze': { hex: '#CD7F32', isLight: false, label: 'Bronze', labelAr: 'برونزي' },
  'multicolore': { hex: '#F97316', gradient: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 33%, #10B981 66%, #3B82F6 100%)', isLight: false, label: 'Multicolore', labelAr: 'متعدد الألوان' },
  'multicolor': { hex: '#F97316', gradient: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 33%, #10B981 66%, #3B82F6 100%)', isLight: false, label: 'Multicolore', labelAr: 'متعدد الألوان' }
};

/**
 * Common preset colors for fast 1-click selection in Admin Panel
 */
export const PRESET_COLORS = [
  { name: 'Noir', nameAr: 'أسود', hex: '#111827' },
  { name: 'Blanc', nameAr: 'أبيض', hex: '#FFFFFF', isLight: true },
  { name: 'Gris', nameAr: 'رمادي', hex: '#6B7280' },
  { name: 'Bleu Marine', nameAr: 'كحلي', hex: '#1E3A8A' },
  { name: 'Bleu', nameAr: 'أزرق', hex: '#2563EB' },
  { name: 'Bleu Ciel', nameAr: 'سماوي', hex: '#38BDF8' },
  { name: 'Rouge', nameAr: 'أحمر', hex: '#DC2626' },
  { name: 'Bordeaux', nameAr: 'عنابي', hex: '#800020' },
  { name: 'Vert', nameAr: 'أخضر', hex: '#16A34A' },
  { name: 'Kaki', nameAr: 'كاكي', hex: '#707A58' },
  { name: 'Marron', nameAr: 'بني', hex: '#78350F' },
  { name: 'Camel', nameAr: 'جملي', hex: '#C19A6B' },
  { name: 'Beige', nameAr: 'بيج', hex: '#E5D9C5', isLight: true },
  { name: 'Rose', nameAr: 'وردي', hex: '#EC4899' },
  { name: 'Jaune', nameAr: 'أصفر', hex: '#EAB308' },
  { name: 'Orange', nameAr: 'برتقالي', hex: '#EA580C' },
  { name: 'Violet', nameAr: 'بنفسجي', hex: '#7C3AED' },
  { name: 'Doré', nameAr: 'ذهبي', hex: '#D97706', gradient: 'linear-gradient(135deg, #F59E0B, #FDE68A, #D97706)' },
  { name: 'Argenté', nameAr: 'فضي', hex: '#9CA3AF', gradient: 'linear-gradient(135deg, #F3F4F6, #9CA3AF, #D1D5DB)' }
];

/**
 * Resolves any color string to visual CSS style properties
 * @param {string} rawColor - e.g. "Noir", "Bleu Marine", "#FF4500", "أحمر"
 * @returns {{ background: string, isLight: boolean, hex: string }}
 */
export function getColorStyle(rawColor) {
  if (!rawColor || typeof rawColor !== 'string') {
    return { background: '#94A3B8', isLight: false, hex: '#94A3B8' };
  }

  const clean = rawColor.trim();

  // 1. Direct hex or CSS color (e.g. "#FF0000", "rgb(255,0,0)")
  if (clean.startsWith('#') || clean.startsWith('rgb') || clean.startsWith('hsl')) {
    const isWhiteOrNearWhite = clean.toLowerCase() === '#fff' || clean.toLowerCase() === '#ffffff';
    return { background: clean, isLight: isWhiteOrNearWhite, hex: clean };
  }

  const lower = clean.toLowerCase();

  // 2. Exact match in dictionary
  if (COLOR_MAP[lower]) {
    const item = COLOR_MAP[lower];
    return {
      background: item.gradient || item.hex,
      isLight: Boolean(item.isLight),
      hex: item.hex
    };
  }

  // 3. Partial match (search keys sorted by length descending so "bleu marine" matches before "bleu")
  const sortedKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      const item = COLOR_MAP[key];
      return {
        background: item.gradient || item.hex,
        isLight: Boolean(item.isLight),
        hex: item.hex
      };
    }
  }

  // 4. Fallback: Slate dot
  return { background: '#64748B', isLight: false, hex: '#64748B' };
}
