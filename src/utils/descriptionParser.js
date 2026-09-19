/**
 * Universal Smart Description Parser for Zoom Market Dz
 * Completely dynamic: NO hardcoded domain keywords.
 * Works for ANY product category (Tech, Fashion, Beauty, Home, Auto, Food, etc.)
 * in French, Arabic, and English.
 */

/**
 * Parses any description into an array of semantic blocks:
 * - 'banner': Highlight hook or product slogan (✨ ... ✨)
 * - 'key-value': Any dynamic specification line (Label : Value)
 * - 'bullet': Any bullet list item (•, -, *, ✓, 1., etc.)
 * - 'callout': Lines starting with an emoji icon
 * - 'paragraph': Normal prose description
 */
export function parseSmartDescription(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const text = raw.trim();
  if (!text) return [];

  // Step 1: Normalize lines
  let rawLines = [];
  if (text.includes('\n')) {
    rawLines = text.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  } else {
    // Single run-on string without newlines: break into lines smartly using generic grammar
    let norm = text;
    // 1. Break banner if wrapped: ✨ ... ✨
    norm = norm.replace(/([✨⭐🔥💎⚡].*?[✨⭐🔥💎⚡])\s*/gu, '$1\n');
    // 2. Break before any Capitalized Label : (works across all languages)
    norm = norm.replace(/(?<=\s|\p{Extended_Pictographic})(?=[\p{Lu}\p{Lt}\u0600-\u06FF][\p{L}\u0600-\u06FF'-]*(?:\s+[\p{L}\u0600-\u06FF'-]+){0,3}\s*:)/gu, '\n');
    // 3. Break before emojis starting a sentence/thought
    norm = norm.replace(/(?<=\S)\s*(?=[🚚🤝📞📱📦🛡️⚡💡🎯✓✔]\s*[\p{L}])/gu, '\n');

    rawLines = norm.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  }

  // Step 2: Semantic categorization of each line (ZERO hardcoded domain keywords)
  const blocks = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const isRTL = /[\u0600-\u06FF]/.test(line);

    // 1. Banner Hook check (e.g. ✨ Slogan ✨)
    const isBanner = /^[✨⭐🔥💎⚡].+[✨⭐🔥💎⚡]$/u.test(line) ||
      (i === 0 && /^[✨⭐🔥💎⚡]/.test(line) && line.length < 85);

    if (isBanner) {
      const cleanBanner = line.replace(/^[✨⭐🔥💎⚡\s]+|[✨⭐🔥💎⚡\s]+$/gu, '').trim();
      blocks.push({
        id: `b-${i}`,
        type: 'banner',
        content: cleanBanner,
        isRTL
      });
      continue;
    }

    // 2. Key-Value check: [Emoji]? [Label] : [Value] (Value must not be empty)
    const kvMatch = line.match(/^([\p{Extended_Pictographic}]?\s*)([\p{L}\p{N}\s/'-]{2,30})\s*:\s*(.+)$/u);
    if (kvMatch && !kvMatch[2].toLowerCase().startsWith('http') && kvMatch[3].trim().length > 0) {
      const icon = kvMatch[1].trim() || null;
      const key = kvMatch[2].trim().replace(/^[•\-*✓✔►▸+]\s*/u, '');
      const value = kvMatch[3].trim();

      blocks.push({
        id: `b-${i}`,
        type: 'key-value',
        icon,
        key,
        value,
        isRTL
      });
      continue;
    }

    // 3. Subheading check: e.g. "Couleurs disponibles :", "- Tailles :", "المواصفات :"
    const cleanLineForHeader = line.replace(/^[•\-*✓✔►▸+]\s*/u, '').trim();
    if (/^[\p{L}\p{N}\s/'-]{2,35}\s*:$/u.test(cleanLineForHeader)) {
      const headingText = cleanLineForHeader.replace(/:\s*$/, '').trim();
      blocks.push({
        id: `b-${i}`,
        type: 'subheading',
        content: headingText,
        isRTL
      });
      continue;
    }

    // 4. Bullet item check (•, -, *, ✓, numbers)
    const bulletMatch = line.match(/^([•\-*✓✔►▸+]\s*|\d+\.\s+)(.+)$/u);
    if (bulletMatch) {
      const rawContent = bulletMatch[2].trim();
      const emojiInBullet = rawContent.match(/^([\p{Extended_Pictographic}])\s*(.+)$/u);
      if (emojiInBullet) {
        blocks.push({
          id: `b-${i}`,
          type: 'bullet',
          icon: emojiInBullet[1],
          content: emojiInBullet[2].trim(),
          isRTL
        });
      } else {
        blocks.push({
          id: `b-${i}`,
          type: 'bullet',
          icon: null,
          content: rawContent,
          isRTL
        });
      }
      continue;
    }

    // 5. Leading emoji item check
    const emojiMatch = line.match(/^([\p{Extended_Pictographic}])\s*(.+)$/u);
    if (emojiMatch) {
      blocks.push({
        id: `b-${i}`,
        type: 'callout',
        icon: emojiMatch[1],
        content: emojiMatch[2].trim(),
        isRTL
      });
      continue;
    }

    // 6. Standard paragraph
    blocks.push({
      id: `b-${i}`,
      type: 'paragraph',
      content: line,
      isRTL
    });
  }

  return blocks;
}

/**
 * Universal formatter for admin: organizes any run-on or unspaced text into clean lines
 */
export function formatRawDescriptionToStructured(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const blocks = parseSmartDescription(raw);
  if (!blocks || blocks.length === 0) return raw;

  const lines = [];

  for (const block of blocks) {
    if (block.type === 'banner') {
      lines.push(`✨ ${block.content} ✨`);
      lines.push('');
    } else if (block.type === 'key-value') {
      const prefix = block.icon ? `${block.icon} ` : '• ';
      lines.push(`${prefix}${block.key} : ${block.value}`);
    } else if (block.type === 'subheading') {
      lines.push('');
      lines.push(`• ${block.content} :`);
    } else if (block.type === 'bullet') {
      const prefix = block.icon ? `${block.icon} ` : '• ';
      lines.push(`${prefix}${block.content}`);
    } else if (block.type === 'callout') {
      lines.push(`${block.icon} ${block.content}`);
    } else {
      lines.push(block.content);
      lines.push('');
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Universal templates
 */
export const PRO_DESCRIPTION_TEMPLATE_FR = `✨ [Nom de l'article] – Qualité & Élégance ✨

Présentation claire et soignée de l'article, ses points forts et ses atouts pour le client.

• Caractéristique 1 : Description du point fort
• Caractéristique 2 : Détails techniques ou de conception
• Spécifications : Informations pratiques

🚚 Livraison : Disponible dans 58 Wilayas à domicile
🤝 Paiement : À la réception après vérification de votre commande
📞 Pour commander : 0561 70 34 16`;

export const PRO_DESCRIPTION_TEMPLATE_AR = `✨ [اسم المنتج] – جودة عالية وتصميم مميز ✨

تقديم أنيق وشامل للمنتج يوضح أبرز المميزات والفوائد التي يحصل عليها الزبون.

• الميزة الأولى : تفاصيل نقطة القوة
• المواصفات : الجودة، الخامة أو التفاصيل التقنية
• الاستعمال : مناسب وعملي للاستخدام اليومي

🚚 التوصيل : متوفر وسريع لباب المنزل
🤝 الدفع : عند الاستلام بعد معاينة الطلب
📞 للطلب والاستفسار : 0561 70 34 16`;
