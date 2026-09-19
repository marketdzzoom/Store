import React, { useEffect } from 'react';
import { CheckCircle2, MessageSquare, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPrice } from '../utils/formatters';
import { TRANSLATIONS } from '../data/translations';

export default function SuccessModal({ isOpen, onClose, data, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const { orderData, whatsappUrl } = data;
  const { customer, items, total } = orderData;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-brand-navy/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative p-6 sm:p-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Checkmark SVG Icon */}
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500/20 shadow-inner animate-bounce">
          <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
          {t.orderSuccessTitle}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {t.orderSuccessMsg} <strong className="text-brand-orange">{customer.wilaya}</strong>.
        </p>

        {/* Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-left text-xs space-y-2 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-500">{t.recipient}</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{customer.fullName} ({customer.phone})</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-500">{t.address}:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{customer.address} ({customer.wilaya})</span>
          </div>

          <div className="pt-1">
            <span className="font-bold text-slate-500 block mb-1">{t.itemsCount} ({items.length}):</span>
            <ul className="space-y-1 pl-2 text-slate-700 dark:text-slate-300">
              {items.map((it, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>• {it.title} x{it.quantity}</span>
                  <span className="font-bold">{formatPrice(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
            <span>{t.totalOnDelivery}</span>
            <span className="text-brand-orange">{formatPrice(total)}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2.5">
          {whatsappUrl && (
            <div className="space-y-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{lang === 'ar' ? '📱 فتح محادثة واتساب (WhatsApp)' : '📱 Ouvrir la conversation WhatsApp'}</span>
              </a>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'تم توجيهكم تلقائياً لتطبيق واتساب. اضغط على الزر أعلاه إذا لم تفتح المحادثة.'
                  : 'Vous avez été redirigé vers WhatsApp. Cliquez ci-dessus si la discussion ne s\'est pas ouverte.'}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-brand-navy dark:bg-slate-800 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all"
          >
            {t.continueShopping}
          </button>
        </div>
      </div>
    </div>
  );
}
