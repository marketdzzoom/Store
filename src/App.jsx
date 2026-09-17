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
  saveSpecialOffer,
  saveOrders
} from './utils/storage';
import { 
  subscribeToRealtimeSync, 
  getCloudConfig, 
  onSyncEvent 
} from './utils/cloudSync';
import { 
  decodeCatalogState, 
  applyCatalogState 
} from './utils/directSync.js';

import { 
  Search
} from 'lucide-react';

export default function App() {
  // Products, Email Config & Special Offer State
  const [products, setProducts] = useState(getStoredProducts);
  const [emailConfig, setEmailConfig] = useState(getStoredEmailConfig);
  const [specialOffer, setSpecialOffer] = useState(getStoredSpecialOffer);
  const [directSyncToast, setDirectSyncToast] = useState(null);

  // Zero-Database Direct Smartphone Pairing & Catalog Synchronization (?sync_state=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const syncStateParam = params.get('sync_state');
      if (syncStateParam) {
        const payload = decodeCatalogState(syncStateParam);
        if (payload) {
          const applied = applyCatalogState(payload, products, specialOffer);
          if (applied) {
            setProducts(applied.products);
            if (applied.specialOffer) setSpecialOffer(applied.specialOffer);
            setDirectSyncToast('📱 Synchronisation directe réussie ! Vos produits masqués et réglages sont maintenant appliqués sur ce smartphone.');
            setTimeout(() => setDirectSyncToast(null), 6000);
          }
        }
        params.delete('sync_state');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        window.history.replaceState(null, '', window.location.pathname + newSearch + window.location.hash);
      }
    } catch (err) {
      console.error('Error applying direct sync from URL:', err);
    }
  }, []);

  // Cloud Sync State & Dynamic Re-subscription
  const [cloudConfigVersion, setCloudConfigVersion] = useState(0);
  const [cloudSyncStatus, setCloudSyncStatus] = useState(() => {
    const cfg = getCloudConfig();
    return cfg.firebaseUrl ? 'connecting' : 'unconfigured';
  });

  // Real-Time Multi-Device Cloud Synchronization (PC <-> Mobile <-> Visitors)
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToRealtimeSync({
      onProducts: (cloudProducts) => {
        if (!isMounted || !Array.isArray(cloudProducts)) return;
        setProducts(cloudProducts);
        saveProducts(cloudProducts, false); // Local cache only, no loop
      },
      onSpecialOffer: (cloudOffer) => {
        if (!isMounted || !cloudOffer) return;
        setSpecialOffer(cloudOffer);
        saveSpecialOffer(cloudOffer, false); // Local cache only, no loop
      },
      onOrders: (cloudOrders) => {
        if (!isMounted || !Array.isArray(cloudOrders)) return;
        saveOrders(cloudOrders, false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('zoom_market_cloud_orders_synced', { detail: cloudOrders }));
        }
      },
      onStatusChange: (status) => {
        if (isMounted) {
          setCloudSyncStatus(status);
        }
      }
    });

    const unlistenConfig = onSyncEvent((detail) => {
      if (detail?.type === 'config_updated') {
        setCloudConfigVersion((v) => v + 1);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      unlistenConfig();
    };
  }, [cloudConfigVersion]);

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

  // Open Product Landing Page & Sync URL with ?p=productId
  const handleOpenProduct = (product) => {
    if (!product) return;
    setQuickViewProduct(product);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('p', product.id);
      window.history.pushState({ productId: product.id }, '', url.toString());
    } catch (e) {
      // Ignore in non-browser environments
    }
  };

  // Close Product Landing Page & Restore Clean URL
  const handleCloseProduct = () => {
    setQuickViewProduct(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('p');
      url.searchParams.delete('produit');
      url.searchParams.delete('product');
      if (url.hash.startsWith('#prod-')) {
        url.hash = '';
      }
      const newQuery = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
      window.history.pushState(null, '', url.pathname + newQuery + url.hash);
    } catch (e) {
      // Ignore
    }
  };

  // Direct Express Buy Now: adds to cart, closes product modal, and opens checkout drawer
  const handleBuyNow = (product, quantity = 1, options = {}) => {
    if (product.inStock === false || product.stockQuantity === 0 || product.badge === 'Rupture de Stock' || product.badge === 'نفذت الكمية') return;
    handleAddToCart(product, quantity, options);
    handleCloseProduct();
    setIsCartOpen(true);
  };

  // Marketing Deep-Linking: auto-open product from URL parameter (?p=prod-1, ?produit=prod-1, or #prod-1)
  useEffect(() => {
    const handleUrlProduct = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pId = params.get('p') || params.get('produit') || params.get('product') || (window.location.hash.startsWith('#prod-') ? window.location.hash.slice(1) : null);
        if (pId && products && products.length > 0) {
          const cleanId = pId.trim();
          const target = products.find((p) => p.id === cleanId || p.id === `prod-${cleanId}`);
          if (target) {
            setQuickViewProduct(target);
          }
        } else if (!pId) {
          setQuickViewProduct(null);
        }
      } catch (e) {
        // Ignore
      }
    };

    handleUrlProduct();
    window.addEventListener('popstate', handleUrlProduct);
    window.addEventListener('hashchange', handleUrlProduct);
    return () => {
      window.removeEventListener('popstate', handleUrlProduct);
      window.removeEventListener('hashchange', handleUrlProduct);
    };
  }, [products]);

  // Dynamic Document Title for Marketing Landing Pages & Social Sharing
  useEffect(() => {
    if (quickViewProduct) {
      const prodTitle = (lang === 'ar' && quickViewProduct.titleAr) ? quickViewProduct.titleAr : quickViewProduct.title;
      const formatted = quickViewProduct.price ? `${quickViewProduct.price.toLocaleString('fr-DZ')} DA` : '';
      document.title = `${prodTitle} (${formatted}) | Zoom Market Dz 🇩🇿`;
    } else {
      document.title = 'Zoom Market Dz | Boutique en Ligne en Algérie 🇩🇿';
    }
  }, [quickViewProduct, lang]);

  const handleOpenCart = () => {
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

  const handleUpdateItemVariant = (cartItemId, newVariant) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        const itemKey = item.cartItemId || item.id;
        if (itemKey === cartItemId) {
          const updatedSize = newVariant.selectedSize !== undefined ? newVariant.selectedSize : item.selectedSize;
          const updatedColor = newVariant.selectedColor !== undefined ? newVariant.selectedColor : item.selectedColor;
          const newCartItemId = `${item.id}${updatedSize ? `-${updatedSize}` : ''}${updatedColor ? `-${updatedColor}` : ''}`;
          return {
            ...item,
            cartItemId: newCartItemId,
            selectedSize: updatedSize,
            selectedColor: updatedColor
          };
        }
        return item;
      })
    );
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

  const handleUpdateProduct = (updatedProduct) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
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
      
      {/* Zero-Database Direct Sync Toast Notification */}
      {directSyncToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-emerald-400">
          <div className="flex items-center gap-2">
            <span className="text-base">📱</span>
            <span>{directSyncToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDirectSyncToast(null)}
            className="p-1 text-white/80 hover:text-white text-xs font-black rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

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
            products={products}
            onQuickView={handleOpenProduct}
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
                  onQuickView={handleOpenProduct}
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
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onUpdateItemVariant={handleUpdateItemVariant}
        onClearCart={handleClearCart}
        onOrderSuccess={(successPayload) => {
          setIsCartOpen(false);
          setCart([]);
          setSuccessOrderData(successPayload);
        }}
        emailConfig={emailConfig}
        lang={lang}
      />

      {/* Product Quick View / Marketing Landing Page Modal */}
      <ProductModal
        product={quickViewProduct}
        onClose={handleCloseProduct}
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
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleProductVisibility={handleToggleProductVisibility}
          onToggleProductStock={handleToggleProductStock}
          onClearAllProducts={handleClearAllProducts}
          onResetProducts={handleResetProducts}
          specialOffer={specialOffer}
          onUpdateSpecialOffer={handleUpdateSpecialOffer}
          cloudSyncStatus={cloudSyncStatus}
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
