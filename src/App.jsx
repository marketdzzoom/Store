import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import SpecialOfferBanner from './components/SpecialOfferBanner';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import AdminModal from './components/AdminModal';
import AdminLoginModal from './components/AdminLoginModal';
import EmailSettingsModal from './components/EmailSettingsModal';
import SuccessModal from './components/SuccessModal';
import MobileBottomNav from './components/MobileBottomNav';
import Footer from './components/Footer';

import { CATEGORIES } from './data/initialProducts';
import { TRANSLATIONS } from './data/translations';
import { 
  getStoredProducts, 
  saveProducts, 
  resetStoredProducts, 
  getStoredEmailConfig, 
  saveEmailConfig,
  getStoredSpecialOffer,
  saveSpecialOffer
} from './utils/storage';

import { 
  Search
} from 'lucide-react';

export default function App() {
  // Products, Email Config & Special Offer State
  const [products, setProducts] = useState(getStoredProducts);
  const [emailConfig, setEmailConfig] = useState(getStoredEmailConfig);
  const [specialOffer, setSpecialOffer] = useState(getStoredSpecialOffer);

  // Language State: 'fr' or 'ar'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('zoom_market_lang') || 'fr';
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  // Admin Session State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('zoom_market_admin_session') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Stealth Triggers: (Ctrl + Shift + A) or URL hash `#admin`
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminLoginOpen(true);
      }
    };
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminLoginOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash === '#admin') {
      setIsAdminLoginOpen(true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('zoom_market_admin_session', 'true');
    setIsAdminLoginOpen(false);
    setIsAdminOpen(true);
    // Clear hash cleanly
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('zoom_market_admin_session');
    setIsAdminOpen(false);
    setIsEmailConfigOpen(false);
  };

  // Sync Document RTL/LTR Direction & HTML lang
  useEffect(() => {
    localStorage.setItem('zoom_market_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);
  
  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('zoom_market_cart_v1');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  // Dark Mode State - LIGHT MODE BY DEFAULT (#F8FAFC)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('zoom_market_dark');
    if (stored === null) return false; // Default is FALSE (Light Mode)
    return stored === 'true';
  });

  // Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartInitialStep, setCartInitialStep] = useState(1);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isEmailConfigOpen, setIsEmailConfigOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [successOrderData, setSuccessOrderData] = useState(null);

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('zoom_market_cart_v1', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Sync Dark Mode class to <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zoom_market_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zoom_market_dark', 'false');
    }
  }, [darkMode]);

  // Cart Operations
  const handleAddToCart = (product, quantity = 1, options = {}) => {
    if (product.inStock === false || product.stockQuantity === 0 || product.badge === 'Rupture de Stock' || product.badge === 'نفذت الكمية') return;

    const selectedSize = options?.selectedSize || '';
    const selectedColor = options?.selectedColor || '';
    const cartItemId = `${product.id}${selectedSize ? `-${selectedSize}` : ''}${selectedColor ? `-${selectedColor}` : ''}`;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => (item.cartItemId || item.id) === cartItemId);
      if (existing) {
        return prevCart.map((item) =>
          (item.cartItemId || item.id) === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, cartItemId, selectedSize, selectedColor, quantity }];
    });
  };

  const handleBuyNow = (product, quantity = 1, options = {}) => {
    if (product.inStock === false || product.stockQuantity === 0 || product.badge === 'Rupture de Stock' || product.badge === 'نفذت الكمية') return;
    handleAddToCart(product, quantity, options);
    setQuickViewProduct(null);
    setCartInitialStep(2); // Directly jump to shipping & confirmation step!
    setIsCartOpen(true);
  };

  const handleOpenCart = (step = 1) => {
    setCartInitialStep(step);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (targetId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(targetId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        (item.cartItemId || item.id) === targetId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveItem = (targetId) => {
    setCart((prevCart) => prevCart.filter((item) => (item.cartItemId || item.id) !== targetId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Product Admin Operations
  const handleAddProduct = (newProduct) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    saveProducts(updated);
  };

  const handleDeleteProduct = (productId) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
  };

  const handleToggleProductVisibility = (productId) => {
    const updated = products.map((p) =>
      p.id === productId
        ? { ...p, isVisible: p.isVisible === false ? true : false }
        : p
    );
    setProducts(updated);
    saveProducts(updated);
  };

  const handleToggleProductStock = (productId) => {
    const updated = products.map((p) => {
      if (p.id !== productId) return p;
      const isCurrentlyInStock = p.inStock !== false && (p.stockQuantity ?? 10) > 0;
      return {
        ...p,
        inStock: !isCurrentlyInStock,
        stockQuantity: isCurrentlyInStock ? 0 : 10,
        badge: isCurrentlyInStock ? 'Rupture de Stock' : (p.badge === 'Rupture de Stock' ? 'Nouveau' : (p.badge || 'En Stock'))
      };
    });
    setProducts(updated);
    saveProducts(updated);
  };

  const handleClearAllProducts = () => {
    setProducts([]);
    saveProducts([]);
  };

  const handleResetProducts = () => {
    const initial = resetStoredProducts();
    setProducts(initial);
  };

  // Special Offer Admin Operations
  const handleUpdateSpecialOffer = (updatedOffer) => {
    setSpecialOffer(updatedOffer);
    saveSpecialOffer(updatedOffer);
  };

  // Email Config Update
  const handleSaveEmailConfig = (newConfig) => {
    setEmailConfig(newConfig);
    saveEmailConfig(newConfig);
  };

  // Filtered Products (Hides isVisible === false from public customers)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.isVisible === false) return false;

      const matchesCategory =
        selectedCategory === 'Tous' || product.category === selectedCategory;
      
      const searchLower = searchTerm.toLowerCase();
      const titleFr = (product.title || '').toLowerCase();
      const titleAr = (product.titleAr || '').toLowerCase();
      const descFr = (product.description || '').toLowerCase();
      const descAr = (product.descriptionAr || '').toLowerCase();

      const matchesSearch =
        titleFr.includes(searchLower) ||
        titleAr.includes(searchLower) ||
        descFr.includes(searchLower) ||
        descAr.includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const cartTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-brand-orange selection:text-white transition-colors duration-200 pb-16 md:pb-0">
      
      {/* Top Header */}
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={CATEGORIES}
        cartCount={cartTotalItemsCount}
        onOpenCart={() => handleOpenCart(1)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenEmailConfig={() => setIsEmailConfigOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        storePhone={emailConfig.storePhone}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* High-Impact Special Offer Showcase Banner */}
        {selectedCategory === 'Tous' && !searchTerm && (
          <SpecialOfferBanner
            offer={specialOffer}
            onQuickView={setQuickViewProduct}
            onBuyNow={handleBuyNow}
            lang={lang}
          />
        )}

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          
          {/* Section Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.ourProducts}</span>
                {selectedCategory !== 'Tous' && (
                  <span className="text-sm font-semibold text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
                    {selectedCategory}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {filteredProducts.length} {t.articlesFound}
              </p>
            </div>

            {/* Quick Filter Reset */}
            {(selectedCategory !== 'Tous' || searchTerm) && (
              <button
                type="button"
                onClick={() => { setSelectedCategory('Tous'); setSearchTerm(''); }}
                className="text-xs font-bold text-brand-orange hover:underline self-start sm:self-auto"
              >
                {t.resetSearch}
              </button>
            )}
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onQuickView={setQuickViewProduct}
                  lang={lang}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto my-6 p-6">
              <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {t.noProductsFound}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                {t.tryAnotherKeyword}
              </p>
              <button
                type="button"
                onClick={() => { setSelectedCategory('Tous'); setSearchTerm(''); }}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow"
              >
                {t.showAllProducts}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Modals & Drawers */}
      
      {/* Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        initialStep={cartInitialStep}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderSuccess={(successPayload) => {
          setIsCartOpen(false);
          setCart([]);
          setSuccessOrderData(successPayload);
        }}
        emailConfig={emailConfig}
        lang={lang}
      />

      {/* Product Quick View Modal */}
      <ProductModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        lang={lang}
      />

      {/* Admin Security PIN Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Panel Modal (Protected) */}
      {isAdminLoggedIn && (
        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          products={products}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleProductVisibility={handleToggleProductVisibility}
          onToggleProductStock={handleToggleProductStock}
          onClearAllProducts={handleClearAllProducts}
          onResetProducts={handleResetProducts}
          specialOffer={specialOffer}
          onUpdateSpecialOffer={handleUpdateSpecialOffer}
        />
      )}

      {/* Email & WhatsApp Settings Modal (Protected) */}
      {isAdminLoggedIn && (
        <EmailSettingsModal
          isOpen={isEmailConfigOpen}
          onClose={() => setIsEmailConfigOpen(false)}
          emailConfig={emailConfig}
          onSaveConfig={handleSaveEmailConfig}
        />
      )}

      {/* Order Success Modal */}
      <SuccessModal
        isOpen={!!successOrderData}
        onClose={() => setSuccessOrderData(null)}
        data={successOrderData}
        lang={lang}
      />

      {/* Floating Mobile Bottom Navigation */}
      <MobileBottomNav
        cartCount={cartTotalItemsCount}
        onOpenCart={() => handleOpenCart(1)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        lang={lang}
        setLang={setLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onResetSearch={() => { setSelectedCategory('Tous'); setSearchTerm(''); }}
      />

      {/* Footer */}
      <Footer
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        storePhone={emailConfig.storePhone}
        recipientEmail={emailConfig.recipientEmail}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        lang={lang}
      />
    </div>
  );
}
