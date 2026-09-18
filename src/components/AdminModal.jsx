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
  Palette,
  Search,
  Star,
  Wand2,
  FileText,
  Cloud,
  CloudLightning,
  Link2,
  Copy,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Radio,
  QrCode,
  Download,
  Smartphone,
  Share2
} from 'lucide-react';
import { CATEGORIES } from '../data/initialProducts';
import { formatPrice, getProductMarketingLink } from '../utils/formatters';
import { 
  getStoredSpecialOffer, 
  saveSpecialOffer, 
  getStoredOrders, 
  updateOrderStatus, 
  deleteOrderFromStorage,
  addOrderToStorage,
  saveOrders
} from '../utils/storage';
import { WILAYAS } from '../data/wilayas';
import {
  generateDirectSyncLink,
  generateInitialProductsCode,
  downloadInitialProductsJs
} from '../utils/directSync.js';
import {
  getCloudConfig,
  saveCloudConfig,
  testFirebaseConnection,
  pushFullStoreToCloud,
  generateSmartphoneSyncLink,
  normalizeFirebaseUrl,
  fetchOrdersFromCloud
} from '../utils/cloudSync';
import { PRESET_COLORS, getColorStyle } from '../utils/colors';
import { 
  formatRawDescriptionToStructured, 
  PRO_DESCRIPTION_TEMPLATE_FR, 
  PRO_DESCRIPTION_TEMPLATE_AR 
} from '../utils/descriptionParser';
import ProductDescription from './ProductDescription';
import ColorImageBinder from './ColorImageBinder';

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
  onUpdateSpecialOffer,
  cloudSyncStatus = 'idle'
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'add', 'special_offer', 'manage'
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodFilter, setProdFilter] = useState('all'); // 'all', 'visible', 'hidden', 'outofstock'
  const [copiedProductId, setCopiedProductId] = useState(null);
  
  // Orders Management State
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('Tous');
  const [selectedMonth, setSelectedMonth] = useState('Tous');
  const [selectedYear, setSelectedYear] = useState('Toutes');

  // Manual Order Creation State
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPhoneBackup, setManualPhoneBackup] = useState('');
  const [manualWilaya, setManualWilaya] = useState('16 - Alger');
  const [manualAddress, setManualAddress] = useState('');
  const [manualProduct, setManualProduct] = useState('');
  const [manualSize, setManualSize] = useState('38');
  const [manualColor, setManualColor] = useState('Beige');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualPrice, setManualPrice] = useState(5900);
  const [manualShipping, setManualShipping] = useState(400);
  const [manualStatus, setManualStatus] = useState('En attente');
  const [manualNotes, setManualNotes] = useState('');
  const [manualOrderSuccess, setManualOrderSuccess] = useState(false);
  const [pasteInputText, setPasteInputText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);

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
  const [colorImageMap, setColorImageMap] = useState({});

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
  const [soColorsInput, setSoColorsInput] = useState(
    specialOffer && specialOffer.colors && specialOffer.colors.length > 0
      ? specialOffer.colors.join(', ')
      : ''
  );
  const [soColorImageMap, setSoColorImageMap] = useState(specialOffer?.colorImageMap || {});
  const [selectedSoProductId, setSelectedSoProductId] = useState(specialOffer?.productId || '');
  const [soSearchTerm, setSoSearchTerm] = useState('');

  // Filtered products list for special offer picker
  const filteredSoProducts = products.filter((p) => {
    if (!soSearchTerm.trim()) return true;
    const term = soSearchTerm.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(term) ||
      (p.titleAr || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  });

  const [formSuccess, setFormSuccess] = useState(false);
  const [soSuccess, setSoSuccess] = useState(false);

  // Description Structuring & Live Preview States
  const [showDescPreviewFr, setShowDescPreviewFr] = useState(false);
  const [showDescPreviewAr, setShowDescPreviewAr] = useState(false);
  const [showSoDescPreviewFr, setShowSoDescPreviewFr] = useState(false);

  // Cloud Synchronization State
  const [cloudConfig, setCloudConfig] = useState(getCloudConfig);
  const [cloudUrlInput, setCloudUrlInput] = useState(() => getCloudConfig().firebaseUrl || '');
  const [cloudAuthInput, setCloudAuthInput] = useState(() => getCloudConfig().authSecret || '');
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isPushingStore, setIsPushingStore] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedConfigSnippet, setCopiedConfigSnippet] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [copiedInitialJs, setCopiedInitialJs] = useState(false);

  // Direct 100% Frontend Sync Data (Zero Database)
  const directSyncInfo = generateDirectSyncLink(products, specialOffer);

  const handleCopyDirectLink = () => {
    if (!directSyncInfo.url) return;
    navigator.clipboard.writeText(directSyncInfo.url).then(() => {
      setCopiedDirectLink(true);
      setTimeout(() => setCopiedDirectLink(false), 3000);
    }).catch(() => {});
  };

  const handleDownloadInitialJs = () => {
    downloadInitialProductsJs(products);
  };

  const handleCopyInitialJs = () => {
    const code = generateInitialProductsCode(products);
    navigator.clipboard.writeText(code).then(() => {
      setCopiedInitialJs(true);
      setTimeout(() => setCopiedInitialJs(false), 3000);
    }).catch(() => {});
  };

  // Refresh cloud config state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const cfg = getCloudConfig();
      setCloudConfig(cfg);
      setCloudUrlInput(cfg.firebaseUrl || '');
      setCloudAuthInput(cfg.authSecret || '');
      setTestResult(null);
      setPushResult(null);
    }
  }, [isOpen]);

  // Real-time listen for cloud-synced orders to refresh orders tab dynamically
  useEffect(() => {
    const handleCloudOrders = (e) => {
      if (Array.isArray(e.detail)) {
        setOrders(e.detail);
      }
    };
    window.addEventListener('zoom_market_cloud_orders_synced', handleCloudOrders);
    return () => window.removeEventListener('zoom_market_cloud_orders_synced', handleCloudOrders);
  }, []);

  const handleTestConnection = async () => {
    if (!cloudUrlInput.trim()) {
      setTestResult({ success: false, error: 'Veuillez saisir l\'URL de votre base Firebase Realtime Database.' });
      return;
    }
    setIsTestingCloud(true);
    setTestResult(null);
    try {
      const res = await testFirebaseConnection(cloudUrlInput, cloudAuthInput);
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message || 'Erreur inattendue de connexion' });
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleSaveCloudSettings = () => {
    const cleanUrl = normalizeFirebaseUrl(cloudUrlInput);
    if (!cleanUrl) {
      setTestResult({ success: false, error: 'Veuillez saisir une URL Firebase valide (ex: https://mon-projet-default-rtdb.firebaseio.com).' });
      return;
    }
    const updated = saveCloudConfig({
      firebaseUrl: cleanUrl,
      authSecret: cloudAuthInput.trim(),
      enabled: true
    });
    setCloudConfig(updated);
    setTestResult({ success: true, message: 'Configuration sauvegardée ! La synchronisation en temps réel est active.' });
  };

  const handlePushFullStore = async () => {
    setIsPushingStore(true);
    setPushResult(null);
    try {
      const ok = await pushFullStoreToCloud({ products, specialOffer, orders });
      if (ok) {
        setPushResult({
          success: true,
          message: `Synchronisation réussie ! Vos ${products.length} produits, l'offre spéciale et vos commandes sont maintenant publiés dans le Cloud. Vos smartphones affichent désormais exactement ce catalogue.`
        });
      } else {
        setPushResult({
          success: false,
          error: 'Échec de la synchronisation. Vérifiez l\'URL Firebase et que vos Règles (Rules) sont configurées sur ".read": true, ".write": true.'
        });
      }
    } catch (err) {
      setPushResult({ success: false, error: err.message || 'Erreur lors de la synchronisation' });
    } finally {
      setIsPushingStore(false);
    }
  };

  const handleCopySmartphoneLink = () => {
    const link = generateSmartphoneSyncLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {});
  };

  const handleCopyConfigSnippet = () => {
    const cleanUrl = normalizeFirebaseUrl(cloudUrlInput);
    const snippet = `VITE_FIREBASE_DATABASE_URL=${cleanUrl}`;
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedConfigSnippet(true);
      setTimeout(() => setCopiedConfigSnippet(false), 3000);
    }).catch(() => {});
  };

  const handleFormatDescriptionFr = () => {
    if (!description.trim()) return;
    setDescription(formatRawDescriptionToStructured(description));
  };

  const handleInsertTemplateFr = () => {
    if (description.trim() && !window.confirm("Remplacer la description actuelle par le modèle professionnel structuré ?")) {
      return;
    }
    setDescription(PRO_DESCRIPTION_TEMPLATE_FR.replace('[Nom du produit]', title.trim() || 'Chaussures'));
  };

  const handleFormatDescriptionAr = () => {
    if (!descriptionAr.trim()) return;
    setDescriptionAr(formatRawDescriptionToStructured(descriptionAr));
  };

  const handleInsertTemplateAr = () => {
    if (descriptionAr.trim() && !window.confirm("استبدال الوصف الحالي بالنموذج الاحترافي المنسق؟")) {
      return;
    }
    setDescriptionAr(PRO_DESCRIPTION_TEMPLATE_AR.replace('[اسم المنتج]', titleAr.trim() || title.trim() || 'المنتج'));
  };

  const handleFormatSoDescriptionFr = () => {
    if (!soDescription.trim()) return;
    setSoDescription(formatRawDescriptionToStructured(soDescription));
  };

  const handleInsertSoTemplateFr = () => {
    if (soDescription.trim() && !window.confirm("Remplacer la description de l'offre par le modèle structuré ?")) {
      return;
    }
    setSoDescription(PRO_DESCRIPTION_TEMPLATE_FR.replace('[Nom du produit]', soTitle.trim() || 'Offre Spéciale'));
  };

  // Manual Refresh & Sync State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [refreshToast, setRefreshToast] = useState(false);

  // Manual refresh function triggered by clicking the rounded arrow button or sync
  const handleRefreshOrders = async () => {
    setIsRefreshing(true);
    try {
      const cloudOrders = await fetchOrdersFromCloud();
      if (cloudOrders && cloudOrders.length > 0) {
        const localOrders = getStoredOrders();
        const merged = [...localOrders];
        let hasNew = false;
        cloudOrders.forEach((co) => {
          if (!merged.some((m) => m.id === co.id)) {
            merged.unshift(co);
            hasNew = true;
          }
        });
        if (hasNew) {
          saveOrders(merged, false);
        }
        setOrders(merged);
      } else {
        setOrders(getStoredOrders());
      }
    } catch (e) {
      setOrders(getStoredOrders());
    }
    setLastRefreshedAt(new Date().toLocaleTimeString('fr-DZ'));
    setRefreshToast(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
    setTimeout(() => {
      setRefreshToast(false);
    }, 3000);
  };

  // Wilaya selection change updates default delivery fee automatically
  const handleManualWilayaChange = (wilayaName) => {
    setManualWilaya(wilayaName);
    const found = WILAYAS.find((w) => w.name === wilayaName);
    if (found) {
      setManualShipping(found.fee);
    }
  };

  // Helper parser for orders pasted directly from EmailJS or WhatsApp notification
  const handleParsePastedOrder = () => {
    if (!pasteInputText.trim()) return;
    const text = pasteInputText;

    // Nom client:
    const nameMatch = text.match(/(?:Nom\s*(?:&|\/)?\s*Pr[eé]nom|Nom|Client)\s*[:=]\s*([^\r\n]+)/i);
    if (nameMatch && nameMatch[1]) setManualCustomerName(nameMatch[1].trim());

    // Numéro de téléphone:
    const phoneMatch = text.match(/(?:T[eé]l[eé]phone|T[eé]l|Phone|Mobile)\s*[:=]\s*([0-9\s+]+)/i);
    if (phoneMatch && phoneMatch[1]) setManualPhone(phoneMatch[1].trim());

    // Wilaya:
    const wilayaMatch = text.match(/Wilaya\s*[:=]\s*([^\r\n]+)/i);
    if (wilayaMatch && wilayaMatch[1]) {
      const parsedWilayaStr = wilayaMatch[1].trim();
      const matched = WILAYAS.find((w) => 
        parsedWilayaStr.toLowerCase().includes(w.name.toLowerCase().replace(/^\d+\s*-\s*/, '')) ||
        w.name.toLowerCase().includes(parsedWilayaStr.toLowerCase())
      );
      if (matched) {
        setManualWilaya(matched.name);
        setManualShipping(matched.fee);
      } else {
        setManualWilaya(parsedWilayaStr);
      }
    }

    // Adresse ou Commune:
    const addrMatch = text.match(/(?:Adresse|Commune|Ville)\s*[:=]\s*([^\r\n]+)/i);
    if (addrMatch && addrMatch[1]) setManualAddress(addrMatch[1].trim());

    // Taille / Pointure:
    const sizeMatch = text.match(/(?:Taille|Pointure|Size)\s*[:=]\s*([^\r\n,\s]+)/i);
    if (sizeMatch && sizeMatch[1]) setManualSize(sizeMatch[1].trim());

    // Couleur:
    const colorMatch = text.match(/(?:Couleur|Color)\s*[:=]\s*([^\r\n,\s]+)/i);
    if (colorMatch && colorMatch[1]) setManualColor(colorMatch[1].trim());

    // Quantité:
    const qtyMatch = text.match(/(?:Quantit[eé]|Qt[eé]|Qty)\s*[:=]\s*(\d+)/i);
    if (qtyMatch && qtyMatch[1]) setManualQuantity(parseInt(qtyMatch[1], 10));

    setShowPasteBox(false);
  };

  // Submit and save manual order into storage
  const handleCreateManualOrder = (e) => {
    if (e) e.preventDefault();
    if (!manualCustomerName.trim() || !manualPhone.trim()) {
      alert('Veuillez renseigner au moins le nom et le numéro de téléphone du client.');
      return;
    }

    const priceNum = Number(manualPrice) || 5900;
    const qtyNum = Number(manualQuantity) || 1;
    const shippingNum = Number(manualShipping) || 0;
    const defaultProductTitle = products[0]?.title || 'تصميم UGG طبي أصلي';

    const orderData = {
      customer: {
        fullName: manualCustomerName.trim(),
        phone: manualPhone.trim(),
        phoneBackup: manualPhoneBackup.trim(),
        wilaya: manualWilaya,
        address: manualAddress.trim() || manualWilaya,
        notes: manualNotes.trim()
      },
      items: [
        {
          title: manualProduct || defaultProductTitle,
          price: priceNum,
          quantity: qtyNum,
          selectedSize: manualSize || '38',
          selectedColor: manualColor || 'Beige'
        }
      ],
      subtotal: priceNum * qtyNum,
      shippingFee: shippingNum,
      total: (priceNum * qtyNum) + shippingNum,
      date: new Date().toLocaleDateString('fr-DZ'),
      status: manualStatus || 'En attente'
    };

    const updated = addOrderToStorage(orderData);
    setOrders(updated);
    setManualOrderSuccess(true);
    setTimeout(() => {
      setManualOrderSuccess(false);
      setShowManualOrderModal(false);
      setManualCustomerName('');
      setManualPhone('');
      setManualPhoneBackup('');
      setManualAddress('');
      setManualNotes('');
      setPasteInputText('');
    }, 1000);
  };

  // Load orders when modal is open and auto-listen for new incoming orders
  useEffect(() => {
    if (isOpen) {
      setOrders(getStoredOrders());
      setLastRefreshedAt(new Date().toLocaleTimeString('fr-DZ'));

      // If cloud is configured, automatically fetch latest orders from cloud
      const cfg = getCloudConfig();
      if (cfg.firebaseUrl) {
        fetchOrdersFromCloud().then((cloudOrders) => {
          if (cloudOrders && cloudOrders.length > 0) {
            const localOrders = getStoredOrders();
            const merged = [...localOrders];
            let hasNew = false;
            cloudOrders.forEach((co) => {
              if (!merged.some((m) => m.id === co.id)) {
                merged.unshift(co);
                hasNew = true;
              }
            });
            if (hasNew) {
              saveOrders(merged, false);
              setOrders(merged);
            }
          }
        }).catch(() => {});
      }

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
    setColorImageMap((prevMap) => {
      const newMap = {};
      for (const [col, val] of Object.entries(prevMap || {})) {
        if (typeof val === 'number') {
          if (val !== index) {
            newMap[col] = val > index ? val - 1 : val;
          }
        } else {
          newMap[col] = val;
        }
      }
      return newMap;
    });
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
    setSoColorImageMap((prevMap) => {
      const newMap = {};
      for (const [col, val] of Object.entries(prevMap || {})) {
        if (typeof val === 'number') {
          if (val !== index) {
            newMap[col] = val > index ? val - 1 : val;
          }
        } else {
          newMap[col] = val;
        }
      }
      return newMap;
    });
  };

  const handleSelectProductForSpecialOffer = (prodId, autoPublish = false) => {
    const p = products.find((item) => item.id === prodId);
    if (p) {
      setSelectedSoProductId(p.id);
      setSoTitle(p.title);
      setSoTitleAr(p.titleAr || '');
      setSoPrice(p.price);
      setSoOldPrice(p.oldPrice || Math.round(p.price * 1.25));
      setSoCategory(p.category || 'High-Tech');
      setSoDescription(p.description || '');
      setSoDescriptionAr(p.descriptionAr || '');
      const pImages = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
      setSoImageFiles(pImages);
      setSoUrlsText('');
      setSoColorsInput(p.colors && p.colors.length > 0 ? p.colors.join(', ') : '');
      setSoColorImageMap(p.colorImageMap || {});
      setSoEnabled(true);

      if (autoPublish) {
        const updatedOffer = {
          enabled: true,
          tagline: soTagline.trim() || 'Vente Flash 24H ⚡',
          seasonBadge: soSeasonBadge.trim() || 'Arrivage Spécial Saison ☀️',
          title: p.title,
          titleAr: p.titleAr || p.title,
          price: parseFloat(p.price),
          oldPrice: p.oldPrice ? parseFloat(p.oldPrice) : Math.round(p.price * 1.25),
          category: p.category || 'High-Tech',
          description: p.description || '',
          descriptionAr: p.descriptionAr || p.description || '',
          images: pImages,
          colors: p.colors || [],
          sizes: p.sizes || [],
          colorImageMap: p.colorImageMap || {},
          productId: p.id,
          countdownHours: 24
        };
        onUpdateSpecialOffer(updatedOffer);
        saveSpecialOffer(updatedOffer);
        setSoSuccess(true);
        setTimeout(() => setSoSuccess(false), 2500);
      }
    }
  };

  const handleSetProductAsSpecialOfferFromManage = (prod) => {
    handleSelectProductForSpecialOffer(prod.id, false);
    setActiveTab('special_offer');
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
    setColorImageMap(prod.colorImageMap || {});
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
    setColorImageMap({});
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
        colorImageMap: colorImageMap,
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
      colorImageMap: colorImageMap,
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
    const defaultFallback = "./products/ugg-1.jpg";
    const finalImages = allImages.length > 0 ? allImages : [defaultFallback];

    const parsedSoColors = soColorsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const targetProduct = products.find((p) => p.id === (selectedSoProductId || specialOffer?.productId));
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
      colors: parsedSoColors.length > 0 ? parsedSoColors : (targetProduct?.colors || specialOffer?.colors || []),
      sizes: targetProduct?.sizes || specialOffer?.sizes || [],
      colorImageMap: Object.keys(soColorImageMap).length > 0
        ? soColorImageMap
        : (targetProduct?.colorImageMap || specialOffer?.colorImageMap || {}),
      productId: selectedSoProductId || specialOffer?.productId || null,
      countdownHours: 24
    };

    onUpdateSpecialOffer(updatedOffer);
    saveSpecialOffer(updatedOffer);
    setSoSuccess(true);
    setTimeout(() => setSoSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-brand-navy/60 backdrop-blur-sm animate-fadeIn">
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

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>📲 Synchro & Déploiement</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Automatisé
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 overflow-x-hidden">
          
          {/* TAB 1: CLIENT ORDERS LISTING WITH DATE & MONTH FILTERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Sync & Order Reception Info Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-orange text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span>Commandes reçues par Email (marketdzzoom@gmail.com)</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                        Email 100% Fonctionnel
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Chaque commande passée sur smartphone arrive directement dans votre boîte Gmail. Pour afficher vos commandes reçues sur ce tableau de bord PC, cliquez simplement sur <strong>« + Saisir commande »</strong>, ou connectez Firebase pour une synchronisation automatique en direct !
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowManualOrderModal(true)}
                    className="px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                    title="Enregistrer manuellement une commande reçue par Email ou Téléphone"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Saisir commande</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cloud')}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-orange text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1"
                    title="Voir les options de synchronisation multi-appareils"
                  >
                    <CloudLightning className="w-3.5 h-3.5 text-amber-500" />
                    <span>Synchro Cloud</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar with Month, Year & Status Selectors */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-brand-orange" />
                    Filtrer les Commandes par Période (Mois / Année) & Statut
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Bouton pour ajouter manuellement une commande reçue par email */}
                    <button
                      type="button"
                      onClick={() => setShowManualOrderModal(true)}
                      className="px-3 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                      title="Enregistrer manuellement une commande reçue par Email, WhatsApp ou Appel"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Saisir commande</span>
                    </button>

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
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
                  <ClipboardList className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Aucune commande enregistrée sur cet appareil ({selectedMonth !== 'Tous' || selectedYear !== 'Toutes' || orderStatusFilter !== 'Tous' ? 'pour ces filtres' : 'actuellement'})
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Les commandes passées par vos clients sur leur smartphone arrivent directement par email sur <strong className="text-slate-700 dark:text-slate-300 font-mono">marketdzzoom@gmail.com</strong>.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowManualOrderModal(true)}
                      className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Saisir la commande reçue par Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshOrders}
                      disabled={isRefreshing}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-orange rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-brand-orange ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  </div>
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
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description & Présentation (Français) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleFormatDescriptionFr}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="Organiser et aérer automatiquement le texte en sections et puces nettes"
                    >
                      <Wand2 className="w-3 h-3 text-amber-600" />
                      <span>🪄 Structurer</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertTemplateFr}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="Insérer un modèle complet de description e-commerce structuré"
                    >
                      <FileText className="w-3 h-3 text-brand-orange" />
                      <span>📋 Modèle Pro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDescPreviewFr((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 border shadow-2xs ${
                        showDescPreviewFr
                          ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                      title="Afficher le rendu réel tel qu'il sera vu par les clients"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{showDescPreviewFr ? 'Masquer aperçu' : '👁️ Aperçu client'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Ex: ✨ [Nom de l'article] – Qualité & Élégance ✨&#10;&#10;Présentation soignée de votre produit et de ses atouts pour le client.&#10;&#10;• Caractéristique 1 : Description du point fort&#10;• Spécifications : Détails techniques ou de conception&#10;• Couleurs disponibles : Beige, Marron, Noir&#10;&#10;🚚 Livraison : Disponible dans 58 Wilayas à domicile&#10;🤝 Paiement : À la réception après vérification&#10;📞 Pour commander : 0663 08 50 69"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-normal leading-relaxed"
                  required
                />

                {showDescPreviewFr && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-brand-orange/40 shadow-xs">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold text-brand-orange flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Rendu réel de la description (Fiche Produit) :
                      </span>
                      <span className="text-[10px] text-slate-400">Interactif</span>
                    </div>
                    {description.trim() ? (
                      <ProductDescription description={description} lang="fr" />
                    ) : (
                      <p className="text-xs text-slate-400 italic">Saisissez du texte ci-dessus pour voir l'aperçu en direct.</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2" dir="rtl">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    وصف المنتج والتقديم (بالعربية)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap" dir="rtl">
                    <button
                      type="button"
                      onClick={handleFormatDescriptionAr}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="ترتيب الأسطر والفقرات تلقائياً بشكل أنيق"
                    >
                      <Wand2 className="w-3 h-3 text-amber-600" />
                      <span>🪄 تنسيق تلقائي</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertTemplateAr}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="إدراج نموذج وصف متكامل واحترافي"
                    >
                      <FileText className="w-3 h-3 text-brand-orange" />
                      <span>📋 نموذج احترافي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDescPreviewAr((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 border shadow-2xs ${
                        showDescPreviewAr
                          ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                      title="معاينة شكل الوصف النهائي للزبائن"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{showDescPreviewAr ? 'إخفاء المعاينة' : '👁️ معاينة الزبون'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  rows={5}
                  placeholder="المواصفات، التفاصيل، المميزات بالعربية..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-normal leading-relaxed"
                  dir="rtl"
                />

                {showDescPreviewAr && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-brand-orange/40 shadow-xs" dir="rtl">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold text-brand-orange flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        المعاينة الحية للوصف (بطاقة المنتج) :
                      </span>
                      <span className="text-[10px] text-slate-400">تفاعلي</span>
                    </div>
                    {descriptionAr.trim() ? (
                      <ProductDescription description={descriptionAr} lang="ar" />
                    ) : (
                      <p className="text-xs text-slate-400 italic">اكتب النص أعلاه لمشاهدة المعاينة الحية.</p>
                    )}
                  </div>
                )}
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

                {/* Visual Color-to-Photo Binder */}
                {(() => {
                  const currentColors = colorsInput
                    .split(',')
                    .map((c) => c.trim())
                    .filter(Boolean);
                  const currentImages = [
                    ...imageFilesPreviews,
                    ...imageUrlsText
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  ];
                  if (currentColors.length > 0 && currentImages.length > 1) {
                    return (
                      <div className="pt-2">
                        <ColorImageBinder
                          colors={currentColors}
                          images={currentImages}
                          colorImageMap={colorImageMap}
                          onChange={setColorImageMap}
                          lang="fr"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
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

              {/* SÉLECTEUR VISUEL RAPIDE DE PRODUIT DU MAGASIN (1-CLIC) */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-br from-brand-orange/5 via-slate-50 to-slate-100 dark:from-brand-orange/10 dark:via-slate-850 dark:to-slate-900 rounded-2xl border-2 border-brand-orange/30 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-brand-orange text-white rounded-lg shadow-xs">
                      <Zap className="w-4 h-4 fill-current" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        Choisir un article déjà publié (Sélection Rapide ⚡)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cliquez sur un produit pour pré-remplir l'Offre Spéciale instantanément.
                      </p>
                    </div>
                  </div>

                  {selectedSoProductId && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Article lié</span>
                    </span>
                  )}
                </div>

                {/* Recherche d'article */}
                {products.length > 3 && (
                  <div className="relative">
                    <input
                      type="text"
                      value={soSearchTerm}
                      onChange={(e) => setSoSearchTerm(e.target.value)}
                      placeholder="Filtrer les articles par nom ou catégorie..."
                      className="w-full pl-8 pr-7 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none placeholder:text-slate-400"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {soSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setSoSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Grille / Liste visuelle défilante des produits */}
                {products.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                    Aucun produit dans le catalogue. Ajoutez d'abord un article dans l'onglet "Nouveau Produit".
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-inner">
                    {filteredSoProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Aucun article ne correspond à "{soSearchTerm}".
                      </div>
                    ) : (
                      filteredSoProducts.map((p) => {
                        const isSelected = selectedSoProductId === p.id || soTitle === p.title;
                        const primaryImg = p.images && p.images.length > 0 ? p.images[0] : p.image;
                        return (
                          <div
                            key={p.id}
                            className={`p-2.5 flex items-center justify-between gap-3 transition-colors ${
                              isSelected
                                ? 'bg-brand-orange/10 dark:bg-brand-orange/15'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={primaryImg}
                                alt={p.title}
                                className="w-10 h-10 object-cover rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                              />
                              <div className="min-w-0 text-left">
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {p.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="font-black text-brand-orange">
                                    {formatPrice(p.price)}
                                  </span>
                                  <span className="text-slate-400">
                                    • {p.category}
                                  </span>
                                  {p.badge && (
                                    <span className="text-slate-500 font-semibold">
                                      ({p.badge})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSelectProductForSpecialOffer(p.id, false)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border ${
                                  isSelected
                                    ? 'bg-brand-orange text-white border-brand-orange shadow-xs scale-105'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-orange/60'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Sélectionné</span>
                                  </>
                                ) : (
                                  <span>Choisir</span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectProductForSpecialOffer(p.id, true)}
                                className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                                title="Publier immédiatement cette offre spéciale sur le site"
                              >
                                <Zap className="w-3 h-3 fill-current" />
                                <span className="hidden sm:inline">Publier Direct</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Dropdown classique en appoint */}
                <div className="pt-1">
                  <select
                    value={selectedSoProductId}
                    onChange={(e) => handleSelectProductForSpecialOffer(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-brand-orange focus:outline-none"
                  >
                    <option value="">-- Ou choisir via la liste déroulante --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — ({formatPrice(p.price)})
                      </option>
                    ))}
                  </select>
                </div>
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
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description de l'Offre (Français)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleFormatSoDescriptionFr}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="Structurer automatiquement la description de l'offre spéciale"
                    >
                      <Wand2 className="w-3 h-3 text-amber-600" />
                      <span>🪄 Structurer</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertSoTemplateFr}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="Insérer un modèle complet de description e-commerce structuré"
                    >
                      <FileText className="w-3 h-3 text-brand-orange" />
                      <span>📋 Modèle Pro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSoDescPreviewFr((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 border shadow-2xs ${
                        showSoDescPreviewFr
                          ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                      title="Aperçu du rendu client de l'offre"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{showSoDescPreviewFr ? 'Masquer aperçu' : '👁️ Aperçu'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={soDescription}
                  onChange={(e) => setSoDescription(e.target.value)}
                  rows={5}
                  placeholder="Texte de présentation de l'offre spéciale..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-normal leading-relaxed"
                />
                {showSoDescPreviewFr && soDescription.trim() && (
                  <div className="mt-2.5 p-3.5 bg-brand-navy rounded-2xl border border-brand-orange/40 shadow-xs">
                    <span className="text-[11px] font-extrabold text-brand-orange block mb-2">
                      👁️ Rendu réel sur la bannière sombre du site :
                    </span>
                    <ProductDescription description={soDescription} lang="fr" theme="dark" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  وصف العرض الخاص (بالعربية)
                </label>
                <textarea
                  value={soDescriptionAr}
                  onChange={(e) => setSoDescriptionAr(e.target.value)}
                  rows={4}
                  placeholder="تفاصيل العرض الخاص بالعربية..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-normal leading-relaxed"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🎨 Couleurs de l'Offre Spéciale (séparées par des virgules)
                </label>
                <input
                  type="text"
                  value={soColorsInput}
                  onChange={(e) => setSoColorsInput(e.target.value)}
                  placeholder="Ex: Beige, Marron, Noir"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-medium"
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

                {/* Visual Color-to-Photo Binder for Special Offer */}
                {(() => {
                  const currentColors = soColorsInput
                    .split(',')
                    .map((c) => c.trim())
                    .filter(Boolean);
                  const currentImages = [
                    ...soImageFiles,
                    ...soUrlsText
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  ];
                  if (currentColors.length > 0 && currentImages.length > 1) {
                    return (
                      <div className="pt-2">
                        <ColorImageBinder
                          colors={currentColors}
                          images={currentImages}
                          colorImageMap={soColorImageMap}
                          onChange={setSoColorImageMap}
                          lang="fr"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
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
                {/* Cloud Sync Status Notification Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <CloudLightning className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {cloudSyncStatus === 'connected' ? (
                        <>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">● Synchro Cloud Active :</strong> Vos actions (masquage/démasquage, prix, stocks) sont diffusées en direct vers vos smartphones.
                        </>
                      ) : (
                        <>
                          <strong className="text-amber-600 dark:text-amber-400 font-bold">⚠️ Mode Local :</strong> Pour synchroniser vos smartphones et visiteurs en temps réel, configurez la Synchro Cloud.
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cloudSyncStatus === 'connected' && (
                      <button
                        type="button"
                        onClick={handlePushFullStore}
                        disabled={isPushingStore}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95"
                        title="Forcer la synchronisation de tout le catalogue vers le Cloud"
                      >
                        <RefreshCw className={`w-3 h-3 ${isPushingStore ? 'animate-spin' : ''}`} />
                        <span>Forcer Sync</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('cloud')}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-all"
                    >
                      Paramètres Cloud ☁️
                    </button>
                  </div>
                </div>

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
                      const isCurrentSpecialOffer = (specialOffer?.enabled !== false) && (
                        (selectedSoProductId && selectedSoProductId === p.id) ||
                        (specialOffer?.productId && specialOffer?.productId === p.id) ||
                        (specialOffer?.title && specialOffer?.title === p.title)
                      );

                      return (
                        <div 
                          key={p.id} 
                          className={`p-3.5 sm:p-4 rounded-2xl flex flex-col gap-3 transition-all border shadow-xs ${
                            isHidden 
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
                              : isCurrentSpecialOffer
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60'
                              : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Row 1: Product Details (Full Width, No Truncation) */}
                          <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              {/* Product Image */}
                              <div className="relative w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
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

                              {/* Title, Price & Badges */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white" title={p.title}>
                                    {p.title}
                                  </h4>
                                  <span className="text-sm font-extrabold text-brand-orange whitespace-nowrap">
                                    {formatPrice(p.price)}
                                  </span>
                                  {p.oldPrice && (
                                    <span className="text-xs text-slate-400 line-through whitespace-nowrap">
                                      {formatPrice(p.oldPrice)}
                                    </span>
                                  )}
                                </div>

                                {/* Badges in a clean horizontal flex-wrap line */}
                                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                  <span className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-md font-semibold">
                                    {p.category}
                                  </span>

                                  {isCurrentSpecialOffer && (
                                    <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-xs whitespace-nowrap">
                                      <Zap className="w-2.5 h-2.5 fill-white" />
                                      ⭐ Offre Spéciale
                                    </span>
                                  )}

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
                                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
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

                            {/* Top Right Quick Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Supprimer définitivement "${p.title}" du catalogue ?\n\nAstuce : Si vous souhaitez simplement ne plus l'afficher aux clients pour l'instant, utilisez plutôt le bouton 'Masquer'.`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors active:scale-95 shrink-0"
                              title="Supprimer définitivement du catalogue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Row 2: Action Toolbar (Dedicated Row, Perfectly Spaced) */}
                          <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex-wrap justify-end sm:justify-start">
                            {/* Copy Campaign Ad Link / Landing Page Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const link = getProductMarketingLink(p);
                                if (navigator?.clipboard?.writeText) {
                                  navigator.clipboard.writeText(link).then(() => {
                                    setCopiedProductId(p.id);
                                    setTimeout(() => setCopiedProductId(null), 2500);
                                  });
                                }
                              }}
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 border ${
                                copiedProductId === p.id
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                  : 'bg-white hover:bg-orange-50 hover:text-brand-orange hover:border-orange-300 text-slate-700 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-orange-950/30'
                              }`}
                              title="Copier le lien publicitaire direct (Landing Page) pour vos campagnes Facebook / TikTok / Instagram Ads"
                            >
                              {copiedProductId === p.id ? (
                                <>
                                  <CheckCheck className="w-3.5 h-3.5 text-white shrink-0" />
                                  <span>Lien copié !</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                                  <span>Lien Pub</span>
                                </>
                              )}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(p)}
                              className="py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
                              title="Modifier toutes les informations de l'article"
                            >
                              <Pencil className="w-3.5 h-3.5 text-sky-600" />
                              <span>Modifier</span>
                            </button>

                            {/* Set as Special Offer Button */}
                            <button
                              type="button"
                              onClick={() => handleSetProductAsSpecialOfferFromManage(p)}
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 border ${
                                isCurrentSpecialOffer
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-amber-950/30'
                              }`}
                              title={isCurrentSpecialOffer ? "Cet article est actuellement l'Offre Spéciale. Cliquer pour gérer" : "Définir comme l'Offre Spéciale du jour"}
                            >
                              <Zap className={`w-3.5 h-3.5 ${isCurrentSpecialOffer ? 'text-amber-600 fill-amber-500' : 'text-amber-500'}`} />
                              <span>{isCurrentSpecialOffer ? '⭐ En Offre' : 'Offre Spéciale'}</span>
                            </button>

                            {/* Visibility Toggle Button */}
                            <button
                              type="button"
                              onClick={() => onToggleProductVisibility && onToggleProductVisibility(p.id)}
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 ${
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
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border ${
                                isOut
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                              title={isOut ? "Marquer comme En Stock (10 unités)" : "Marquer comme Rupture de Stock"}
                            >
                              <span>{isOut ? '+ En Stock' : 'Rupture'}</span>
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

          {/* TAB 5: ZERO-DATABASE SMARTPHONE SYNCHRONIZATION & EXPORT */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 max-w-4xl mx-auto py-2">
              
              {/* Header Banner: Automated Sync Explained */}
              <div className="p-5 sm:p-6 rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Synchronisation 100% Automatisée (Zéro QR Code)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Vos Produits & Liens Pub en Temps Réel sur Smartphone</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Aucun client ne doit scanner de QR code ! Vos visiteurs venant de Facebook Ads, TikTok Ads ou WhatsApp ouvrent directement la page du produit et commandent en 1 clic.
                  </p>
                </div>
              </div>

              {/* CARD 1: AUTONOMOUS MARKETING LINKS (ZERO DB / ZERO SCAN) */}
              <div className="p-5 sm:p-6 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base">
                    <Share2 className="w-5 h-5 text-emerald-500" />
                    <span>Solution 1 : Liens Publicitaires Autonomes (Facebook, TikTok, Instagram)</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ⚡ 100% Automatisé & Zéro Scan
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>
                    Chaque bouton <strong className="text-brand-orange font-bold">« 🔗 Lien Pub »</strong> présent sur vos articles dans l'onglet <span className="font-bold text-slate-900 dark:text-white">Boutique</span> génère un lien prêt à l'emploi.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Autonomie Totale</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Le lien transporte les infos du produit (titre, prix, photos). Même un article tout juste créé s'affiche instantanément.</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Landing Page Directe</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Le client arrive directement sur la fiche avec le bouton d'achat express <strong className="text-slate-700 dark:text-slate-300">⚡ Acheter maintenant</strong>.</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Tous Réseaux Sociaux</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Parfait pour Facebook Ads, TikTok Ads, campagnes WhatsApp, stories Instagram ou messages directs.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: PERMANENT CATALOG EXPORT FOR ALL VISITORS */}
              <div className="p-5 sm:p-6 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base">
                    <Download className="w-5 h-5 text-sky-500" />
                    <span>Option 2 : Rendre Définitif pour TOUS les Visiteurs (GitHub Pages)</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    🌍 Pour Tous les Clients
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sur un site statique déployé sur GitHub Pages, le catalogue que voient les clients provient du fichier <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-sky-600 font-mono">src/data/initialProducts.js</code>. Pour que vos produits masqués soient appliqués automatiquement à <strong>chaque nouveau visiteur</strong> :
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadInitialJs}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 Télécharger initialProducts.js à jour</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyInitialJs}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-all flex items-center gap-2 active:scale-95"
                  >
                    {copiedInitialJs ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedInitialJs ? '✓ Code copié !' : '📋 Copier le code du catalogue'}</span>
                  </button>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                  <span className="text-base">💡</span>
                  <p className="leading-relaxed">
                    <strong>Astuce ultra-rapide :</strong> Vous pouvez simplement me dire dans ce chat quels articles vous avez masqués (par exemple "Masque la montre et le sac"), et je les enregistre directement dans votre projet ! Vous n'aurez qu'à faire un <code className="font-mono bg-white/60 dark:bg-black/30 px-1 rounded">git push</code>.
                  </p>
                </div>
              </div>

              {/* CARD 3: OPTIONAL FIREBASE SETTINGS (COLLAPSIBLE / OPTIONAL) */}
              <details className="group p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <summary className="cursor-pointer font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between list-none">
                  <span className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-slate-400" />
                    <span>Option Avancée : Base Google Firebase (Optionnel si vous le souhaitez plus tard)</span>
                  </span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <p className="text-[11px] text-slate-500">
                    Si vous souhaitez une synchronisation automatique en direct via le Cloud sans passer par un QR code :
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      URL Realtime Database (ex: https://mon-projet-default-rtdb.firebaseio.com)
                    </label>
                    <input
                      type="url"
                      value={cloudUrlInput}
                      onChange={(e) => setCloudUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCloudSettings}
                      disabled={!cloudUrlInput.trim()}
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={!cloudUrlInput.trim() || isTestingCloud}
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                    >
                      {isTestingCloud ? 'Test...' : 'Tester'}
                    </button>
                  </div>
                </div>
              </details>

            </div>
          )}

        </div>
      </div>

      {/* MODAL DE SAISIE MANUELLE DE COMMANDE */}
      {showManualOrderModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-850 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-orange text-white rounded-2xl shadow-sm">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Saisir une Commande Manuellement</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enregistrez une commande reçue par Email, Téléphone ou WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualOrderModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Toast */}
            {manualOrderSuccess && (
              <div className="m-4 p-3.5 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-black flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Commande enregistrée avec succès dans le tableau de bord !</span>
              </div>
            )}

            {/* Quick Paste Assistant from Email */}
            <div className="px-4 sm:px-5 pt-4">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Remplissage automatique depuis l'Email</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasteBox(!showPasteBox)}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    {showPasteBox ? 'Masquer' : 'Coller le texte de l\'email'}
                  </button>
                </div>
                {showPasteBox && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={pasteInputText}
                      onChange={(e) => setPasteInputText(e.target.value)}
                      placeholder="Collez ici le texte de l'email reçu (Nom, Téléphone, Wilaya, UGG...)"
                      rows={3}
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-sky-300 dark:border-sky-700 text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleParsePastedOrder}
                        disabled={!pasteInputText.trim()}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 disabled:opacity-50 transition-all"
                      >
                        Extraire les champs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Form */}
            <form onSubmit={handleCreateManualOrder} className="p-4 sm:p-5 space-y-4 max-h-[62vh] overflow-y-auto">
              
              {/* Customer Info Section */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  1. Coordonnées du Client
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nom & Prénom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                      placeholder="Ex: Sarah Benali"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Téléphone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="05 / 06 / 07..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Wilaya de Livraison <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={manualWilaya}
                      onChange={(e) => handleManualWilayaChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-medium"
                    >
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.name}>
                          {w.name} ({w.fee} DA)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Commune / Adresse
                    </label>
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="Ex: Cité 5 Juillet, Bâtiment B..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Product Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  2. Détails de l'Article
                </span>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Article sélectionné
                  </label>
                  <select
                    value={manualProduct}
                    onChange={(e) => {
                      const prodTitle = e.target.value;
                      setManualProduct(prodTitle);
                      const p = products.find((prod) => prod.title === prodTitle);
                      if (p) setManualPrice(p.price);
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title} - {formatPrice(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pointure
                    </label>
                    <input
                      type="text"
                      value={manualSize}
                      onChange={(e) => setManualSize(e.target.value)}
                      placeholder="38"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Couleur
                    </label>
                    <input
                      type="text"
                      value={manualColor}
                      onChange={(e) => setManualColor(e.target.value)}
                      placeholder="Beige"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Statut
                    </label>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    >
                      <option value="En attente">🟡 En attente</option>
                      <option value="Validé">🔵 Validé</option>
                      <option value="Livré">🟢 Livré</option>
                      <option value="Annulé">🔴 Annulé</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Prix unitaire (DA)
                    </label>
                    <input
                      type="number"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Livraison (DA)
                    </label>
                    <input
                      type="number"
                      value={manualShipping}
                      onChange={(e) => setManualShipping(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between font-black text-xs">
                <span className="text-slate-700 dark:text-slate-300">Total Commande à la livraison :</span>
                <span className="text-base text-brand-orange">
                  {formatPrice(((Number(manualPrice) || 0) * (Number(manualQuantity) || 1)) + (Number(manualShipping) || 0))}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualOrderModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer la commande</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
