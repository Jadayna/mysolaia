import React, { useState, useEffect } from 'react';
import { Camera, Trash2, ArrowLeft, Loader2, Package, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '../i18n';
import api from '../lib/api';

// Catégories offertes à l'entrée manuelle (valeur backend + libellés FR/EN)
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

const LOADING_STEPS = {
  fr: ['Analyse du produit...', 'Lecture de la marque...', 'Identification de la catégorie...', 'Repérage des actifs...', 'Presque fini...'],
  en: ['Analyzing product...', 'Reading the brand...', 'Identifying the category...', 'Spotting the actives...', 'Almost done...'],
};

// Actifs reconnus par le moteur (pour la détection d'incompatibilités)
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

// Libellés courts pour afficher les actifs sur les cartes
const ACTIF_LABELS = {
  fr: { retinol: 'Rétinol', vitamine_c: 'Vitamine C', aha: 'AHA', bha: 'BHA', niacinamide: 'Niacinamide', peroxyde_benzoyle: 'Peroxyde benzoyle', acide_hyaluronique: 'Ac. hyaluronique', acide_azelaique: 'Ac. azélaïque', acide_mandelique: 'Ac. mandélique', peptides: 'Peptides', ceramides: 'Céramides', squalane: 'Squalane', panthenol: 'Panthénol', vitamine_e: 'Vitamine E', centella: 'Centella', zinc: 'Zinc', allantoine: 'Allantoïne', cafeine: 'Caféine' },
  en: { retinol: 'Retinol', vitamine_c: 'Vitamin C', aha: 'AHA', bha: 'BHA', niacinamide: 'Niacinamide', peroxyde_benzoyle: 'Benzoyl peroxide', acide_hyaluronique: 'Hyaluronic acid', acide_azelaique: 'Azelaic acid', acide_mandelique: 'Mandelic acid', peptides: 'Peptides', ceramides: 'Ceramides', squalane: 'Squalane', panthenol: 'Panthenol', vitamine_e: 'Vitamin E', centella: 'Centella', zinc: 'Zinc', allantoine: 'Allantoin', cafeine: 'Caffeine' },
};

const ScanScreen = ({ go }) => {
  const { lang } = useT();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);

  // Entrée manuelle
  const [showManual, setShowManual] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [mNom, setMNom] = useState('');
  const [mBrand, setMBrand] = useState('');
  const [mCat, setMCat] = useState('serum');
  const [mMoment, setMMoment] = useState('les_deux');
  const [mActifs, setMActifs] = useState([]);
  const [detectedFromScan, setDetectedFromScan] = useState(false); // ← AJOUTER
  const [mPhoto, setMPhoto] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/shelf');
      const data = res?.data?.shelf || res?.data || [];
      setProducts(Array.isArray(data) ? data : []);
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

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64Image = await convertBase64(file);
      const res = await api.post('/scan', { image_base64: base64Image });

      if (res.data && res.data.product) {
        const prod = res.data.product;
        const validCats = CATEGORIES.map((c) => c.value);
        const detectedCat = (prod.categorie || prod.category || 'serum').toLowerCase();
        const rawActifs = Array.isArray(prod.actifs) ? prod.actifs : [];
        const validActifs = ACTIFS.map((a) => a.value);
        const cleaned = rawActifs.flatMap((a) => String(a).split(',')).map((a) => a.trim().toLowerCase()).filter((a) => validActifs.includes(a));
        // Pré-remplir le formulaire pour confirmation (au lieu d'ajouter à l'aveugle)
        setMNom(prod.nom || '');
        setMBrand(prod.brand || '');
        setMCat(validCats.includes(detectedCat) ? detectedCat : 'serum');
        setMActifs(cleaned);
        setMMoment('les_deux');
        setDetectedFromScan(true);
        setMPhoto(base64Image);
        setShowManual(true);
      } else {
        alert(lang === 'fr' ? "Produit non reconnu. Réessaie ou saisis-le manuellement." : "Product not recognized. Try again or enter it manually.");
      }
    } catch (e) {
      console.error("Erreur lors de l'analyse Gemini :", e);
      alert(lang === 'fr' ? "Impossible d'analyser l'image. Réessaie." : "Could not analyze image. Try again.");
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const toggleActif = (value) => {
    setMActifs((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const saveManual = async () => {
    if (!mNom.trim() || !mBrand.trim()) {
      alert(lang === 'fr' ? 'Entre au moins le nom et la marque.' : 'Enter at least the name and brand.');
      return;
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
        photo_url: mPhoto, // ← AJOUTER CETTE LIGNE
      });
      await fetchProducts();
      setMNom(''); setMBrand(''); setMCat('serum'); setMMoment('les_deux'); setMActifs([]);
      setMPhoto(null); // ← AJOUTER CETTE LIGNE
      setDetectedFromScan(false);
      setShowManual(false);

    } catch (e) {
      const detail = e?.response?.data?.detail;
      alert(detail || (lang === 'fr' ? "Impossible d'ajouter le produit." : "Could not add the product."));
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
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={() => go('accueil')} className="p-2 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--cream-card)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Mon Étagère & Produits' : 'My Shelf & Products'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Prends une photo de l\'étiquette de ton produit' : 'Take a photo of your product label'}
          </p>
        </div>
      </div>

      {/* Zone d'ajout : Caméra + Galerie */}
      <div className="w-full p-5 rounded-[20px] border-2 border-dashed flex flex-col items-center gap-4" style={{ borderColor: '#D4A373', background: 'var(--cream-card)' }}>
        <div className="p-3.5 rounded-full text-white" style={{ background: '#A37B68' }}>
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
        </div>

        {loading ? (
          <p className="font-display text-[15px] font-medium text-center transition-all" style={{ color: 'var(--ink)' }}>
            {LOADING_STEPS[lang === 'fr' ? 'fr' : 'en'][loadingMsg]}
          </p>
        ) : (
          <>
            <p className="font-display text-[15px] font-medium text-center" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? 'Ajouter un produit' : 'Add a product'}
            </p>
            <div className="w-full flex flex-col gap-2.5">
              <label className="w-full py-3 rounded-[12px] text-center cursor-pointer font-body text-[11px] uppercase tracking-caps font-semibold text-white active:scale-[0.98] transition-all" style={{ background: '#A37B68' }}>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" disabled={loading} />
                {lang === 'fr' ? 'Prendre une photo' : 'Take a photo'}
              </label>

              <label className="w-full py-3 rounded-[12px] text-center cursor-pointer font-body text-[11px] uppercase tracking-caps font-semibold active:scale-[0.98] transition-all" style={{ background: 'transparent', border: '1px solid #A37B68', color: '#A37B68' }}>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={loading} />
                {lang === 'fr' ? 'Importer de la galerie' : 'Import from gallery'}
              </label>

              <button onClick={() => setShowManual((v) => !v)} className="w-full py-2 flex items-center justify-center gap-1.5 font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-soft)' }}>
                <Plus size={14} />
                {lang === 'fr' ? 'Saisir manuellement' : 'Enter manually'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Formulaire d'entrée manuelle / confirmation */}
      {showManual && (
        <div className="p-5 rounded-[20px] space-y-3 animate-fade-up" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[16px]" style={{ color: 'var(--ink)' }}>
              {detectedFromScan 
                ? (lang === 'fr' ? 'Confirmer le produit scanné' : 'Confirm scanned product')
                : (lang === 'fr' ? 'Saisir manuellement' : 'Enter manually')}
            </h3>
            <button onClick={() => { setShowManual(false); setDetectedFromScan(false); }} className="p-1.5 rounded-full" style={{ background: '#fff', border: '1px solid var(--line)' }}>
              <X size={16} style={{ color: 'var(--ink-soft)' }} />
            </button>
          </div>

          {detectedFromScan && (
            <p className="font-body italic text-[11.5px] px-3 py-2 rounded-[8px]" style={{ background: 'rgba(182,130,53,0.08)', color: 'var(--gold)' }}>
              {lang === 'fr'
                ? "Détecté par le scan — vérifie et corrige si besoin, puis confirme."
                : "Detected by the scan — review and edit if needed, then confirm."}
            </p>
          )}

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
              ? (lang === 'fr' ? 'Ajout...' : 'Adding...') 
              : (detectedFromScan 
                  ? (lang === 'fr' ? 'Confirmer et ajouter' : 'Confirm and add')
                  : (lang === 'fr' ? 'Ajouter à mon étagère' : 'Add to my shelf'))}
          </button>
        </div>
      )}

      {/* Liste des produits */}
      <div className="space-y-3">
        <h3 className="font-body text-[11px] uppercase tracking-caps font-semibold" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'fr' ? 'Mes produits enregistrés' : 'My saved products'} ({products.length})
        </h3>

        {products.length === 0 ? (
          <div className="p-6 text-center rounded-[16px] border border-dashed" style={{ borderColor: 'var(--line)' }}>
            <Package size={28} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--ink-faint)' }} />
            <p className="font-body text-[13px]" style={{ color: 'var(--ink-faint)' }}>
              {lang === 'fr' ? 'Aucun produit dans ton étagère pour l\'instant.' : 'No products on your shelf yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.map((p) => {
              const pid = p.shelf_id || p.id;
              const actif = p.actif !== false;
              const isExpanded = expandedId === pid;
              return (
              <div key={pid} className="rounded-[16px] overflow-hidden shadow-sm transition-all" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)', opacity: actif ? 1 : 0.6 }}>
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : pid)}>
                  <div className="flex-1 pr-2">
                    <span className="font-body text-[9px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
                      {p.categorie || p.category || 'SOIN'}
                    </span>
                    <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{p.nom}</p>
                    <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{p.brand || p.marque}</p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                  <div className="px-4 pb-4 pt-2 border-t space-y-3 animate-fade-up" style={{ borderColor: 'var(--line)' }}>
                    {p.photo_url && (
                      <div className="w-full h-40 rounded-[12px] overflow-hidden bg-stone-100 flex items-center justify-center">
                        <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-body">
                      <div className="p-2.5 rounded-[10px] bg-white border border-stone-200">
                        <span className="text-stone-400 block text-[9px] uppercase tracking-caps">{lang === 'fr' ? 'Moment' : 'When'}</span>
                        <span className="font-medium text-stone-800 capitalize">{p.moment ? (lang === 'fr' ? p.moment.replace('_', ' ') : p.moment) : 'Tous les moments'}</span>
                      </div>
                      <div className="p-2.5 rounded-[10px] bg-white border border-stone-200">
                        <span className="text-stone-400 block text-[9px] uppercase tracking-caps">{lang === 'fr' ? 'Catégorie' : 'Category'}</span>
                        <span className="font-medium text-stone-800 capitalize">{p.categorie || p.category}</span>
                      </div>
                    </div>

                    {Array.isArray(p.actifs) && p.actifs.length > 0 && (
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase tracking-caps mb-1.5">{lang === 'fr' ? 'Actifs détectés' : 'Detected actives'}</span>
                        <div className="flex flex-wrap gap-1">
                          {p.actifs.flatMap((a) => String(a).split(',')).map((a) => a.trim()).filter(Boolean).map((a, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full font-body text-[10px] font-semibold" style={{ background: 'rgba(182,130,53,0.12)', color: 'var(--gold)' }}>
                              {(ACTIF_LABELS[lang === 'fr' ? 'fr' : 'en'][a]) || a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}

          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;