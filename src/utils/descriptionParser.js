/**
 * Description Parser & Structurer for Zoom Market Dz
 * Converts condensed or raw product descriptions into structured,
 * high-impact, organized e-commerce sections (Headlines, Intro, Features, Trust cards, Phone).
 */

export function parseProductDescription(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  let normalized = text;

  // 1. Headline enclosed in ✨ or ⭐ or 🔥
  let headline = null;
  const headlineMatch = normalized.match(/^([✨⭐🔥]+)(.*?)\1/u);
  if (headlineMatch) {
    headline = headlineMatch[2].replace(/[✨⭐🔥]/g, '').trim();
    normalized = normalized.substring(headlineMatch[0].length).trim();
  } else {
    // If first line starts with ✨ or ⭐ and is short (< 90 chars)
    const firstLineMatch = normalized.match(/^([✨⭐🔥]+)\s*([^.\n]+)[.!\n]?/u);
    if (firstLineMatch && firstLineMatch[2].length < 90) {
      headline = firstLineMatch[2].trim();
      normalized = normalized.substring(firstLineMatch[0].length).trim();
    }
  }

  // 2. Extract phone & contact (FR & AR)
  let phone = null;
  let phoneLabel = null;
  const phoneRegex = /(?:📞|📱|Tél(?:éphone)?|Contact|Pour commander(?: ou pour toute information)?|للطلب(?: والاستفسار| أو الاستعلام)?|اتصل بنا)[^:\d\n]*:\s*([0-9\s+]{9,15})/iu;
  const pMatch = normalized.match(phoneRegex);
  if (pMatch) {
    phone = pMatch[1].trim();
    const fullMatch = pMatch[0];
    phoneLabel = fullMatch.split(':')[0].replace(/^[📞📱\s]+/, '').trim() || 'Pour commander';
    normalized = normalized.replace(fullMatch, ' ').trim();
  } else {
    const rawPhone = normalized.match(/(?:📞|📱)\s*([0-9\s+]{9,15})/u);
    if (rawPhone) {
      phone = rawPhone[1].trim();
      phoneLabel = 'Pour commander';
      normalized = normalized.replace(rawPhone[0], ' ').trim();
    }
  }

  // 3. Extract delivery (FR & AR)
  let delivery = null;
  const delRegex = /(?:🚚\s*)?(?:Livraison|التوصيل)\s*:\s*([^🤝📞•\n]+?(?=(?:[.]?\s*(?:🚚|📞|📱|🤝|Paiement|Pour commander|الدفع|للطلب|$))))/iu;
  const dMatch = normalized.match(delRegex);
  if (dMatch) {
    delivery = dMatch[1].replace(/[🚚\s.]+$/, '').trim();
    normalized = normalized.replace(dMatch[0], ' ').trim();
  }

  // 4. Extract payment (FR & AR)
  let payment = null;
  const payRegex = /(?:🤝\s*)?(?:Paiement|الدفع)\s*:\s*([^🚚📞•\n]+?(?=(?:[.]?\s*(?:🚚|📞|📱|🤝|Livraison|Pour commander|التوصيل|للطلب|$))))/iu;
  const payMatch = normalized.match(payRegex);
  if (payMatch) {
    payment = payMatch[1].replace(/[🤝\s.]+$/, '').trim();
    normalized = normalized.replace(payMatch[0], ' ').trim();
  }

  // Clean trailing punctuation or stray emojis
  normalized = normalized.replace(/[🚚🤝📞📱]/gu, ' ').trim();

  // 5. Split remaining text into logical sections using Unicode boundaries
  const sectionSplitPattern = /(?=(?:(?:^|[^\p{L}\p{N}])(?:Conception|Couleurs?|Pointures?|Tailles?|Matière|Garantie|Spécifications?|Caractéristique[s]?|Avantages?|Fonctionnalités?|Autonomie|Batterie|Poids|Dimensions?|Composition|المواصفات|المميزات|الألوان|المقاسات|الضمان)[^.\n:]{0,35}:))/giu;
  
  let parts = normalized
    .split(/\r?\n+/)
    .flatMap((p) => p.split(sectionSplitPattern))
    .map((s) => s.trim())
    .filter(Boolean);

  let intro = '';
  const features = [];
  const bulletPoints = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const kvMatch = part.match(/^([•\-✓*]|\s*)?\s*([^:\n]{2,35})\s*:\s*(.+)$/u);
    if (kvMatch && !kvMatch[2].toLowerCase().includes('http')) {
      const key = kvMatch[2].trim().replace(/^[•\-✓*✨\s]+/, '');
      const val = kvMatch[3].trim().replace(/[.]\s*$/, '').replace(/\s+/g, ' ');
      
      let icon = '✦';
      const kLow = key.toLowerCase();
      if (kLow.includes('couleur') || kLow.includes('ألوان')) icon = '🎨';
      else if (kLow.includes('pointure') || kLow.includes('taille') || kLow.includes('مقاس')) icon = '👟';
      else if (kLow.includes('conception') || kLow.includes('matière') || kLow.includes('ergonomie') || kLow.includes('مواصفات') || kLow.includes('مميزات')) icon = '✨';
      else if (kLow.includes('batterie') || kLow.includes('autonomie') || kLow.includes('بطارية')) icon = '🔋';
      else if (kLow.includes('garantie') || kLow.includes('ضمان')) icon = '🛡️';
      
      features.push({ key, value: val, icon });
    } else if (part.startsWith('•') || part.startsWith('-') || part.startsWith('*') || part.startsWith('✓')) {
      bulletPoints.push(part.replace(/^[•\-*✓]\s*/, '').trim());
    } else {
      if (!intro) {
        intro = part.replace(/[.]\s*$/, '');
      } else {
        bulletPoints.push(part);
      }
    }
  }

  return {
    headline,
    intro,
    features,
    bulletPoints,
    delivery,
    payment,
    phone,
    phoneLabel
  };
}

/**
 * Re-formats any unorganized or single-line description into a clean,
 * beautifully formatted multi-line text suitable for the admin textarea.
 */
export function formatRawDescriptionToStructured(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const parsed = parseProductDescription(raw);
  if (!parsed) return raw;

  const lines = [];

  if (parsed.headline) {
    lines.push(`✨ ${parsed.headline} ✨`);
    lines.push('');
  }

  if (parsed.intro) {
    lines.push(parsed.intro);
    lines.push('');
  }

  if (parsed.features && parsed.features.length > 0) {
    for (const f of parsed.features) {
      lines.push(`• ${f.key} : ${f.value}`);
    }
    lines.push('');
  }

  if (parsed.bulletPoints && parsed.bulletPoints.length > 0) {
    for (const bp of parsed.bulletPoints) {
      lines.push(`• ${bp}`);
    }
    lines.push('');
  }

  if (parsed.delivery) {
    lines.push(`🚚 Livraison : ${parsed.delivery}`);
  }

  if (parsed.payment) {
    lines.push(`🤝 Paiement : ${parsed.payment}`);
  }

  if (parsed.phone) {
    lines.push(`📞 ${parsed.phoneLabel || 'Pour commander ou pour toute information'} : ${parsed.phone}`);
  }

  return lines.join('\n').trim();
}

/**
 * Ready-to-use high-converting templates for admins
 */
export const PRO_DESCRIPTION_TEMPLATE_FR = `✨ [Nom du produit] – Élégance & Confort Moderne ✨

L'alliance parfaite entre bien-être absolu, praticité et style tendance pour votre quotidien.

• Conception : Matériaux de haute qualité, finition soignée et durable
• Spécificités : Ergonomique, léger et agréable à utiliser
• Couleurs disponibles : Voir les options ci-dessus
• Tailles / Pointures : Disponibles en stock

🚚 Livraison : Rapide et disponible directement à domicile
🤝 Paiement : À la réception après vérification de votre commande
📞 Pour commander ou pour toute information : 0663 08 50 69`;

export const PRO_DESCRIPTION_TEMPLATE_AR = `✨ [اسم المنتج] – أناقة وجودة عالية ✨

الخيار المثالي للجمع بين الراحة التامة، العملية والمظهر العصري للاستخدام اليومي.

• التصميم والمواد : خامات ممتازة عالية الجودة مع لمسة نهائية متقنة
• المميزات : مريح، خفيف وعملي للاستعمال اليومي
• الألوان المتوفرة : متوفر في خيارات متعددة
• المقاسات : متوفرة حسب الاختيار أعلاه

🚚 التوصيل : سريع ومتوفر مباشرة لباب المنزل
🤝 الدفع : عند الاستلام بعد معاينة وتفقد الطلب
📞 للطلب أو لأي استفسار : 0663 08 50 69`;
