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
import { formatPrice, validateDZPhone } from '../utils/formatters';
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

  // Validate form fields for Step 2 with strict Sanitization
  const validateForm = () => {
    const errs = {};
    const cleanName = sanitizeText(fullName, 100);
    const cleanPhone = sanitizePhone(phone);
    const cleanAddress = sanitizeText(address, 250);

    if (!cleanName) {
      errs.fullName = lang === 'ar' ? 'يرجى كتابة الاسم واللقب' : 'Le nom et prénom sont obligatoires.';
    }
    if (!cleanPhone) {
      errs.phone = lang === 'ar' ? 'رقم الهاتف مطلوب لتأكيد الطلب' : 'Le numéro de téléphone est obligatoire.';
    } else if (!validateDZPhone(cleanPhone)) {
      errs.phone = lang === 'ar' ? 'رقم غير صحيح (05/06/07 + 8 أرقام)' : 'Numéro invalide (05, 06 ou 07 + 8 chiffres).';
    }
    if (!cleanAddress) {
      errs.address = lang === 'ar' ? 'يرجى تحديد البلدية والعنوان بالتفصيل' : 'La commune et adresse de livraison sont obligatoires.';
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
      fullName: sanitizeText(fullName, 100),
      phone: sanitizePhone(phone),
      wilaya: currentWilaya.name,
      address: sanitizeText(address, 250),
      notes: sanitizeText(notes, 250)
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

    const sanitizedCustomer = {
      fullName: sanitizeText(fullName, 100) || 'Client Zoom Market',
      phone: sanitizePhone(phone) || 'Non renseigné',
      wilaya: currentWilaya.name,
      address: sanitizeText(address, 250) || 'À confirmer par WhatsApp',
      notes: sanitizeText(notes, 250)
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-brand-navy/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      {/* Drawer Container */}
      <div className={`fixed inset-y-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between z-50 overflow-hidden`}>
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-brand-navy text-white flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange text-white rounded-xl shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">{t.myCart}</h2>
              <p className="text-xs text-slate-300">
                {cartItems.length} {t.selectedArticles}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        {cartItems.length > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 px-4 py-2 flex items-center justify-between text-xs font-bold flex-shrink-0">
            <button
              type="button"
              onClick={() => setCheckoutStep(1)}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-lg transition-all ${
                checkoutStep === 1
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-orange'
              }`}
            >
              <span>{t.stepCart}</span>
              {checkoutStep === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            <span className="text-slate-400 font-normal">→</span>

            <button
              type="button"
              onClick={() => setCheckoutStep(2)}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-lg transition-all ${
                checkoutStep === 2
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-orange'
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
                      const itemTitle = (lang === 'ar' && item.titleAr) ? item.titleAr : item.title;
                      return (
                        <div key={item.id} className="pt-2 pb-3 flex items-center justify-between gap-3">
                          <img
                            src={item.images ? item.images[0] : item.image}
                            alt={itemTitle}
                            className="w-16 h-16 object-cover rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {itemTitle}
                            </h4>
                            <p className="text-xs text-brand-orange font-extrabold mt-0.5">
                              {formatPrice(item.price)}
                            </p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-90"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-black text-slate-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
                              onClick={() => onRemoveItem(item.id)}
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
                        <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
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
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={t.fullNamePlaceholder}
                          className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm border ${
                            errors.fullName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none`}
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      {errors.fullName && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3 h-3" /> {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.phone} <span className="text-brand-orange">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          maxLength={20}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t.phonePlaceholder}
                          className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm border ${
                            errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none`}
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t.phoneHint}
                      </p>
                      {errors.phone && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3 h-3" /> {errors.phone}
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
                          onChange={(e) => setSelectedWilayaCode(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none appearance-none cursor-pointer"
                        >
                          {WILAYAS.map((w) => (
                            <option key={w.code} value={w.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {w.name} — ({formatPrice(w.fee)} livraison)
                            </option>
                          ))}
                        </select>
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange" />
                      </div>
                    </div>

                    {/* Commune & Adresse */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.address} <span className="text-brand-orange">*</span>
                      </label>
                      <textarea
                        maxLength={250}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        placeholder={t.addressPlaceholder}
                        className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs sm:text-sm border ${
                          errors.address ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                        } text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none`}
                      />
                      {errors.address && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3 h-3" /> {errors.address}
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
