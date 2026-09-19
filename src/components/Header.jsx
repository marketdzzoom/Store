import React, { useState } from 'react';
import { 
  Search, 
  ShoppingBag, 
  PlusCircle, 
  Moon, 
  Sun, 
  Settings, 
  X, 
  Truck, 
  ShieldCheck, 
  PhoneCall,
  SlidersHorizontal,
  Globe,
  Unlock,
  LogOut,
  Package
} from 'lucide-react';
import Logo from './Logo';
import { TRANSLATIONS, CATEGORY_MAP_AR } from '../data/translations';
import { formatDZPhoneDisplay } from '../utils/formatters';

export default function Header({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenEmailConfig,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onAdminLogout,
  darkMode,
  setDarkMode,
  storePhone,
  lang,
  setLang
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const [logoTapCount, setLogoTapCount] = useState(0);

  // Stealth Admin Trigger: 3 rapid taps on Logo opens Admin PIN modal
  const handleLogoClick = () => {
    setSearchTerm('');
    setSelectedCategory('Tous');

    setLogoTapCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        onOpenAdminLogin();
        return 0;
      }
      return next;
    });

    setTimeout(() => setLogoTapCount(0), 1500);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-brand-navy/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-sm">
      
      {/* Admin Logged-In Control Bar Banner (Only visible AFTER secret PIN login) */}
      {isAdminLoggedIn && (
        <div className="bg-emerald-700 text-white text-xs py-1.5 px-4 font-bold flex items-center justify-between shadow-md dir-ltr">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Mode Administrateur Actif (Zoom Market Dz)</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-bold"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Gestion Magasin</span>
            </button>

            <button
              type="button"
              onClick={onOpenEmailConfig}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors text-xs font-bold"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Paramètres</span>
            </button>

            <button
              type="button"
              onClick={onAdminLogout}
              className="bg-red-800 hover:bg-red-900 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors text-xs font-bold"
              title="Quitter le mode Administrateur"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Announcement */}
      <div className="bg-brand-navy dark:bg-slate-950 text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-4 text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 text-brand-orange font-semibold">
              <Truck className="w-3.5 h-3.5" />
              {t.deliveryNotice}
            </span>
            <span className="hidden md:inline-block text-slate-600">•</span>
            <span className="hidden md:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {t.codNotice}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300 font-medium text-[11px]">
            <a 
              href={`tel:${(storePhone && storePhone !== '0550000000' && storePhone !== '0550 00 00 00' && !storePhone.includes('663') ? storePhone : '+213561703416').replace(/\s+/g, '')}`} 
              dir="ltr"
              className="flex items-center gap-1 hover:text-brand-orange transition-colors [direction:ltr]"
              title="Appeler le service client"
            >
              <PhoneCall className="w-3 h-3 text-brand-orange shrink-0" />
              <span>{t.clientService} <strong className="text-white [direction:ltr] [unicode-bidi:isolate]" dir="ltr"><bdi dir="ltr">{formatDZPhoneDisplay(storePhone && storePhone !== '0550000000' && storePhone !== '0550 00 00 00' && !storePhone.includes('663') ? storePhone : '0561703416')}</bdi></strong></span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo with Secret Triple-Tap Handler */}
          <div onClick={handleLogoClick} className="cursor-pointer select-none">
            <Logo />
          </div>

          {/* Search Bar - Desktop & Tablet */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                id="desktop-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-full border border-transparent focus:border-brand-orange focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 text-sm transition-all shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Switcher Button */}
            <button
              type="button"
              onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-brand-navy hover:text-white dark:hover:bg-brand-orange rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
              title="Changer de langue / تغيير اللغة"
            >
              <Globe className="w-4 h-4 text-brand-orange" />
              <span>{lang === 'fr' ? 'العربية 🇩🇿' : 'Français 🇫🇷'}</span>
            </button>

            {/* Admin Space Button (Only visible IF already logged in) */}
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover rounded-xl transition-all shadow-sm active:scale-95"
                title="Gérer les produits"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter Produit</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
              title={darkMode ? "Mode Clair" : "Mode Sombre"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-glow transition-all active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">{t.cart}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-navy text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-brand-navy shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <div className="relative w-full">
            <input
              id="mobile-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-9 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm border border-transparent focus:border-brand-orange focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar flex items-center gap-2 pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 pr-2 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t.categories}
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const categoryLabel = (lang === 'ar' && CATEGORY_MAP_AR[cat]) ? CATEGORY_MAP_AR[cat] : cat;

            return (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-brand-navy text-white dark:bg-brand-orange dark:text-white shadow-sm scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {categoryLabel}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
