import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Trash2, 
  RotateCcw, 
  Upload, 
  Package, 
  Check,
  Zap,
  Images,
  Globe,
  Sparkles,
  ClipboardList,
  PhoneCall,
  MapPin,
  Calendar,
  Filter,
  Layers,
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  Pencil,
  Palette
} from 'lucide-react';
import { CATEGORIES } from '../data/initialProducts';
import { formatPrice } from '../utils/formatters';
import { 
  getStoredSpecialOffer, 
  saveSpecialOffer, 
  getStoredOrders, 
  updateOrderStatus, 
  deleteOrderFromStorage 
} from '../utils/storage';
import { PRESET_COLORS, getColorStyle } from '../utils/colors';

const MONTHS_LIST = [
  { value: 'Tous', label: 'Tous les mois' },
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

const YEARS_LIST = ['Toutes', '2026', '2025', '2024'];

export default function AdminModal({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleProductVisibility,
  onToggleProductStock,
  onClearAllProducts,
  onResetProducts,
  specialOffer,
  onUpdateSpecialOffer
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'add', 'special_offer', 'manage'
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodFilter, setProdFilter] = useState('all'); // 'all', 'visible', 'hidden', 'outofstock'
  
  // Orders Management State
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('Tous');
  const [selectedMonth, setSelectedMonth] = useState('Tous');
  const [selectedYear, setSelectedYear] = useState('Toutes');

  // Add Product Form State
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1] || 'High-Tech');
  const [badge, setBadge] = useState('Nouveau');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  
  // Stock & Visibility State
  const [inStock, setInStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('10');
  const [isVisible, setIsVisible] = useState(true);

  // Product Variants / Specificities State (Sizes & Colors)
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');

  // Multi-Image State
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [imageFilesPreviews, setImageFilesPreviews] = useState([]);

  // Special Offer Admin Form State
  const [soEnabled, setSoEnabled] = useState(specialOffer ? specialOffer.enabled : true);
  const [soTagline, setSoTagline] = useState(specialOffer ? specialOffer.tagline : 'Vente Flash 24H ⚡');
  const [soSeasonBadge, setSoSeasonBadge] = useState(specialOffer ? specialOffer.seasonBadge : 'Arrivage Spécial Saison ☀️');
  const [soTitle, setSoTitle] = useState(specialOffer ? specialOffer.title : '');
  const [soTitleAr, setSoTitleAr] = useState(specialOffer ? specialOffer.titleAr : '');
  const [soPrice, setSoPrice] = useState(specialOffer ? specialOffer.price : '');
  const [soOldPrice, setSoOldPrice] = useState(specialOffer ? specialOffer.oldPrice : '');
  const [soCategory, setSoCategory] = useState(specialOffer ? specialOffer.category : 'High-Tech');
  const [soDescription, setSoDescription] = useState(specialOffer ? specialOffer.description : '');
  const [soDescriptionAr, setSoDescriptionAr] = useState(specialOffer ? specialOffer.descriptionAr : '');
  const [soImageFiles, setSoImageFiles] = useState(specialOffer ? (specialOffer.images || []) : []);
  const [soUrlsText, setSoUrlsText] = useState('');

  const [formSuccess, setFormSuccess] = useState(false);
  const [soSuccess, setSoSuccess] = useState(false);

  // Manual Refresh & Sync State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [refreshToast, setRefreshToast] = useState(false);

  // Manual refresh function triggered by clicking the rounded arrow button
  const handleRefreshOrders = () => {
    setIsRefreshing(true);
    const freshOrders = getStoredOrders();
    setOrders(freshOrders);
    setLastRefreshedAt(new Date().toLocaleTimeString('fr-DZ'));
    setRefreshToast(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
    setTimeout(() => {
      setRefreshToast(false);
    }, 3000);
  };

  // Load orders when modal is open and auto-listen for new incoming orders
  useEffect(() => {
    if (isOpen) {
      setOrders(getStoredOrders());
      setLastRefreshedAt(new Date().toLocaleTimeString('fr-DZ'));

      // 1. Listen for localStorage changes from another tab/browser window
      const handleStorageChange = (e) => {
        if (!e.key || e.key === 'zoom_market_orders_v1') {
          setOrders(getStoredOrders());
          setLastRefreshedAt(new Date().toLocaleTimeString('fr-DZ'));
        }
      };

      // 2. Listen for same-window custom order creation events
      const handleCustomOrder = () => {
        setOrders(getStoredOrders());
        setLastRefreshedAt(new Date().toLocaleTimeString('fr-DZ'));
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('zoom_market_order_created', handleCustomOrder);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('zoom_market_order_created', handleCustomOrder);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = (orderId, newStatus) => {
    const updated = updateOrderStatus(orderId, newStatus);
    setOrders(updated);
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette commande ?')) {
      const updated = deleteOrderFromStorage(orderId);
      setOrders(updated);
    }
  };

  // Filtered orders list by Status, Month, and Year
  const filteredOrders = orders.filter((ord) => {
    // Status Filter
    if (orderStatusFilter !== 'Tous' && ord.status !== orderStatusFilter) {
      return false;
    }

    const orderDate = ord.createdAt ? new Date(ord.createdAt) : new Date();
    const orderMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
    const orderYear = String(orderDate.getFullYear());

    // Month Filter
    if (selectedMonth !== 'Tous' && orderMonth !== selectedMonth) {
      return false;
    }

    // Year Filter
    if (selectedYear !== 'Toutes' && orderYear !== selectedYear) {
      return false;
    }

    return true;
  });

  // Calculate Total Sales Revenue for Filtered Period
  const totalPeriodRevenue = filteredOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

  // Handle Uploading Multiple Image Files for Add Product
  const handleMultipleImageFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const filePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then((base64Images) => {
      setImageFilesPreviews((prev) => [...prev, ...base64Images]);
    });
  };

  const handleRemovePreview = (index) => {
    setImageFilesPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Uploading Multiple Image Files for Special Offer
  const handleSoMultipleImageFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const filePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then((base64Images) => {
      setSoImageFiles((prev) => [...prev, ...base64Images]);
    });
  };

  const handleRemoveSoImage = (index) => {
    setSoImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectProductForSpecialOffer = (prodId) => {
    const p = products.find((item) => item.id === prodId);
    if (p) {
      setSoTitle(p.title);
      setSoTitleAr(p.titleAr || '');
      setSoPrice(p.price);
      setSoOldPrice(p.oldPrice || p.price * 1.25);
      setSoCategory(p.category);
      setSoDescription(p.description);
      setSoDescriptionAr(p.descriptionAr || '');
      setSoImageFiles(p.images && p.images.length > 0 ? p.images : [p.image]);
    }
  };

  const handleStartEditProduct = (prod) => {
    setEditingProduct(prod);
    setTitle(prod.title || '');
    setTitleAr(prod.titleAr || '');
    setPrice(prod.price !== undefined && prod.price !== null ? String(prod.price) : '');
    setOldPrice(prod.oldPrice ? String(prod.oldPrice) : '');
    setCategory(prod.category || CATEGORIES[1]);
    setBadge(prod.badge || 'Nouveau');
    setDescription(prod.description || '');
    setDescriptionAr(prod.descriptionAr || '');
    setInStock(prod.inStock !== false);
    setStockQuantity(String(prod.stockQuantity ?? 10));
    setIsVisible(prod.isVisible !== false);
    setSizesInput(prod.sizes && prod.sizes.length > 0 ? prod.sizes.join(', ') : '');
    setColorsInput(prod.colors && prod.colors.length > 0 ? prod.colors.join(', ') : '');
    setImageFilesPreviews(prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []));
    setImageUrlsText('');
    setActiveTab('add');
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setTitle('');
    setTitleAr('');
    setPrice('');
    setOldPrice('');
    setDescription('');
    setDescriptionAr('');
    setSizesInput('');
    setColorsInput('');
    setImageUrlsText('');
    setImageFilesPreviews([]);
    setStockQuantity('10');
    setInStock(true);
    setIsVisible(true);
    setBadge('Nouveau');
  };

  const handleTogglePresetColor = (colorName) => {
    const current = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const lowerList = current.map((c) => c.toLowerCase());
    const targetLower = colorName.toLowerCase();

    if (lowerList.includes(targetLower)) {
      setColorsInput(current.filter((c) => c.toLowerCase() !== targetLower).join(', '));
    } else {
      setColorsInput([...current, colorName].join(', '));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !price || !description.trim()) {
      alert('Veuillez remplir le nom, le prix et la description.');
      return;
    }

    const urlList = imageUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const allImages = [...imageFilesPreviews, ...urlList];
    const defaultFallback = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";
    const finalImageList = allImages.length > 0 ? allImages : [defaultFallback];

    const parsedSizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedColors = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (editingProduct) {
      const updatedProd = {
        ...editingProduct,
        title: title.trim(),
        titleAr: titleAr.trim() || title.trim(),
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        category,
        badge: inStock ? badge.trim() : 'Rupture de Stock',
        description: description.trim(),
        descriptionAr: descriptionAr.trim() || description.trim(),
        image: finalImageList[0],
        images: finalImageList,
        sizes: parsedSizes,
        colors: parsedColors,
        inStock: inStock,
        stockQuantity: inStock ? parseInt(stockQuantity || 10) : 0,
        isVisible: isVisible,
        updatedAt: new Date().toISOString()
      };

      onUpdateProduct && onUpdateProduct(updatedProd);
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        handleCancelEdit();
        setActiveTab('manage');
      }, 1500);
      return;
    }

    const newProd = {
      id: `prod-${Date.now()}`,
      title: title.trim(),
      titleAr: titleAr.trim() || title.trim(),
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      category,
      badge: inStock ? badge.trim() : 'Rupture de Stock',
      description: description.trim(),
      descriptionAr: descriptionAr.trim() || description.trim(),
      image: finalImageList[0],
      images: finalImageList,
      sizes: parsedSizes,
      colors: parsedColors,
      inStock: inStock,
      stockQuantity: inStock ? parseInt(stockQuantity || 10) : 0,
      isVisible: isVisible,
      rating: 5.0,
      reviewsCount: 1,
      createdAt: new Date().toISOString()
    };

    onAddProduct(newProd);
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 2500);

    handleCancelEdit();
  };

  const handleSaveSpecialOfferForm = (e) => {
    e.preventDefault();
    if (!soTitle.trim() || !soPrice) {
      alert('Veuillez renseigner le titre et le prix de l\'offre spéciale.');
      return;
    }

    const urlList = soUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const allImages = [...soImageFiles, ...urlList];
    const defaultFallback = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80";
    const finalImages = allImages.length > 0 ? allImages : [defaultFallback];

    const updatedOffer = {
      enabled: soEnabled,
      tagline: soTagline.trim() || 'Vente Flash 24H ⚡',
      seasonBadge: soSeasonBadge.trim() || 'Arrivage Spécial Saison',
      title: soTitle.trim(),
      titleAr: soTitleAr.trim() || soTitle.trim(),
      price: parseFloat(soPrice),
      oldPrice: soOldPrice ? parseFloat(soOldPrice) : null,
      category: soCategory,
      description: soDescription.trim(),
      descriptionAr: soDescriptionAr.trim() || soDescription.trim(),
      images: finalImages,
      countdownHours: 24
    };

    onUpdateSpecialOffer(updatedOffer);
    saveSpecialOffer(updatedOffer);
    setSoSuccess(true);
    setTimeout(() => setSoSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-brand-navy/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[94vh] sm:max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 bg-brand-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-brand-orange" />
            <div>
              <h2 className="font-extrabold text-lg">Espace Administration Zoom Market Dz</h2>
              <p className="text-xs text-slate-300">Suivi des commandes par mois/année, produits & Offre Spéciale</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-4 pt-3 overflow-x-auto no-scrollbar items-center">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-brand-orange text-brand-orange bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-brand-orange" />
              <span>Commandes Clients ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={handleRefreshOrders}
              disabled={isRefreshing}
              className="p-1.5 ml-1 mr-2 text-slate-400 hover:text-brand-orange hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-90"
              title="Actualiser pour charger les nouvelles commandes sans recharger la page (flèche arrondie)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-orange' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'add'
                ? 'border-brand-orange text-brand-orange bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {editingProduct ? (
              <>
                <Pencil className="w-4 h-4 text-sky-500" />
                <span>Modifier Produit ✏️</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Nouveau Produit</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('special_offer')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'special_offer'
                ? 'border-brand-orange text-brand-orange bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-brand-orange" />
            ⭐ Offre Spéciale
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manage'
                ? 'border-brand-orange text-brand-orange bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Boutique ({products.length})
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 overflow-x-hidden">
          
          {/* TAB 1: CLIENT ORDERS LISTING WITH DATE & MONTH FILTERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Filter Bar with Month, Year & Status Selectors */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-brand-orange" />
                    Filtrer les Commandes par Période (Mois / Année) & Statut
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Bouton flèche arrondie pour actualiser sans recharger toute la page */}
                    <button
                      type="button"
                      onClick={handleRefreshOrders}
                      disabled={isRefreshing}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1.5 active:scale-95 group"
                      title="Actualiser pour charger les nouvelles commandes sans recharger la page"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-brand-orange transition-all duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                      <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
                    </button>

                    <span className="text-xs font-black text-brand-orange bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      Total Période : {formatPrice(totalPeriodRevenue)}
                    </span>
                  </div>
                </div>

                {/* Notification toast d'actualisation */}
                {refreshToast && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-bold">
                        Commandes actualisées avec succès ({orders.length} commande(s) au total).
                      </span>
                    </div>
                    {lastRefreshedAt && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        Synchro : {lastRefreshedAt}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  
                  {/* Month Filter Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Mois souhaité
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                    >
                      {MONTHS_LIST.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Filter Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Année souhaitée
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                    >
                      {YEARS_LIST.map((y) => (
                        <option key={y} value={y}>{y === 'Toutes' ? 'Toutes les années' : y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Statut de livraison
                    </label>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                    >
                      <option value="Tous">Tous les statuts</option>
                      <option value="En attente">🟡 En attente (Draft)</option>
                      <option value="Validé">🔵 Validé (Confirmé)</option>
                      <option value="Livré">🟢 Livré (Terminé)</option>
                      <option value="Annulé">🔴 Annulé</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    Affichage de <strong>{filteredOrders.length}</strong> commande(s) trouvée(s) pour cette période.
                  </span>
                  
                  {(selectedMonth !== 'Tous' || selectedYear !== 'Toutes' || orderStatusFilter !== 'Tous') && (
                    <button
                      type="button"
                      onClick={() => { setSelectedMonth('Tous'); setSelectedYear('Toutes'); setOrderStatusFilter('Tous'); }}
                      className="text-brand-orange font-bold hover:underline"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              </div>

              {/* Orders Cards List */}
              {filteredOrders.length > 0 ? (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredOrders.map((ord) => {
                    const cust = ord.customer || {};
                    const items = ord.items || [];
                    
                    let statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
                    if (ord.status === 'Validé') statusBadgeClass = "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
                    if (ord.status === 'Livré') statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
                    if (ord.status === 'Annulé') statusBadgeClass = "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300";

                    return (
                      <div 
                        key={ord.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-sm"
                      >
                        {/* Top Order Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-brand-navy dark:text-white font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {ord.id}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {ord.date || new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Status Change Selector Dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500">Statut :</span>
                            <select
                              value={ord.status}
                              onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                              className={`px-3 py-1 rounded-xl text-xs font-black border cursor-pointer focus:outline-none ${statusBadgeClass}`}
                            >
                              <option value="En attente">🟡 En attente (Draft)</option>
                              <option value="Validé">🔵 Validé (Confirmé)</option>
                              <option value="Livré">🟢 Livré (Terminé)</option>
                              <option value="Annulé">🔴 Annulé</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors ml-1"
                              title="Supprimer la commande"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Customer Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Client:</span>
                            <strong className="text-slate-900 dark:text-white font-bold">{cust.fullName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Téléphone:</span>
                            <a href={`tel:${cust.phone}`} className="text-brand-orange font-bold hover:underline flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" />
                              {cust.phone}
                            </a>
                            {cust.phoneBackup && (
                              <a href={`tel:${cust.phoneBackup}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium hover:underline flex items-center gap-1 mt-0.5">
                                <PhoneCall className="w-2.5 h-2.5" />
                                {cust.phoneBackup} (Secours)
                              </a>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Wilaya & Adresse:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-brand-orange flex-shrink-0" />
                              {cust.wilaya} - {cust.address}
                            </span>
                          </div>
                        </div>

                        {/* Items summary */}
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
                          <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Produits commandés ({items.length}):</span>
                          <ul className="space-y-1.5 text-slate-800 dark:text-slate-200">
                            {items.map((it, idx) => (
                              <li key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0 gap-1">
                                <div>
                                  <span className="font-semibold">• {it.title} x{it.quantity}</span>
                                  {(it.selectedSize || it.selectedColor) && (
                                    <div className="flex items-center gap-1.5 mt-0.5 ml-2.5 flex-wrap">
                                      {it.selectedSize && (
                                        <span className="text-[10px] font-bold bg-brand-orange/10 text-brand-orange dark:bg-brand-orange/20 px-2 py-0.5 rounded border border-brand-orange/30">
                                          Pointure/Taille: {it.selectedSize}
                                        </span>
                                      )}
                                      {it.selectedColor && (() => {
                                        const cStyle = getColorStyle(it.selectedColor);
                                        return (
                                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1.5 shadow-2xs">
                                            <span 
                                              className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${cStyle.isLight ? 'border border-slate-400' : ''}`}
                                              style={{ background: cStyle.background }}
                                            />
                                            <span>Couleur: {it.selectedColor}</span>
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                                <span className="font-bold sm:text-right flex-shrink-0">{formatPrice(it.price * it.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-black text-slate-900 dark:text-white text-xs">
                            <span>TOTAL À PAYER À LA LIVRAISON:</span>
                            <span className="text-brand-orange">{formatPrice(ord.total)}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                  <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Aucune commande trouvée pour la période sélectionnée
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Essayez de changer les filtres de mois ou d'année pour consulter d'autres périodes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Add or Edit Product */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {editingProduct ? 'Modifications enregistrées avec succès !' : 'Produit créé et publié en direct dans la boutique !'}
                </div>
              )}

              {editingProduct && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-900 dark:text-sky-200 animate-fadeIn">
                  <div className="flex items-center gap-2 min-w-0">
                    <Pencil className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <span className="truncate">
                      Modification de l'article : <strong className="font-extrabold">{editingProduct.title}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-red-500 rounded-lg font-bold flex-shrink-0 active:scale-95 transition-colors shadow-2xs"
                  >
                    Annuler
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nom du produit (Français) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Écouteurs Bluetooth Pro 5"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المنتج (بالعربية)
                  </label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: سماعات بلوتوث برو 5"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  >
                    {CATEGORIES.filter(c => c !== 'Tous').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Badge personnalisé
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Nouveau, Promo -15%, Top"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prix Vente DA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 4500"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ancien prix DA (Optionnel)
                  </label>
                  <input
                    type="number"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="Ex: 5500"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-orange" />
                  Gestion des Stocks & Disponibilité
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Statut de Disponibilité
                    </label>
                    <select
                      value={inStock ? 'available' : 'out_of_stock'}
                      onChange={(e) => setInStock(e.target.value === 'available')}
                      className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    >
                      <option value="available">🟢 En Stock (Disponible à la vente)</option>
                      <option value="out_of_stock">🔴 Rupture de Stock (Vente désactivée)</option>
                    </select>
                  </div>

                  {inStock && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Quantité disponible en stock
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="Ex: 15"
                        className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Spécificités & Variantes du Produit (Pointures, Tailles & Couleurs) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-brand-orange" />
                    Spécificités & Variantes du Produit (Optionnel)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Séparer chaque option par une virgule
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      👟 Pointures / Tailles disponibles
                    </label>
                    <input
                      type="text"
                      value={sizesInput}
                      onChange={(e) => setSizesInput(e.target.value)}
                      placeholder="Ex: 39, 40, 41, 42, 43, 44 ou S, M, L, XL"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none placeholder:text-slate-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Le client pourra choisir sa taille sur la fiche produit avant de commander.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      🎨 Couleurs disponibles
                    </label>
                    <input
                      type="text"
                      value={colorsInput}
                      onChange={(e) => setColorsInput(e.target.value)}
                      placeholder="Ex: Noir, Blanc, Bleu Marine, Gris, Rouge"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none placeholder:text-slate-400 font-medium"
                    />

                    {/* Aperçu en direct des vraies couleurs saisies */}
                    {colorsInput.trim() && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                          Aperçu réel :
                        </span>
                        {colorsInput
                          .split(',')
                          .map((c) => c.trim())
                          .filter(Boolean)
                          .map((colName) => {
                            const cStyle = getColorStyle(colName);
                            return (
                              <span
                                key={colName}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                              >
                                <span
                                  className={`w-3 h-3 rounded-full inline-block flex-shrink-0 ${
                                    cStyle.isLight ? 'border border-slate-400' : ''
                                  }`}
                                  style={{ background: cStyle.background }}
                                />
                                <span>{colName}</span>
                              </span>
                            );
                          })}
                      </div>
                    )}

                    {/* Palette rapide de sélection en 1 clic */}
                    <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-750">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-brand-orange" />
                        <span>Sélection rapide en 1 clic (cliquez pour ajouter / retirer) :</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
                        {PRESET_COLORS.map((preset) => {
                          const currentTokens = colorsInput
                            .split(',')
                            .map((c) => c.trim().toLowerCase());
                          const isIncluded = currentTokens.includes(preset.name.toLowerCase());
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => handleTogglePresetColor(preset.name)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 border flex items-center gap-1 ${
                                isIncluded
                                  ? 'bg-slate-900 text-white dark:bg-brand-orange border-slate-900 dark:border-brand-orange shadow-xs ring-1 ring-brand-orange'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-orange/60'
                              }`}
                            >
                              <span
                                className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${
                                  preset.isLight ? 'border border-slate-400' : ''
                                }`}
                                style={{ background: preset.gradient || preset.hex }}
                              />
                              <span>{preset.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Les pastilles de couleurs réelles seront fidèlement affichées aux clients sur la fiche produit et dans la commande express.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Français) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Caractéristiques, détails..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وصف المنتج (بالعربية)
                </label>
                <textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  rows={2}
                  placeholder="المواصفات، التفاصيل بالعربية..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Images className="w-4 h-4 text-brand-orange" />
                    Charger Plusieurs Photos du Produit (3-5 photos conseillées)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {imageFilesPreviews.length} photo(s) sélectionnée(s)
                  </span>
                </label>

                <label className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:border-brand-orange transition-colors">
                  <Upload className="w-6 h-6 text-brand-orange mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Sélectionner plusieurs images depuis votre appareil
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImageFiles}
                    className="hidden"
                  />
                </label>

                <div>
                  <textarea
                    value={imageUrlsText}
                    onChange={(e) => setImageUrlsText(e.target.value)}
                    rows={2}
                    placeholder="Ou coller plusieurs liens d'images (un par ligne) https://..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-mono"
                  />
                </div>

                {imageFilesPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {imageFilesPreviews.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 group">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePreview(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visibility Option */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  {isVisible ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0">
                      <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                      {isVisible ? 'Produit visible en boutique' : 'Produit masqué (Brouillon)'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {isVisible 
                        ? 'Affiché immédiatement dans la boutique pour tous les clients.' 
                        : 'Enregistré dans l’admin mais masqué aux clients (activable plus tard).'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange" />
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-1/3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Annuler</span>
                  </button>
                )}
                <button
                  type="submit"
                  className={`${
                    editingProduct ? 'w-2/3' : 'w-full'
                  } bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2`}
                >
                  {editingProduct ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Enregistrer les modifications</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>{isVisible ? 'Publier le produit dans la boutique' : 'Enregistrer le produit (Masqué)'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SPECIAL OFFER CONFIGURATION */}
          {activeTab === 'special_offer' && (
            <form onSubmit={handleSaveSpecialOfferForm} className="space-y-4">
              {soSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Offre Spéciale du Jour mise à jour et publiée en haut du site !
                </div>
              )}

              <div className="p-3.5 bg-brand-orange/10 border border-brand-orange/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-brand-orange" />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Afficher la Bannière Offre Spéciale</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Positionnée en haut du site pour attirer l'attention des acheteurs</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soEnabled}
                    onChange={(e) => setSoEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remplissage rapide : Choisir un produit existant dans le magasin
                </label>
                <select
                  onChange={(e) => handleSelectProductForSpecialOffer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                >
                  <option value="">-- Sélectionner un produit pour l'Offre Spéciale --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatPrice(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tag / Titre de la Vente Flash
                  </label>
                  <input
                    type="text"
                    value={soTagline}
                    onChange={(e) => setSoTagline(e.target.value)}
                    placeholder="Ex: Vente Flash 24H ⚡, Vente Exclusive 💥"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Badge de Saison / Événement
                  </label>
                  <input
                    type="text"
                    value={soSeasonBadge}
                    onChange={(e) => setSoSeasonBadge(e.target.value)}
                    placeholder="Ex: Arrivage Spécial Été ☀️, Offre Ramadan 🌙"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Titre du Produit (Français) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={soTitle}
                    onChange={(e) => setSoTitle(e.target.value)}
                    placeholder="Titre de l'article en offre spéciale"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان المنتج (بالعربية)
                  </label>
                  <input
                    type="text"
                    value={soTitleAr}
                    onChange={(e) => setSoTitleAr(e.target.value)}
                    placeholder="عنوان العرض الخاص بالعربية"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prix Offre Spéciale DA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={soPrice}
                    onChange={(e) => setSoPrice(e.target.value)}
                    placeholder="Ex: 5800"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ancien Prix DA (Barré)
                  </label>
                  <input
                    type="number"
                    value={soOldPrice}
                    onChange={(e) => setSoOldPrice(e.target.value)}
                    placeholder="Ex: 7500"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description de l'Offre (Français)
                </label>
                <textarea
                  value={soDescription}
                  onChange={(e) => setSoDescription(e.target.value)}
                  rows={2}
                  placeholder="Texte de présentation de l'offre spéciale..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وصف العرض الخاص (بالعربية)
                </label>
                <textarea
                  value={soDescriptionAr}
                  onChange={(e) => setSoDescriptionAr(e.target.value)}
                  rows={2}
                  placeholder="تفاصيل العرض الخاص بالعربية..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-brand-orange">
                    <Images className="w-4 h-4" />
                    Photos de l'Offre Spéciale (Charger au moins 3 à 4 photos HD)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {soImageFiles.length} photo(s)
                  </span>
                </label>

                <label className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:border-brand-orange transition-colors">
                  <Upload className="w-6 h-6 text-brand-orange mb-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Charger plusieurs photos HD pour le carrousel
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSoMultipleImageFiles}
                    className="hidden"
                  />
                </label>

                <div>
                  <textarea
                    value={soUrlsText}
                    onChange={(e) => setSoUrlsText(e.target.value)}
                    rows={2}
                    placeholder="Ou coller des liens d'images (une URL par ligne) https://..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-mono"
                  />
                </div>

                {soImageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {soImageFiles.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 group">
                        <img src={img} alt={`Offer Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveSoImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 rounded-xl font-extrabold text-sm shadow-lg hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publier l'Offre Spéciale du Jour en haut du site</span>
              </button>
            </form>
          )}

          {/* TAB 4: Manage Products */}
          {activeTab === 'manage' && (() => {
            const visibleCount = products.filter(p => p.isVisible !== false).length;
            const hiddenCount = products.filter(p => p.isVisible === false).length;
            const outOfStockCount = products.filter(p => p.inStock === false || p.stockQuantity === 0 || p.badge === 'Rupture de Stock' || p.badge === 'نفذت الكمية').length;

            const displayedProducts = products.filter((p) => {
              if (prodFilter === 'visible') return p.isVisible !== false;
              if (prodFilter === 'hidden') return p.isVisible === false;
              if (prodFilter === 'outofstock') return p.inStock === false || p.stockQuantity === 0 || p.badge === 'Rupture de Stock' || p.badge === 'نفذت الكمية';
              return true;
            });

            return (
              <div className="space-y-4">
                {/* Header Stats & Global Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Gestion du Catalogue ({products.length} article{products.length > 1 ? 's' : ''})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {visibleCount} en ligne • {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''} • {outOfStockCount} en rupture
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {products.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Êtes-vous sûr de vouloir supprimer TOUS les articles du catalogue ?\n\nConseil : Pour simplement cacher des articles aux clients, cliquez sur 'Masquer' individuellement.")) {
                            if (onClearAllProducts) {
                              onClearAllProducts();
                            } else {
                              products.forEach((p) => onDeleteProduct(p.id));
                            }
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Tout supprimer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Recharger les 8 produits de démonstration par défaut ?")) {
                          onResetProducts();
                        }
                      }}
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Recharger démo
                    </button>
                  </div>
                </div>

                {/* Filter Tabs / Pills */}
                {products.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setProdFilter('all')}
                      className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                        prodFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Tous ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdFilter('visible')}
                      className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        prodFilter === 'visible'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      En ligne ({visibleCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdFilter('hidden')}
                      className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        prodFilter === 'hidden'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Masqués ({hiddenCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdFilter('outofstock')}
                      className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        prodFilter === 'outofstock'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      En rupture ({outOfStockCount})
                    </button>
                  </div>
                )}

                {/* Main Product List or Empty States */}
                {products.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Le catalogue est actuellement vide
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Tous les articles ont été supprimés. Vous pouvez ajouter vos nouveaux produits ou réinitialiser les exemples.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('add')}
                      className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Ajouter un nouveau produit
                    </button>
                  </div>
                ) : displayedProducts.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Aucun produit ne correspond au filtre sélectionné.
                    </p>
                    <button
                      type="button"
                      onClick={() => setProdFilter('all')}
                      className="mt-2 text-xs font-bold text-brand-orange hover:underline"
                    >
                      Afficher tous les articles
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[60vh] sm:max-h-96 overflow-y-auto pr-1">
                    {displayedProducts.map((p) => {
                      const isHidden = p.isVisible === false;
                      const isOut = p.inStock === false || p.stockQuantity === 0 || p.badge === 'Rupture de Stock' || p.badge === 'نفذت الكمية';
                      const imgCount = p.images ? p.images.length : (p.image ? 1 : 0);

                      return (
                        <div 
                          key={p.id} 
                          className={`p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all border ${
                            isHidden 
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
                              : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Top row on mobile, Left col on desktop */}
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            {/* Fixed image container strictly locked to 56px x 56px */}
                            <div className="relative w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                              <img
                                src={p.images ? p.images[0] : p.image}
                                alt={p.title}
                                className={`w-full h-full object-cover ${
                                  isHidden ? 'opacity-50 grayscale-[50%]' : isOut ? 'grayscale opacity-70' : ''
                                }`}
                                loading="lazy"
                              />
                              {isHidden && (
                                <span 
                                  className="absolute top-1 right-1 bg-amber-500 text-white p-0.5 rounded-full shadow"
                                  title="Article masqué aux clients"
                                >
                                  <EyeOff className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={p.title}>
                                {p.title}
                              </h4>

                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-xs font-black text-brand-orange">
                                  {formatPrice(p.price)}
                                </span>

                                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-1.5 py-0.5 rounded font-semibold">
                                  {p.category}
                                </span>

                                {isHidden ? (
                                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-amber-200 dark:border-amber-900 whitespace-nowrap">
                                    <EyeOff className="w-2.5 h-2.5" />
                                    Masqué
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-900 whitespace-nowrap">
                                    <Eye className="w-2.5 h-2.5" />
                                    En ligne
                                  </span>
                                )}

                                {isOut ? (
                                  <span className="text-[10px] font-extrabold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900 whitespace-nowrap">
                                    Rupture
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md whitespace-nowrap">
                                    Stock : {p.stockQuantity ?? 10}
                                  </span>
                                )}

                                {imgCount > 1 && (
                                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold hidden sm:inline">
                                    🖼️ {imgCount} photos
                                  </span>
                                )}

                                {p.sizes && p.sizes.length > 0 && (
                                  <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900 whitespace-nowrap">
                                    👟 {p.sizes.length} taille{p.sizes.length > 1 ? 's' : ''}
                                  </span>
                                )}

                                {p.colors && p.colors.length > 0 && (
                                  <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-900 inline-flex items-center gap-1.5 whitespace-nowrap">
                                    <span>🎨</span>
                                    <span className="inline-flex items-center gap-0.5">
                                      {p.colors.slice(0, 4).map((c) => {
                                        const cStyle = getColorStyle(c);
                                        return (
                                          <span
                                            key={c}
                                            className={`w-2 h-2 rounded-full inline-block ${cStyle.isLight ? 'border border-slate-400' : ''}`}
                                            style={{ background: cStyle.background }}
                                            title={c}
                                          />
                                        );
                                      })}
                                    </span>
                                    <span>{p.colors.length} couleur{p.colors.length > 1 ? 's' : ''}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions: Full-width toolbar on smartphone, inline on desktop */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(p)}
                              className="flex-1 sm:flex-initial py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
                              title="Modifier toutes les informations de l'article"
                            >
                              <Pencil className="w-3.5 h-3.5 text-sky-600" />
                              <span>Modifier</span>
                            </button>

                            {/* Visibility Toggle Button */}
                            <button
                              type="button"
                              onClick={() => onToggleProductVisibility && onToggleProductVisibility(p.id)}
                              className={`flex-1 sm:flex-initial py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                                isHidden
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : 'bg-white hover:bg-amber-50 hover:text-amber-800 text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-300'
                              }`}
                              title={isHidden ? "Article masqué. Cliquer pour réafficher dans la boutique" : "Article en ligne. Cliquer pour masquer de la boutique"}
                            >
                              {isHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Réafficher</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Masquer</span>
                                </>
                              )}
                            </button>

                            {/* Stock Toggle Button */}
                            <button
                              type="button"
                              onClick={() => onToggleProductStock && onToggleProductStock(p.id)}
                              className={`flex-1 sm:flex-initial py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 border ${
                                isOut
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                              title={isOut ? "Marquer comme En Stock (10 unités)" : "Marquer comme Rupture de Stock"}
                            >
                              <span>{isOut ? '+ En Stock' : 'Rupture'}</span>
                            </button>

                            {/* Permanent Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Supprimer définitivement "${p.title}" du catalogue ?\n\nAstuce : Si vous souhaitez simplement ne plus l'afficher aux clients pour l'instant, utilisez plutôt le bouton 'Masquer'.`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors active:scale-95"
                              title="Supprimer définitivement du catalogue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
