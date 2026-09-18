import React from 'react';
import Logo from './Logo';
import { Truck, ShieldCheck, PhoneCall, Mail, MapPin } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';
import { formatDZPhoneDisplay } from '../utils/formatters';

export default function Footer({ onCategorySelect, storePhone, recipientEmail, onOpenAdminLogin, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  return (
    <footer className="bg-brand-navy text-white pt-16 pb-8 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/20 text-brand-orange flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">{t.footerNotice1}</h4>
              <p className="text-xs text-slate-400">{t.footerNotice1Desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">{t.footerNotice2}</h4>
              <p className="text-xs text-slate-400">{t.footerNotice2Desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">{t.footerNotice3}</h4>
              <p className="text-xs text-slate-400">{t.footerNotice3Desc}</p>
            </div>
          </div>
        </div>

        {/* Footer Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Logo isDarkBg={true} />
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footerAbout}
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <MapPin className="w-4 h-4 text-brand-orange" />
              <span>{t.nationalCoverage}</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-orange">
              {t.categoriesHeader}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 font-medium">
              {['High-Tech', 'Électronique', 'Mode & Habillement', 'Maison & Déco', 'Beauté & Santé'].map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => onCategorySelect(cat)}
                    className="hover:text-brand-orange transition-colors"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-orange">
              {t.contactSupport}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${recipientEmail}`} className="hover:text-brand-orange transition-colors">
                  {recipientEmail || 'marketdzzoom@gmail.com'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-slate-400 shrink-0" />
                <a 
                  href={`tel:${(storePhone && storePhone !== '0550000000' && storePhone !== '0550 00 00 00' ? storePhone : '+213663085069').replace(/\s+/g, '')}`} 
                  dir="ltr"
                  className="hover:text-brand-orange transition-colors font-bold text-white [direction:ltr]"
                >
                  <bdi dir="ltr">{formatDZPhoneDisplay(storePhone && storePhone !== '0550000000' && storePhone !== '0550 00 00 00' ? storePhone : '0663085069')}</bdi>
                </a>
              </li>
            </ul>
          </div>

          {/* Order Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-orange">
              {t.securityGuarantee}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.securityDesc}
            </p>
          </div>
        </div>

        {/* Bottom Copyright & Discreet Secret Trigger */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Zoom Market Dz. {t.allRightsReserved}</p>
          
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1">
              {t.madeWithLove}
            </p>
            {/* Secret Discreet Trigger Dot (Only known to the admin) */}
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-slate-700 hover:text-slate-500 cursor-default select-none transition-colors p-1"
              title=""
            >
              •
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
