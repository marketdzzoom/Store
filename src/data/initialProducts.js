export const INITIAL_PRODUCTS = [
  {
    id: "prod-ugg",
    title: "Chaussures UGG",
    titleAr: "حذاء UGG نسائي أنيق وعصري",
    price: 5900,
    oldPrice: 7500,
    category: "Mode & Habillement",
    badge: "Offre Spéciale",
    description: `✨ Chaussures UGG pour femme – Élégance & Confort Moderne ✨

L'alliance parfaite entre bien-être absolu, chaleur et style tendance pour votre quotidien.

Conception orthopédique : Semelle ergonomique ultra-confortable, idéale pour la marche et un usage quotidien sans fatigue.

Couleurs disponibles :
- 🤍 Beige
- 🤎 Marron
- 🖤 Noir

Pointures : Du 37 au 40

Livraison : Rapide et disponible directement à domicile 🚚

Paiement : À la réception après vérification de votre commande 🤝

📞 Pour commander ou pour toute information :
0663 08 50 69`,
    descriptionAr: `✨ حذاء UGG نسائي أنيق وعصري ✨

يجمع بين الراحة الفائقة، المظهر العصري الجذاب، والدفء المثالي لإطلالتك اليومية.

تصميم UGG طبي أصلي (Orthopédique): حذاء مريح جداً ومثالي للمشي والاستعمال اليومي مع راحة تامة للقدمين دون أي تعب.

• الألوان المتوفرة :
🤍 بيج (Beige)
🤎 بني (Marron)
🖤 أسود (Noir)

• المقاسات المتوفرة : من 37 إلى 40
• التوصيل : متوفر وسريع حتى باب المنزل 🚚
• الدفع : عند الاستلام بعد معاينة المنتج 🤝

📞 للطلب والاستفسار، يرجى الاتصال أو إرسال رسالة عبر واتساب: 0663085069`,
    image: "./products/ugg-1.jpg",
    images: [
      "./products/ugg-1.jpg",
      "./products/ugg-2.jpg",
      "./products/ugg-3.jpg",
      "./products/ugg-4.jpg",
      "./products/ugg-5.jpg",
      "./products/ugg-6.jpg",
      "./products/ugg-7.jpg",
      "./products/ugg-8.jpg"
    ],
    colors: ["Beige", "Marron", "Noir"],
    colorImageMap: {
      "Beige": 0,
      "Marron": 6,
      "Noir": 3
    },
    sizes: ["37", "38", "39", "40"],
    inStock: true,
    stockQuantity: 100,
    isVisible: true,
    rating: 4.9,
    reviewsCount: 48
  }
];

export const CATEGORIES = [
  "Tous",
  "Mode & Habillement",
  "High-Tech",
  "Électronique",
  "Maison & Déco",
  "Beauté & Santé",
  "Accessoires"
];
