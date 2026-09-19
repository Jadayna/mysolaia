import React, { useState, useEffect } from 'react';
import { Camera, Trash2, ArrowLeft, Loader2, Package, Plus, X, ChevronDown, ChevronUp, Clock, Pencil, Check, Search, Star } from 'lucide-react';
import { useT } from '../i18n';
import api from '../lib/api';

// Catégories offertes à l'entrée manuelle
const CATEGORIES = [
  { value: 'nettoyant', fr: 'Nettoyant', en: 'Cleanser' },
  { value: 'exfoliant', fr: 'Exfoliant', en: 'Exfoliant' },
  { value: 'toner', fr: 'Tonique', en: 'Toner' },
  { value: 'serum', fr: 'Sérum', en: 'Serum' },
  { value: 'traitement_cible', fr: 'Traitement ciblé', en: 'Targeted treatment' },
  { value: 'yeux', fr: 'Contour des yeux', en: 'Eye care' },
  { value: 'hydratant', fr: 'Hydratant', en: 'Moisturizer' },
  { value: 'huile', fr: 'Huile', en: 'Oil' },
  { value: 'spf', fr: 'Protection solaire (SPF)', en: 'Sunscreen (SPF)' },
  { value: 'levres', fr: 'Lèvres', en: 'Lips' },
  { value: 'cils_sourcils', fr: 'Cils & sourcils', en: 'Lashes & brows' },
];

const MOMENTS = [
  { value: 'les_deux', fr: 'Les deux', en: 'Both' },
  { value: 'matin', fr: 'Matin', en: 'Morning' },
  { value: 'soir', fr: 'Soir', en: 'Evening' },
];

// Libellés traduits pour l'affichage (moment & catégorie) — Étape 4
const momentLabel = (value, lang) =>
  (MOMENTS.find((m) => m.value === value)?.[lang === 'fr' ? 'fr' : 'en']) || value;

const categoryLabel = (value, lang) => {
  const v = String(value || '').toLowerCase();
  return (CATEGORIES.find((c) => c.value === v)?.[lang === 'fr' ? 'fr' : 'en']) || value;
};

const PAO_OPTIONS = [
  { value: 0, fr: 'Non spécifié', en: 'Not specified' },
  { value: 3, fr: '3 mois (3M)', en: '3 months (3M)' },
  { value: 6, fr: '6 mois (6M)', en: '6 months (6M)' },
  { value: 12, fr: '12 mois (12M)', en: '12 months (12M)' },
  { value: 24, fr: '24 mois (24M)', en: '24 months (24M)' },
];

// Calcule l'état de fraîcheur du produit
const computeFreshness = (openedAt, paoMonths, lang) => {
  if (!openedAt || !paoMonths || paoMonths === 0) return null;
  const opened = new Date(openedAt);
  const expiry = new Date(opened);
  expiry.setMonth(expiry.getMonth() + parseInt(paoMonths, 10));

  const now = new Date();
  const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      label: lang === 'fr' ? `Périmé (${Math.abs(diffDays)}j)` : `Expired (${Math.abs(diffDays)}d ago)`,
    };
  }
  if (diffDays <= 30) {
    return {
      status: 'soon',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
      label: lang === 'fr' ? `Expire bientôt (${diffDays}j)` : `Expires soon (${diffDays}d)`,
    };
  }
  const monthsLeft = Math.round(diffDays / 30);
  return {
    status: 'fresh',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    label: lang === 'fr' ? `Frais (~${monthsLeft} mois)` : `Fresh (~${monthsLeft} mo)`,
  };
};

const LOADING_STEPS = {
  fr: ['Analyse du produit...', 'Lecture de la marque...', 'Identification de la catégorie...', 'Repérage des actifs...', 'Presque fini...'],
  en: ['Analyzing product...', 'Reading the brand...', 'Identifying the category...', 'Spotting the actives...', 'Almost done...'],
};

// Actifs reconnus par le moteur
const ACTIFS = [
  { value: 'retinol', fr: 'Rétinol', en: 'Retinol' },
  { value: 'vitamine_c', fr: 'Vitamine C', en: 'Vitamin C' },
  { value: 'aha', fr: 'AHA (glycolique, lactique)', en: 'AHA (glycolic, lactic)' },
  { value: 'bha', fr: 'BHA (salicylique)', en: 'BHA (salicylic)' },
  { value: 'niacinamide', fr: 'Niacinamide', en: 'Niacinamide' },
  { value: 'peroxyde_benzoyle', fr: 'Peroxyde de benzoyle', en: 'Benzoyl peroxide' },
  { value: 'acide_hyaluronique', fr: 'Acide hyaluronique', en: 'Hyaluronic acid' },
  { value: 'acide_azelaique', fr: 'Acide azélaïque', en: 'Azelaic acid' },
  { value: 'acide_mandelique', fr: 'Acide mandélique', en: 'Mandelic acid' },
  { value: 'peptides', fr: 'Peptides', en: 'Peptides' },
  { value: 'ceramides', fr: 'Céramides', en: 'Ceramides' },
  { value: 'squalane', fr: 'Squalane', en: 'Squalane' },
  { value: 'panthenol', fr: 'Panthénol (B5)', en: 'Panthenol (B5)' },
  { value: 'vitamine_e', fr: 'Vitamine E', en: 'Vitamin E' },
  { value: 'centella', fr: 'Centella (Cica)', en: 'Centella (Cica)' },
  { value: 'zinc', fr: 'Zinc', en: 'Zinc' },
  { value: 'allantoine', fr: 'Allantoïne', en: 'Allantoin' },
  { value: 'cafeine', fr: 'Caféine', en: 'Caffeine' },
];

const ACTIF_LABELS = {
  fr: { retinol: 'Rétinol', vitamine_c: 'Vitamine C', aha: 'AHA', bha: 'BHA', niacinamide: 'Niacinamide', peroxyde_benzoyle: 'Peroxyde benzoyle', acide_hyaluronique: 'Ac. hyaluronique', acide_azelaique: 'Ac. azélaïque', acide_mandelique: 'Ac. mandélique', peptides: 'Peptides', ceramides: 'Céramides', squalane: 'Squalane', panthenol: 'Panthénol', vitamine_e: 'Vitamine E', centella: 'Centella', zinc: 'Zinc', allantoine: 'Allantoïne', cafeine: 'Caféine' },
  en: { retinol: 'Retinol', vitamine_c: 'Vitamin C', aha: 'AHA', bha: 'BHA', niacinamide: 'Niacinamide', peroxyde_benzoyle: 'Benzoyl peroxide', acide_hyaluronique: 'Hyaluronic acid', acide_azelaique: 'Azelaic acid', acide_mandelique: 'Mandelic acid', peptides: 'Peptides', ceramides: 'Ceramides', squalane: 'Squalane', panthenol: 'Panthenol', vitamine_e: 'Vitamin E', centella: 'Centella', zinc: 'Zinc', allantoine: 'Allantoin', cafeine: 'Caffeine' },
};

const ScanScreen = ({ go }) => {
  const { lang } = useT();
const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('solaia_cached_shelf');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchNom = p.nom && p.nom.toLowerCase().includes(q);
    const matchBrand = (p.brand || p.marque || '').toLowerCase().includes(q);
    const matchCat = (p.categorie || p.category || '').toLowerCase().includes(q);
    const matchActifs = Array.isArray(p.actifs) && p.actifs.some((a) => a.toLowerCase().includes(q));
    return matchNom || matchBrand || matchCat || matchActifs;
  });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [toastMsg, setToastMsg] = useState(null);
  const [modalConfirm, setModalConfirm] = useState(null);
  const [showFirstScanTip, setShowFirstScanTip] = useState(() => {
    return !localStorage.getItem('solaia_first_scan_tip_seen');
  });

  // Formulaire d'édition / création manuelle
  const [showManual, setShowManual] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false); // Étape 2 : panneau des 3 options d'ajout
  const [editingShelfId, setEditingShelfId] = useState(null);
  const [savingManual, setSavingManual] = useState(false);
  const [mNom, setMNom] = useState('');
  const [mBrand, setMBrand] = useState('');
  const [mCat, setMCat] = useState('serum');
  const [mMoment, setMMoment] = useState('les_deux');
  const [mActifs, setMActifs] = useState([]);
  const [mOpenedAt, setMOpenedAt] = useState('');
  const [mPaoMonths, setMPaoMonths] = useState(0);
  const [mPhoto, setMPhoto] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/shelf');
      const data = res?.data?.shelf || res?.data || [];
      setProducts(Array.isArray(data) ? data : []);
  localStorage.setItem('solaia_cached_shelf', JSON.stringify(Array.isArray(data) ? data : []));      
    } catch (e) {
      console.error("Erreur chargement étagère :", e);
      setProducts([]);
    }
  };

  useEffect(() => {
    if (!loading) { setLoadingMsg(0); return; }
    const steps = LOADING_STEPS[lang === 'fr' ? 'fr' : 'en'];
    const id = setInterval(() => {
      setLoadingMsg((m) => Math.min(m + 1, steps.length - 1));
    }, 3500);
    return () => clearInterval(id);
  }, [loading, lang]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(lang === 'fr' ? 'Image trop lourde (max 8 Mo).' : 'Image too large (max 8 MB).');
      return;
    }

    setLoading(true);

    try {
      // 1. Compression et encodage de l'image
      const photoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1000;
            let w = img.width, h = img.height;
            if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
            else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });

      // 2. Scan avec Gemini
      const res = await api.post('/scan', { image_base64: photoDataUrl });

      if (res.data && res.data.product) {
        const prod = res.data.product;
        const brand = prod.brand || 'Marque inconnue';
        const nom = prod.nom || 'Soin du visage';
        const cat = (prod.categorie || prod.category || 'serum').toLowerCase();
        const actifs = Array.isArray(prod.actifs) ? prod.actifs : [];
        const pao = Number(prod.pao_mois) || 6;
        const dateOuverture = prod.date_ouverture || new Date().toISOString().split('T')[0];

        // 3. Vérification de doublon
        const nomClean = nom.toLowerCase().trim();
        const existing = products.find((p) => p.nom && p.nom.toLowerCase().trim() === nomClean);
        if (existing) {
          const proceed = await new Promise((resolve) => {
            setModalConfirm({
              title: lang === 'fr' ? 'Produit déjà présent' : 'Product already exists',
              text: lang === 'fr'
                ? `"${nom}" est déjà sur ton étagère. Souhaites-tu vraiment l'ajouter en double ?`
                : `"${nom}" is already on your shelf. Do you really want to add a duplicate?`,
              confirmLabel: lang === 'fr' ? 'Ajouter quand même' : 'Add anyway',
              cancelLabel: lang === 'fr' ? 'Annuler' : 'Cancel',
              onConfirm: () => resolve(true),
              onCancel: () => resolve(false),
            });
          });
          setModalConfirm(null);
          if (!proceed) {
            setLoading(false);
            return;
          }
        }

        // 4. Ajout DIRECT à l'étagère !
        await api.post('/shelf/manual', {
          brand: brand,
          nom: nom,
          categorie: cat,
          actifs: actifs,
          texture: 3,
          moment: 'les_deux',
          photo_url: photoDataUrl,
          date_ouverture: dateOuverture,
          pao_mois: pao,
        });

        await fetchProducts();
        setShowManual(false);

        // Toast de confirmation magique
        setToastMsg(`${nom} ${lang === 'fr' ? 'ajouté à ton étagère ✨' : 'added to your shelf ✨'}`);
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        alert(lang === 'fr' ? 'Produit non reconnu. Essaie avec un meilleur éclairage.' : 'Product not recognized. Try with better lighting.');
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403) {
        setModalConfirm({
          title: lang === 'fr' ? 'Étagère Complète ✨' : 'Shelf Full ✨',
          text: lang === 'fr'
            ? 'Tu as atteint la limite de 5 produits du plan gratuit. Débloque MySolaia Illimité pour ajouter tous tes soins sans restriction !'
            : 'You have reached the 5-product limit on the free tier. Unlock MySolaia Unlimited to organize all your skincare without limits!',
          confirmLabel: lang === 'fr' ? 'Débloquer l\'accès' : 'Unlock access',
          cancelLabel: lang === 'fr' ? 'Plus tard' : 'Later',
          onConfirm: () => {
            setModalConfirm(null);
            go('trial'); // Redirige directement vers l'écran d'abonnement !
          },
          onCancel: () => setModalConfirm(null),
        });
      } else {
        setModalConfirm({
          title: lang === 'fr' ? 'Oups !' : 'Oops!',
          text: lang === 'fr' ? 'Erreur lors du scan. Vérifie l\'éclairage et réessaie.' : 'Scan error. Check the lighting and try again.',
          confirmLabel: 'OK',
          cancelLabel: lang === 'fr' ? 'Fermer' : 'Close',
          onConfirm: () => setModalConfirm(null),
          onCancel: () => setModalConfirm(null),
        });
      }
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const toggleActif = (value) => {
    setMActifs((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const handleEditProduct = (p) => {
    setEditingShelfId(p.shelf_id || p.id);
    setMNom(p.nom || '');
    setMBrand(p.brand || p.marque || '');
    setMCat(p.categorie || 'serum');
    setMMoment(p.moment || 'les_deux');
    setMActifs(Array.isArray(p.actifs) ? p.actifs : []);
    setMPhoto(p.photo_url || null);
    setMOpenedAt(p.date_ouverture || '');
    setMPaoMonths(p.pao_mois || 0);
    setShowManual(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const saveManual = async () => {
    if (!mNom.trim() || !mBrand.trim()) {
      alert(lang === 'fr' ? 'Entre au moins le nom et la marque.' : 'Enter at least the name and brand.');
      return;
    }

    if (editingShelfId) {
      // En mode édition : supprimer l'ancienne version puis réinsérer la mise à jour
      try { await api.delete(`/shelf/${editingShelfId}`); } catch {}
      setEditingShelfId(null);
    } else {
      // Vérification de doublon seulement lors d'un ajout neuf
      const nomClean = mNom.trim().toLowerCase();
      const existing = products.find((p) => p.nom && p.nom.toLowerCase() === nomClean);

      if (existing) {
        const confirmMsg = lang === 'fr'
          ? `"${existing.nom}" semble déjà être sur ton étagère. Veux-tu l'ajouter une deuxième fois ?`
          : `"${existing.nom}" seems to already be on your shelf. Do you want to add it again?`;
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }
    }

    setSavingManual(true);
    try {
      await api.post('/shelf/manual', {
        brand: mBrand.trim(),
        nom: mNom.trim(),
        categorie: mCat,
        actifs: mActifs,
        texture: 3,
        moment: mMoment,
        photo_url: mPhoto,
        date_ouverture: mOpenedAt || null,
        pao_mois: Number(mPaoMonths) || 0,
      });
      await fetchProducts();
      setMNom(''); setMBrand(''); setMCat('serum'); setMMoment('les_deux'); setMActifs([]);
      setMOpenedAt('');
      setMPaoMonths(0);
      setMPhoto(null);
      setShowManual(false);
   } catch (e) {
      if (e?.response?.status === 403) {
        setModalConfirm({
          title: lang === 'fr' ? 'Étagère Complète ✨' : 'Shelf Full ✨',
          text: lang === 'fr'
            ? 'Tu as atteint la limite de 5 produits du plan gratuit. Débloque MySolaia Illimité pour ajouter tous tes soins sans restriction !'
            : 'You have reached the 5-product limit on the free tier. Unlock MySolaia Unlimited to organize all your skincare without limits!',
          confirmLabel: lang === 'fr' ? 'Débloquer l\'accès' : 'Unlock access',
          cancelLabel: lang === 'fr' ? 'Plus tard' : 'Later',
          onConfirm: () => {
            setModalConfirm(null);
            go('trial');
          },
          onCancel: () => setModalConfirm(null),
        });
      } else {
        setModalConfirm({
          title: lang === 'fr' ? 'Oups !' : 'Oops!',
          text: lang === 'fr' ? "Impossible d'enregistrer le produit." : "Could not save the product.",
          confirmLabel: 'OK',
          cancelLabel: lang === 'fr' ? 'Fermer' : 'Close',
          onConfirm: () => setModalConfirm(null),
          onCancel: () => setModalConfirm(null),
        });
      }
    } finally {
      setSavingManual(false);
    }
  };

  const handleDelete = async (shelfId) => {
    try {
      await api.delete(`/shelf/${shelfId}`);
      setProducts((prev) => prev.filter((p) => p.shelf_id !== shelfId && p.id !== shelfId));
    } catch (e) {
      console.error("Erreur suppression :", e);
    }
  };

  const handleShopProduct = (p) => {
    const brand = p.brand || p.marque || '';
    const nom = p.nom || '';
    const query = encodeURIComponent(`${brand} ${nom}`.trim());
    window.open(`https://www.google.com/search?tbm=shop&q=${query}`, '_blank', 'noopener,noreferrer');
  };

  const handleToggleFavorite = async (p, e) => {
    e.stopPropagation();
    const pid = p.shelf_id || p.id;
    const nextFav = !p.is_favorite;

    // 1. Changement visuel immédiat (l'étoile s'allume en doré en 0 seconde !)
    setProducts((prev) =>
      prev.map((item) => {
        const itemId = item.shelf_id || item.id;
        return itemId === pid ? { ...item, is_favorite: nextFav } : item;
      })
    );

    // 2. Sauvegarde sur le serveur
    try {
      await api.patch(`/shelf/${pid}/favorite`);
    } catch (err) {
      console.error("Erreur favori:", err);
    }
  };

  const handleToggle = async (shelfId) => {
    try {
      const res = await api.post(`/shelf/${shelfId}/toggle`);
      const actif = res?.data?.actif;
      setProducts((prev) => prev.map((p) =>
        (p.shelf_id === shelfId || p.id === shelfId) ? { ...p, actif } : p
      ));
    } catch (e) {
      console.error("Erreur toggle :", e);
    }
  };

  const inputStyle = { background: '#fff', border: '1px solid var(--line)', color: 'var(--ink)' };

  return (
    <div className="px-6 pt-6 pb-28 space-y-6 animate-fade-up">
      {/* Toast Notification Magique */}
      {toastMsg && (
        <div className="fixed top-5 left-4 right-4 z-50 p-3.5 rounded-[14px] shadow-lg flex items-center gap-2 animate-fade-down" style={{ background: 'var(--ink)', color: '#FAF6F0' }}>
          <Check size={16} style={{ color: 'var(--gold)' }} />
          <span className="font-body text-[12px] font-medium">{toastMsg}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={() => go('accueil')} className="p-2 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--cream-card)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Mon Étagère de Produits' : 'My Shelf of Products'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Prends une photo de l\'étiquette de ton produit' : 'Take a photo of your product label'}
          </p>
        </div>
      </div>

      {/* Zone d'ajout compacte — Étape 2 : un seul bouton, 3 options */}
      <div className="w-full">
        <button
          onClick={() => setShowAddOptions((v) => !v)}
          disabled={loading}
          className="w-full py-3.5 rounded-[16px] flex items-center justify-center gap-2 font-body text-[12px] uppercase tracking-caps font-semibold text-white active:scale-[0.98] transition-all shadow-sm"
          style={{ background: '#A37B68' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : (showAddOptions ? <ChevronUp size={18} /> : <Plus size={18} />)}
          {loading
            ? LOADING_STEPS[lang === 'fr' ? 'fr' : 'en'][loadingMsg]
            : (lang === 'fr' ? 'Ajouter un soin à mon étagère' : 'Add a product to my shelf')}
        </button>

        {showAddOptions && !loading && (
          <div className="mt-2 p-2 rounded-[16px] border animate-fade-up space-y-1" style={{ background: 'var(--cream-card)', borderColor: 'var(--line)' }}>
            <label className="w-full px-4 py-3 rounded-[12px] flex items-center gap-3 cursor-pointer font-body text-[13px] font-medium active:scale-[0.99] transition-all hover:bg-white" style={{ color: 'var(--ink)' }}>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" disabled={loading} />
              <span className="text-[18px]">📸</span>
              <span>{lang === 'fr' ? 'Prendre une photo' : 'Take a photo'}</span>
            </label>
            <label className="w-full px-4 py-3 rounded-[12px] flex items-center gap-3 cursor-pointer font-body text-[13px] font-medium active:scale-[0.99] transition-all hover:bg-white" style={{ color: 'var(--ink)' }}>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={loading} />
              <span className="text-[18px]">🖼️</span>
              <span>{lang === 'fr' ? 'Choisir dans la galerie' : 'Pick from gallery'}</span>
            </label>
            <button
              onClick={() => {
                setShowAddOptions(false);
                setEditingShelfId(null);
                setMNom(''); setMBrand(''); setMCat('serum'); setMMoment('les_deux'); setMActifs([]);
                setMPhoto(null); setMOpenedAt(''); setMPaoMonths(0);
                setShowManual(true);
              }}
              className="w-full px-4 py-3 rounded-[12px] flex items-center gap-3 font-body text-[13px] font-medium active:scale-[0.99] transition-all hover:bg-white text-left"
              style={{ color: 'var(--ink)' }}
            >
              <span className="text-[18px]">✍️</span>
              <span>{lang === 'fr' ? 'Saisir manuellement' : 'Enter manually'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Formulaire d'entrée manuelle / modification */}
      {showManual && (
        <div className="p-5 rounded-[20px] space-y-3 animate-fade-up" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[16px]" style={{ color: 'var(--ink)' }}>
              {editingShelfId 
                ? (lang === 'fr' ? 'Modifier le produit' : 'Edit product')
                : (lang === 'fr' ? 'Saisir manuellement' : 'Enter manually')}
            </h3>
            <button onClick={() => setShowManual(false)} className="p-1.5 rounded-full" style={{ background: '#fff', border: '1px solid var(--line)' }}>
              <X size={16} style={{ color: 'var(--ink-soft)' }} />
            </button>
          </div>

          <label className="block">
            <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{lang === 'fr' ? 'Nom du produit' : 'Product name'}</span>
            <input value={mNom} onChange={(e) => setMNom(e.target.value)} className="w-full mt-1 p-2.5 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
          </label>

          <label className="block">
            <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{lang === 'fr' ? 'Marque' : 'Brand'}</span>
            <input value={mBrand} onChange={(e) => setMBrand(e.target.value)} className="w-full mt-1 p-2.5 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
          </label>

          <label className="block">
            <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{lang === 'fr' ? 'Catégorie' : 'Category'}</span>
            <select value={mCat} onChange={(e) => setMCat(e.target.value)} className="w-full mt-1 p-2.5 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{lang === 'fr' ? c.fr : c.en}</option>
              ))}
            </select>
          </label>

          {/* Suivi PAO / Fraîcheur */}
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                {lang === 'fr' ? 'Ouvert le (optionnel)' : 'Opened on (optional)'}
              </span>
              <input 
                type="date" 
                value={mOpenedAt} 
                onChange={(e) => setMOpenedAt(e.target.value)} 
                className="w-full mt-1 p-2 rounded-[10px] font-body text-[12px] outline-none" 
                style={inputStyle} 
              />
            </label>

            <label className="block">
              <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                {lang === 'fr' ? 'Durée après ouverture' : 'Period after opening'}
              </span>
              <select 
                value={mPaoMonths} 
                onChange={(e) => setMPaoMonths(Number(e.target.value))} 
                className="w-full mt-1 p-2.5 rounded-[10px] font-body text-[12px] outline-none" 
                style={inputStyle}
              >
                {PAO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{lang === 'fr' ? opt.fr : opt.en}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{lang === 'fr' ? 'Moment' : 'When'}</span>
            <select value={mMoment} onChange={(e) => setMMoment(e.target.value)} className="w-full mt-1 p-2.5 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle}>
              {MOMENTS.map((m) => (
                <option key={m.value} value={m.value}>{lang === 'fr' ? m.fr : m.en}</option>
              ))}
            </select>
          </label>

          {/* Actifs (pour la détection d'incompatibilités) */}
          <div>
            <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr' ? 'Ingrédients actifs (optionnel)' : 'Active ingredients (optional)'}
            </span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {ACTIFS.map((a) => {
                const on = mActifs.includes(a.value);
                return (
                  <button key={a.value} type="button" onClick={() => toggleActif(a.value)}
                    className="px-2.5 py-1.5 rounded-full font-body text-[11px] transition-all"
                    style={on
                      ? { background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' }
                      : { background: '#fff', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>
                    {lang === 'fr' ? a.fr : a.en}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={saveManual} disabled={savingManual} className="gold-btn w-full rounded-[8px] py-3 mt-1 font-body tracking-caps text-[11px] uppercase">
            {savingManual 
              ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') 
              : (editingShelfId 
                  ? (lang === 'fr' ? 'Enregistrer les modifications' : 'Save changes')
                  : (lang === 'fr' ? 'Ajouter à mon étagère' : 'Add to my shelf'))}
          </button>
        </div>
      )}
      
      {/* Bulle pédagogique discrète pour le premier scan */}
      {showFirstScanTip && products.length > 0 && (
        <div className="p-4 rounded-[18px] shadow-sm animate-fade-up flex items-start gap-3 relative" style={{ background: 'rgba(182, 130, 53, 0.08)', border: '1px solid var(--gold-soft)' }}>
          <span className="text-[18px] leading-none shrink-0">💡</span>
          <div className="flex-1 pr-6">
            <h4 className="font-display text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? "Ton premier soin est classé !" : "Your first bottle is organized!"}
            </h4>
            <p className="font-body text-[12px] mt-1 leading-snug" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? "MySolaia a estimé sa fraîcheur (~6 mois). Touche ta bouteille pour voir sa fiche complète ou ajuster sa date d'ouverture !"
                : "MySolaia estimated its freshness (~6 months). Tap your bottle to view its details or adjust when you opened it!"}
            </p>
            <button
              onClick={() => {
                setShowFirstScanTip(false);
                localStorage.setItem('solaia_first_scan_tip_seen', 'true');
              }}
              className="mt-2.5 px-3 py-1 rounded-[8px] font-body text-[10.5px] uppercase tracking-caps font-semibold text-white transition-all active:scale-95"
              style={{ background: 'var(--gold)' }}
            >
              {lang === 'fr' ? "Compris ✨" : "Got it ✨"}
            </button>
          </div>
          <button
            onClick={() => {
              setShowFirstScanTip(false);
              localStorage.setItem('solaia_first_scan_tip_seen', 'true');
            }}
            className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-600"
          >
            <X size={15} />
          </button>
        </div>
      )}

    {/* Liste des produits avec Barre de Recherche & Scroll dédié */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-body text-[11px] uppercase tracking-caps font-semibold" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Mes produits enregistrés' : 'My saved products'} ({filteredProducts.length}{searchQuery ? ` / ${products.length}` : ''})
          </h3>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="font-body text-[10px] uppercase tracking-caps underline" style={{ color: 'var(--ink-faint)' }}>
              {lang === 'fr' ? 'Effacer' : 'Clear'}
            </button>
          )}
        </div>

        {/* Barre de Recherche Élégante */}
        {products.length > 2 && (
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher un soin, marque, actif...' : 'Search product, brand, active...'}
              className="w-full pl-9 pr-8 py-2.5 rounded-[12px] font-body text-[12px] outline-none transition-all"
              style={{ background: 'var(--cream-card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Zone de défilement dédiée aux produits */}
        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {filteredProducts.length === 0 ? (
            <div className="p-6 text-center rounded-[16px] border border-dashed" style={{ borderColor: 'var(--line)' }}>
              <Package size={28} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--ink-faint)' }} />
              <p className="font-body text-[13px]" style={{ color: 'var(--ink-faint)' }}>
                {searchQuery
                  ? (lang === 'fr' ? 'Aucun produit ne correspond à ta recherche.' : 'No products match your search.')
                  : (lang === 'fr' ? 'Aucun produit dans ton étagère pour l\'instant.' : 'No products on your shelf yet.')}
              </p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const pid = p.shelf_id || p.id;
              const actif = p.actif !== false;
              const isExpanded = expandedId === pid;
              return (
                <div key={pid} className="rounded-[16px] overflow-hidden shadow-sm transition-all" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)', opacity: actif ? 1 : 0.6 }}>
                  {/* Carte identique à avant */}
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : pid)}>
                    <div className="flex-1 pr-2">
                      <span className="font-body text-[9px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
                        {categoryLabel(p.categorie || p.category, lang) || (lang === 'fr' ? 'Soin' : 'Product')}
                      </span>
                      <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{p.nom}</p>
                      <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{p.brand || p.marque}</p>
                      
                      {/* Badge de Fraîcheur */}
                      {(() => {
                        const fresh = computeFreshness(p.date_ouverture, p.pao_mois, lang);
                        if (!fresh) return null;
                        return (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-[9px] font-semibold" style={{ background: fresh.bg, color: fresh.color }}>
                              <Clock size={10} />
                              <span>{fresh.label}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Étoile Favori / Prioritaire */}
                      <button
                        onClick={(e) => handleToggleFavorite(p, e)}
                        className="p-1.5 rounded-full transition-all active:scale-90 hover:bg-stone-100"
                        title={lang === 'fr' ? 'Définir comme favori / prioritaire' : 'Set as favorite / priority'}
                      >
                        <Star
                          size={15}
                          fill={p.is_favorite ? '#B68235' : 'transparent'}
                          stroke={p.is_favorite ? '#B68235' : '#a8a29e'}
                        />
                      </button>                      
                      <button
                        onClick={() => handleToggle(pid)}
                        className="px-2.5 py-1 rounded-full font-body text-[9px] uppercase tracking-caps transition-all"
                        style={actif
                          ? { background: 'rgba(182,130,53,0.12)', color: 'var(--gold)', border: '1px solid var(--gold-soft)' }
                          : { background: 'transparent', color: 'var(--ink-faint)', border: '1px solid var(--line)' }}
                      >
                        {actif ? (lang === 'fr' ? 'Actif' : 'On') : (lang === 'fr' ? 'Inactif' : 'Off')}
                      </button>
                      <button onClick={() => handleDelete(pid)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : pid)} className="p-1 text-stone-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Vue détaillée dépliable */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 border-t space-y-3 animate-fade-up" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex gap-3">
                        {/* Photo entière du flacon (format portrait vertical à gauche) */}
                        {p.photo_url && (
                          <div className="w-24 shrink-0 rounded-[12px] overflow-hidden bg-stone-100 border border-stone-200 shadow-sm flex items-center justify-center p-1" style={{ minHeight: '120px' }}>
                            <img src={p.photo_url} alt={p.nom} className="w-full h-auto max-h-36 object-contain rounded-[8px]" />
                          </div>
                        )}

                        {/* Informations alignées à droite */}
                        <div className="flex-1 space-y-2">
                          <div className="p-2 rounded-[10px] bg-white border border-stone-200">
                            <span className="text-stone-400 block text-[9px] uppercase tracking-caps">{lang === 'fr' ? 'Moment' : 'When'}</span>
                            <span className="font-medium text-[11px] text-stone-800 capitalize">{p.moment ? momentLabel(p.moment, lang) : (lang === 'fr' ? 'Tous les moments' : 'Anytime')}</span>
                          </div>

                          <div className="p-2 rounded-[10px] bg-white border border-stone-200">
                            <span className="text-stone-400 block text-[9px] uppercase tracking-caps">{lang === 'fr' ? 'Catégorie' : 'Category'}</span>
                            <span className="font-medium text-[11px] text-stone-800 capitalize">{categoryLabel(p.categorie || p.category, lang)}</span>
                          </div>

                          {Array.isArray(p.actifs) && p.actifs.length > 0 && (
                            <div>
                              <span className="text-stone-400 block text-[9px] uppercase tracking-caps mb-1">{lang === 'fr' ? 'Actifs' : 'Actives'}</span>
                              <div className="flex flex-wrap gap-1">
                                {p.actifs.flatMap((a) => String(a).split(',')).map((a) => a.trim()).filter(Boolean).map((a, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-full font-body text-[9px] font-semibold" style={{ background: 'rgba(182,130,53,0.12)', color: 'var(--gold)' }}>
                                    {(ACTIF_LABELS[lang === 'fr' ? 'fr' : 'en'][a]) || a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    {/* Boutons Racheter / Modifier côte à côte — Étape 3 */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShopProduct(p);
                        }}
                        className="flex-1 py-2.5 rounded-[10px] flex items-center justify-center gap-2 font-body text-[11px] uppercase tracking-caps font-semibold transition-all active:scale-[0.98]"
                        style={{
                          background: 'rgba(163, 123, 104, 0.1)',
                          border: '1px solid var(--gold-soft)',
                          color: 'var(--ink)'
                        }}
                      >
                        <span>🛒 {lang === 'fr' ? 'Racheter' : 'Restock'}</span>
                      </button>
                      <button
                        onClick={() => handleEditProduct(p)}
                        className="flex-1 py-2.5 rounded-[10px] flex items-center justify-center gap-1.5 font-body text-[11px] uppercase tracking-caps font-medium transition-all active:scale-[0.98] shadow-sm"
                        style={{ background: '#FAF6F0', border: '1px solid var(--line)', color: 'var(--ink)' }}
                      >
                        <span>✏️ {lang === 'fr' ? 'Modifier' : 'Edit'}</span>
                      </button>
                    </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    {/* Modale de Confirmation Chic MySolaia */}
      {modalConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-sm rounded-[20px] p-5 space-y-4 shadow-xl animate-fade-up" style={{ background: '#FAF6F0', border: '1px solid var(--gold-soft)' }}>
            <h3 className="font-display text-[17px] text-center" style={{ color: 'var(--ink)' }}>
              {modalConfirm.title}
            </h3>
            <p className="font-body text-[12px] text-center" style={{ color: 'var(--ink-soft)' }}>
              {modalConfirm.text}
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={modalConfirm.onCancel}
                className="py-2.5 rounded-[10px] font-body text-[11px] uppercase tracking-caps font-medium border"
                style={{ borderColor: 'var(--line)', background: '#fff', color: 'var(--ink-soft)' }}
              >
                {modalConfirm.cancelLabel}
              </button>
              <button
                onClick={modalConfirm.onConfirm}
                className="py-2.5 rounded-[10px] font-body text-[11px] uppercase tracking-caps font-semibold text-white gold-btn shadow-sm"
              >
                {modalConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanScreen;
