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
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2,
  ShieldAlert
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
import { 
  sanitizeText, 
  sanitizePhone, 
  verifyHumanSubmission, 
  checkOrderRateLimit, 
  recordOrderTimestamp 
} from '../utils/sanitizer';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  emailConfig,
  lang = 'fr',
  initialStep = 1
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Checkout Step: 1 = Cart Review, 2 = Shipping & Confirmation
  const [checkoutStep, setCheckoutStep] = useState(initialStep);

  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16'); // Default 16 - Alger
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneBackup, setPhoneBackup] = useState('');
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
      setCheckoutStep(initialStep);
      setFormOpenedAt(Date.now());
      setSecurityError('');
    }
  }, [isOpen, initialStep]);

  // Get current selected wilaya object
  const currentWilaya = WILAYAS.find(w => w.code === selectedWilayaCode) || WILAYAS[15];
  const shippingFee = currentWilaya ? currentWilaya.fee : 400;

  // Calculate Subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + shippingFee;

  // Validate form fields for Step 2 with strict Sanitization and Anti-Fake checks
  const validateForm = () => {
    const errs = {};
    const cleanName = sanitizeText(fullName, 100).trim();
    const cleanPhone = sanitizePhone(phone);
    const cleanPhoneBackup = sanitizePhone(phoneBackup);
    const cleanAddress = sanitizeText(address, 250).trim();

    // 1. Nom & Prénom: Minimum 3 characters, must contain actual letters (Latin or Arabic), not only numbers/symbols
    if (!cleanName || cleanName.length < 3 || !/[\p{L}]/u.test(cleanName)) {
      errs.fullName = t.errFullName || (lang === 'ar' ? 'يرجى كتابة الاسم واللقب (3 أحرف على الأقل)' : 'Le nom et prénom sont obligatoires (au moins 3 lettres).');
    }

    // 2. Téléphone principal: Mandatory, strictly 10 digits starting with 05/06/07 (or landlines), anti-fake sequence & repeating check
    if (!cleanPhone) {
      errs.phone = lang === 'ar' ? 'رقم الهاتف مطلوب لتأكيد الطلب' : 'Le numéro de téléphone est obligatoire.';
    } else if (!validateDZPhone(cleanPhone)) {
      errs.phone = t.errPhone || (lang === 'ar' ? 'رقم هاتف جزائري غير صحيح أو تجريبي (05/06/07 + 8 أرقام)' : 'Numéro algérien invalide ou fictif (05, 06 ou 07 + 8 chiffres réels).');
    }

    // 3. Téléphone secondaire (Optionnel): If provided, must also be a valid DZ number and different from primary
    if (cleanPhoneBackup) {
      if (!validateDZPhone(cleanPhoneBackup)) {
        errs.phoneBackup = t.errPhoneBackup || (lang === 'ar' ? 'رقم الهاتف الثانوي غير صحيح (05/06/07 + 8 أرقام)' : 'Numéro secondaire invalide (05, 06 ou 07 + 8 chiffres réels).');
      } else if (normalizeDZPhone(cleanPhoneBackup) === normalizeDZPhone(cleanPhone)) {
        errs.phoneBackup = t.errPhoneBackupSame || (lang === 'ar' ? 'يجب أن يكون الرقم الثاني مختلفاً عن الرقم الأول' : 'Le numéro secondaire doit être différent du numéro principal.');
      }
    }

    // 4. Wilaya: Mandatory
    if (!selectedWilayaCode) {
      errs.wilaya = t.errWilaya || (lang === 'ar' ? 'يرجى اختيار الولاية' : 'Veuillez sélectionner une wilaya.');
    }

    // 5. Commune & Adresse détaillée: Mandatory, minimum 5 characters
    if (!cleanAddress || cleanAddress.length < 5) {
      errs.address = t.errAddress || (lang === 'ar' ? 'يرجى إدخال البلدية والعنوان بالتفصيل (5 أحرف على الأقل)' : 'La commune et l\'adresse détaillée sont obligatoires (au moins 5 caractères).');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Submit Order via EmailJS / FormSubmit + Anti-Bot & Anti-Spam Security
  const handleSubmitOrder = async (e) => {
    e?.preventDefault?.();
    setSecurityError('');

    if (cartItems.length === 0) return;
    if (!validateForm()) return;

    // 1. Anti-Bot Honeypot & Timing Check
    const botCheck = verifyHumanSubmission({
      honeypotField: honeypotTrap,
      formOpenedAt,
      minDurationMs: 1200
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
      phoneBackup: phoneBackup ? formatDZPhoneDisplay(phoneBackup) : '',
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

    try {
      await sendOrderNotification({ orderData, emailConfig });
      setLoading(false);
      
      onOrderSuccess({
        orderData,
        whatsappUrl: generateWhatsAppOrderUrl(orderData, emailConfig.storePhone)
      });
      
      setFullName('');
      setPhone('');
      setPhoneBackup('');
      setAddress('');
      setNotes('');
      setErrors({});
      setCheckoutStep(1);
    } catch (err) {
      console.error('Order error:', err);
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (cartItems.length === 0) return;

    // If user is currently in Step 1 (cart review), navigate to Step 2 so customer information can be entered
    if (checkoutStep === 1) {
      setCheckoutStep(2);
      return;
    }

    // On Step 2, strictly validate: fake orders cannot bypass validation via WhatsApp!
    if (!validateForm()) return;

    const sanitizedCustomer = {
      fullName: sanitizeText(fullName, 100).trim(),
      phone: formatDZPhoneDisplay(phone),
      phoneBackup: phoneBackup ? formatDZPhoneDisplay(phoneBackup) : '',
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

    addOrderToStorage(orderData);
    recordOrderTimestamp();

    const waUrl = generateWhatsAppOrderUrl(orderData, emailConfig.storePhone);
    window.open(waUrl, '_blank');
  };

  // Real-time Algerian carrier detection & phone validity
  const phoneCarrier = getDZPhoneCarrier(phone);
  const isPhoneValid = validateDZPhone(phone);
  const backupCarrier = phoneBackup ? getDZPhoneCarrier(phoneBackup) : null;
  const isBackupValid = phoneBackup ? validateDZPhone(phoneBackup) : false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-brand-navy/70 backdrop-blur-md overflow-hidden animate-fadeIn">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      {/* Centered Modal / Sheet Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-slideUpModal"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300/80 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white flex items-center justify-between shadow-sm flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-orange text-white rounded-xl shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                {checkoutStep === 1 ? t.myCart : t.stepShipping}
              </h2>
              <p className="text-xs text-slate-300">
                {cartItems.length} {t.selectedArticles} • Zoom Market Dz
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

        {/* Step Progress Indicators */}
        {cartItems.length > 0 && (
          <div className="bg-slate-100/90 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-bold flex-shrink-0">
            <button
              type="button"
              onClick={() => setCheckoutStep(1)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
                checkoutStep === 1
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'bg-white/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-orange'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t.stepCart}</span>
              {checkoutStep === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            <span className="text-slate-400 font-bold px-1">→</span>

            <button
              type="button"
              onClick={() => setCheckoutStep(2)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
                checkoutStep === 2
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'bg-white/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-orange'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{t.stepShipping}</span>
            </button>
          </div>
        )}

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
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
              {/* STEP 1: CART ITEMS REVIEW */}
              {checkoutStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t.selectedArticles} ({cartItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.clearCart}
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
                    {cartItems.map((item) => {
                      const itemKey = item.cartItemId || item.id;
                      const itemTitle = (lang === 'ar' && item.titleAr) ? item.titleAr : item.title;
                      return (
                        <div key={itemKey} className="pt-2 pb-3 flex items-center justify-between gap-3">
                          <img
                            src={item.images ? item.images[0] : item.image}
                            alt={itemTitle}
                            className="w-16 h-16 object-cover rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {itemTitle}
                            </h4>

                            {/* Chosen Variants: Size & Color */}
                            {(item.selectedSize || item.selectedColor) && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                {item.selectedSize && (
                                  <span className="text-[10px] font-bold bg-brand-orange/10 text-brand-orange dark:bg-brand-orange/20 px-2 py-0.5 rounded border border-brand-orange/30">
                                    {t.size || 'Taille'}: {item.selectedSize}
                                  </span>
                                )}
                                {item.selectedColor && (
                                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded">
                                    {t.color || 'Couleur'}: {item.selectedColor}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-brand-orange font-extrabold mt-1">
                              {formatPrice(item.price)}
                            </p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-90"
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
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end justify-between h-16 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => onRemoveItem(itemKey)}
                              className="text-slate-400 hover:text-red-500 p-1 active:scale-90"
                              title="Supprimer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trust Banner */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-extrabold block">{t.codNotice}</span>
                      <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-normal">
                        {t.shipping69}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: EXPRESS SHIPPING FORM */}
              {checkoutStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 active:scale-95"
                    >
                      {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                      <span>{t.backToCart}</span>
                    </button>

                    <span className="text-xs font-semibold text-slate-500">
                      {cartItems.length} {t.selectedArticles}
                    </span>
                  </div>

                  {/* Visual Items Recap in Step 2 */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t.yourOrder}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(1)}
                        className="text-[11px] font-bold text-brand-orange hover:underline"
                      >
                        {t.modify}
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                      {cartItems.map((item) => (
                        <div key={item.cartItemId || item.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.images?.[0] || item.image}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px] sm:text-xs">
                                {lang === 'ar' && item.titleAr ? item.titleAr : item.title}
                              </p>
                              {(item.selectedSize || item.selectedColor) && (
                                <p className="text-[10px] font-bold text-brand-orange truncate">
                                  {[item.selectedSize ? `${t.size || 'Taille'}: ${item.selectedSize}` : '', item.selectedColor ? `${t.color || 'Couleur'}: ${item.selectedColor}` : ''].filter(Boolean).join(' • ')}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                Qté: {item.quantity} × {formatPrice(item.price)}
                              </p>
                            </div>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white flex-shrink-0 text-xs">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Anti-Fake Trust & Safety Notice */}
                  <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed font-semibold">
                      {t.antiFakeNotice}
                    </p>
                  </div>

                  <form onSubmit={handleSubmitOrder} className="space-y-3.5">
                    
                    {/* Anti-Bot Honeypot Hidden Input Field */}
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

                    {/* Téléphone Secondaire (Optionnel) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {t.phoneSecondary}
                        </label>
                        <div className="flex items-center gap-1.5">
                          {backupCarrier && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${backupCarrier.bg} ${backupCarrier.color}`}>
                              {backupCarrier.name}
                            </span>
                          )}
                          {isBackupValid && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>{t.phoneConforme}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="tel"
                          maxLength={18}
                          value={phoneBackup}
                          onChange={(e) => {
                            setPhoneBackup(e.target.value);
                            if (errors.phoneBackup) setErrors((prev) => ({ ...prev, phoneBackup: undefined }));
                          }}
                          placeholder={t.phoneSecondaryPlaceholder}
                          className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm border ${
                            errors.phoneBackup 
                              ? 'border-red-500 ring-1 ring-red-500/20' 
                              : isBackupValid 
                              ? 'border-emerald-500' 
                              : 'border-slate-200 dark:border-slate-700'
                          } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none`}
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {errors.phoneBackup && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.phoneBackup}
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

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {t.notes}
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t.notesPlaceholder}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                      />
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Sticky Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 space-y-3 flex-shrink-0 shadow-lg">
            
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
                <span className="text-brand-orange text-base sm:text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Actions according to step */}
            <div className="space-y-2 pt-1">
              {checkoutStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-xl hover:shadow-glow transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>{t.proceedToCheckout} ({formatPrice(total)})</span>
                    {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t.orderViaWhatsApp}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-xl hover:shadow-glow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t.confirmOrder} ({formatPrice(total)})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t.orderViaWhatsApp}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
