import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Truck, 
  Send, 
  MessageSquare, 
  AlertCircle, 
  MapPin, 
  User, 
  Phone, 
  ShieldCheck, 
  CheckCircle2,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { WILAYAS } from '../data/wilayas';
import { 
  formatPrice, 
  validateDZPhone, 
  normalizeDZPhone, 
  getDZPhoneCarrier, 
  formatDZPhoneDisplay 
} from '../utils/formatters';
import { sendOrderNotification, generateWhatsAppOrderUrl } from '../utils/email';
import { TRANSLATIONS } from '../data/translations';
import { addOrderToStorage } from '../utils/storage';
import { pushSingleOrderToCloud } from '../utils/cloudSync';
import { 
  sanitizeText, 
  sanitizePhone, 
  verifyHumanSubmission, 
  checkOrderRateLimit, 
  recordOrderTimestamp 
} from '../utils/sanitizer';
import { getColorStyle } from '../utils/colors';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItemVariant,
  onClearCart,
  onOrderSuccess,
  emailConfig,
  lang = 'fr'
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16'); // Default 16 - Alger
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Security Honeypot & Timestamp
  const [honeypotTrap, setHoneypotTrap] = useState('');
  const [formOpenedAt, setFormOpenedAt] = useState(() => Date.now());

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormOpenedAt(Date.now());
      setSecurityError('');
    }
  }, [isOpen]);

  // Get current selected wilaya object
  const currentWilaya = WILAYAS.find(w => w.code === selectedWilayaCode) || WILAYAS[15];
  const shippingFee = currentWilaya ? currentWilaya.fee : 400;

  // Calculate Subtotal & Total
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + shippingFee;

  // Validate form fields with strict Algerian phone & sanitization checks
  const validateForm = () => {
    const errs = {};
    const cleanName = sanitizeText(fullName, 100).trim();
    const cleanPhone = sanitizePhone(phone);
    const cleanAddress = sanitizeText(address, 250).trim();

    // 1. Nom & Prénom: Minimum 3 characters, must contain actual letters
    if (!cleanName || cleanName.length < 3 || !/[\p{L}]/u.test(cleanName)) {
      errs.fullName = t.errFullName || (lang === 'ar' ? 'يرجى كتابة الاسم واللقب (3 أحرف على الأقل)' : 'Le nom et prénom sont obligatoires (au moins 3 lettres).');
    }

    // 2. Téléphone principal: Mandatory, DZ format 05/06/07
    if (!cleanPhone) {
      errs.phone = lang === 'ar' ? 'رقم الهاتف مطلوب لتأكيد الطلب' : 'Le numéro de téléphone est obligatoire.';
    } else if (!validateDZPhone(cleanPhone)) {
      errs.phone = t.errPhone || (lang === 'ar' ? 'رقم هاتف جزائري غير صحيح أو تجريبي (05/06/07 + 8 أرقام)' : 'Numéro algérien invalide ou fictif (05, 06 ou 07 + 8 chiffres réels).');
    }

    // 3. Wilaya: Mandatory
    if (!selectedWilayaCode) {
      errs.wilaya = t.errWilaya || (lang === 'ar' ? 'يرجى اختيار الولاية' : 'Veuillez sélectionner une wilaya.');
    }

    // 5. Commune & Adresse détaillée: Mandatory, min 5 chars
    if (!cleanAddress || cleanAddress.length < 5) {
      errs.address = t.errAddress || (lang === 'ar' ? 'يرجى إدخال البلدية والعنوان بالتفصيل (5 أحرف على الأقل)' : 'La commune et l\'adresse détaillée sont obligatoires (au moins 5 caractères).');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Submit Order (Express 1-step confirmation)
  const handleSubmitOrder = async (e) => {
    e?.preventDefault?.();
    setSecurityError('');

    if (cartItems.length === 0) return;
    if (!validateForm()) return;

    // 1. Anti-Bot Honeypot & Timing Check
    const botCheck = verifyHumanSubmission({
      honeypotField: honeypotTrap,
      formOpenedAt,
      minDurationMs: 1000
    });

    if (!botCheck.isHuman) {
      setSecurityError('Vérification de sécurité échouée. Veuillez réessayer.');
      return;
    }

    // 2. Anti-Spam Rate Limiter Check (Max 1 order per 20 seconds)
    const rateCheck = checkOrderRateLimit(20);
    if (!rateCheck.allowed) {
      setSecurityError(rateCheck.message);
      return;
    }

    setLoading(true);

    const sanitizedCustomer = {
      fullName: sanitizeText(fullName, 100).trim(),
      phone: formatDZPhoneDisplay(phone),
      phoneBackup: '',
      wilaya: currentWilaya.name,
      address: sanitizeText(address, 250).trim(),
      notes: sanitizeText(notes, 250).trim()
    };

    const orderData = {
      customer: sanitizedCustomer,
      items: cartItems,
      subtotal,
      shippingFee,
      total,
      date: new Date().toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ')
    };

    // Save order locally for Admin listing
    addOrderToStorage(orderData);
    recordOrderTimestamp();

    // Auto-sync order to Cloud/Firebase in background (instant cross-device sync)
    pushSingleOrderToCloud(orderData).catch((err) => {
      console.warn('Cloud order push error:', err);
    });

    const waUrl = generateWhatsAppOrderUrl(orderData, emailConfig.storePhone, lang);

    // 1. Systematic immediate dispatch to WhatsApp with all customer coordinates & order details
    try {
      const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = waUrl;
      } else {
        const waWin = window.open(waUrl, '_blank');
        if (!waWin || waWin.closed || typeof waWin.closed === 'undefined') {
          window.location.href = waUrl;
        }
      }
    } catch (openErr) {
      console.warn('Popup open error, using href fallback:', openErr);
      window.location.href = waUrl;
    }

    // 2. Dispatch background email notification without blocking UI
    sendOrderNotification({ orderData, emailConfig }).catch((err) => {
      console.warn('Background email dispatch error:', err);
    });

    setLoading(false);

    onOrderSuccess({
      orderData,
      whatsappUrl: waUrl
    });

    setFullName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setErrors({});
  };

  // Handle WhatsApp Order (Direct 1-step validation & WhatsApp dispatch)
  const handleWhatsAppOrder = (e) => {
    e?.preventDefault?.();
    handleSubmitOrder(e);
  };

  // Real-time Algerian carrier detection & phone validity
  const phoneCarrier = getDZPhoneCarrier(phone);
  const isPhoneValid = validateDZPhone(phone);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-brand-navy/70 backdrop-blur-md overflow-hidden animate-fadeIn">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      {/* Centered Modal / Sheet Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between max-h-[94vh] sm:max-h-[90vh] overflow-hidden animate-slideUpModal"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300/80 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

        {/* Top Header - Express 1-Step Checkout */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white flex items-center justify-between shadow-sm flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-orange text-white rounded-xl shadow-md flex items-center justify-center">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg leading-tight">
                  {t.expressCheckout || 'Finaliser ma Commande Express'}
                </h2>
                <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  {lang === 'ar' ? 'خطوة واحدة فقط' : '1 seule étape'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {cartItems.length} {t.selectedArticles} • {t.codBadge || 'Paiement à la livraison 🇩🇿'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-95"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content - Single Continuous Page */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {securityError && (
            <div className="p-3 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200 dark:border-red-900">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{securityError}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t.emptyCart}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mb-6">
                {t.emptyCartDesc}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {t.exploreProducts}
              </button>
            </div>
          ) : (
            <>
              {/* SECTION 1: ARTICLES DU PANIER & CHOIX DES VARIANTES */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-850/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[11px] font-black flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                      {lang === 'ar' ? 'المنتجات المطلوبة وخياراتك' : 'Vos Articles & Préférences'} ({cartItems.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearCart}</span>
                  </button>
                </div>

                {/* Items List with Instant Variant Selection */}
                <div className="divide-y divide-slate-200/70 dark:divide-slate-800 space-y-3">
                  {cartItems.map((item) => {
                    const itemKey = item.cartItemId || item.id;
                    const itemTitle = (lang === 'ar' && item.titleAr) ? item.titleAr : item.title;
                    const availableSizes = (item.sizes && item.sizes.length > 0)
                      ? item.sizes
                      : ['39', '40', '41', '42', '43', '44', '45'];
                    const availableColors = (item.colors && item.colors.length > 0)
                      ? item.colors
                      : ['Noir', 'Blanc', 'Gris', 'Bleu Marine', 'Rouge'];

                    const hasVariants = (item.sizes && item.sizes.length > 0) || (item.colors && item.colors.length > 0);

                    return (
                      <div key={itemKey} className="pt-3 first:pt-0 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <img
                            src={item.images ? item.images[0] : item.image}
                            alt={itemTitle}
                            className="w-16 h-16 sm:w-18 sm:h-18 object-cover rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                              {itemTitle}
                            </h4>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-brand-orange font-black">
                                {formatPrice(item.price)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                × {item.quantity} =
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-90"
                                  title="Diminuer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-black text-slate-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-90"
                                  title="Augmenter"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {(item.selectedSize || item.selectedColor) && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  {item.selectedSize && (
                                    <span className="bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded border border-brand-orange/30">
                                      {item.selectedSize}
                                    </span>
                                  )}
                                  {item.selectedColor && (() => {
                                    const cStyle = getColorStyle(item.selectedColor);
                                    return (
                                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                                        <span
                                          className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${cStyle.isLight ? 'border border-slate-400' : ''}`}
                                          style={{ background: cStyle.background }}
                                        />
                                        <span>{item.selectedColor}</span>
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(itemKey)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 active:scale-90 transition-colors"
                            title="Supprimer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Interactive 1-Tap Variant Selection directly inside the row */}
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                          
                          {/* Pointure / Taille */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <span>👟</span>
                                <span>{t.size || 'Pointure / Taille'} :</span>
                              </span>
                              {item.selectedSize ? (
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>{item.selectedSize}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded">
                                  {lang === 'ar' ? 'حدد المقاس' : 'Choisissez'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {availableSizes.map((sz) => {
                                const isSel = item.selectedSize === sz;
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => onUpdateItemVariant && onUpdateItemVariant(itemKey, { selectedSize: sz })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all active:scale-95 border ${
                                      isSel
                                        ? 'bg-brand-orange text-white border-brand-orange shadow-xs scale-105 ring-2 ring-brand-orange/30'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-orange/60'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Couleur */}
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <span>🎨</span>
                                <span>{t.color || 'Couleur'} :</span>
                              </span>
                              {item.selectedColor ? (() => {
                                const cStyle = getColorStyle(item.selectedColor);
                                return (
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span
                                      className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${cStyle.isLight ? 'border border-slate-400' : ''}`}
                                      style={{ background: cStyle.background }}
                                    />
                                    <span>{item.selectedColor}</span>
                                  </span>
                                );
                              })() : (
                                <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded">
                                  {lang === 'ar' ? 'حدد اللون' : 'Choisissez'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {availableColors.map((col) => {
                                const isSel = item.selectedColor === col;
                                const cStyle = getColorStyle(col);
                                return (
                                  <button
                                    key={col}
                                    type="button"
                                    onClick={() => onUpdateItemVariant && onUpdateItemVariant(itemKey, { selectedColor: col })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 border flex items-center gap-1.5 ${
                                      isSel
                                        ? 'bg-slate-900 dark:bg-brand-orange text-white border-slate-900 dark:border-brand-orange shadow-xs scale-105 ring-2 ring-brand-orange/40'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-orange/60'
                                    }`}
                                  >
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 transition-transform ${
                                        isSel ? 'scale-110 ring-1 ring-white/80' : ''
                                      } ${cStyle.isLight ? 'border border-slate-400' : ''}`}
                                      style={{ background: cStyle.background }}
                                    />
                                    <span>{col}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: INFORMATIONS DE LIVRAISON */}
              <div className="space-y-4 bg-white dark:bg-slate-850/90 p-4 rounded-2xl border-2 border-brand-orange/30 shadow-sm">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[11px] font-black flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                      {t.shippingInfo || 'Coordonnées de Livraison (Algérie 🇩🇿)'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'دفع عند الاستلام' : 'Paiement à la livraison'}</span>
                  </span>
                </div>

                {/* Anti-Fake Safety Alert */}
                <div className="p-2.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed font-semibold">
                    {t.antiFakeNotice}
                  </p>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-3.5">
                  
                  {/* Anti-Bot Honeypot Hidden Input */}
                  <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                    <label htmlFor="website_url_hp">Leave this field blank</label>
                    <input
                      type="text"
                      id="website_url_hp"
                      name="website_url_hp"
                      tabIndex="-1"
                      autoComplete="off"
                      value={honeypotTrap}
                      onChange={(e) => setHoneypotTrap(e.target.value)}
                    />
                  </div>

                  {/* Nom & Prénom */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.fullName} <span className="text-brand-orange">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={80}
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                        }}
                        placeholder={t.fullNamePlaceholder}
                        className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm border ${
                          errors.fullName ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-700'
                        } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none`}
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    {errors.fullName && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Téléphone Principal */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t.phone} <span className="text-brand-orange">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {phoneCarrier && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${phoneCarrier.bg} ${phoneCarrier.color}`}>
                            {phoneCarrier.name}
                          </span>
                        )}
                        {isPhoneValid && (
                          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{t.phoneConforme}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        maxLength={18}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                        placeholder={t.phonePlaceholder}
                        className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm border ${
                          errors.phone 
                            ? 'border-red-500 ring-1 ring-red-500/20' 
                            : isPhoneValid 
                            ? 'border-emerald-500 ring-1 ring-emerald-500/20' 
                            : 'border-slate-200 dark:border-slate-700'
                        } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none`}
                      />
                      <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isPhoneValid ? 'text-emerald-500' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t.phoneHint}
                    </p>
                    {errors.phone && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Wilaya Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.wilaya} <span className="text-brand-orange">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedWilayaCode}
                        onChange={(e) => {
                          setSelectedWilayaCode(e.target.value);
                          if (errors.wilaya) setErrors((prev) => ({ ...prev, wilaya: undefined }));
                        }}
                        className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold border ${
                          errors.wilaya ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-700'
                        } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none appearance-none cursor-pointer`}
                      >
                        {WILAYAS.map((w) => (
                          <option key={w.code} value={w.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {w.name} — ({formatPrice(w.fee)} livraison)
                          </option>
                        ))}
                      </select>
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange" />
                    </div>
                    {errors.wilaya && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.wilaya}
                      </p>
                    )}
                  </div>

                  {/* Commune & Adresse */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.address} <span className="text-brand-orange">*</span>
                    </label>
                    <textarea
                      maxLength={250}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                      }}
                      rows={2}
                      placeholder={t.addressPlaceholder}
                      className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm border ${
                        errors.address ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-700'
                      } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none`}
                    />
                    {errors.address && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.address}
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Footer - Single Action to Validate */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-800 space-y-3 flex-shrink-0 shadow-xl">
            
            {/* Price Calculations */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.shippingFee} ({currentWilaya.name}) :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>{t.totalToPay}</span>
                <span className="text-brand-orange text-base sm:text-xl font-black">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Direct 1-Step Giant Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={loading}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base shadow-xl hover:shadow-glow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    <span>{t.confirmOrder} • {formatPrice(total)}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.orderViaWhatsApp}</span>
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'ar'
                  ? '⚡ يتم فتح تطبيق واتساب تلقائياً عند الضغط لإرسال معلومات طلبيتكم مباشرة'
                  : '⚡ WhatsApp s\'ouvre automatiquement pour transmettre vos coordonnées directement'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
