import React, { useState, useEffect } from 'react';
import { Camera, Trash2, ArrowLeft, Loader2, Package } from 'lucide-react';
import { useT } from '../i18n';
import api from '../lib/api';

const ScanScreen = ({ go }) => {
  const { lang } = useT();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les produits de l'étagère depuis FastAPI
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
    fetchProducts();
  }, []);

  // Convertir l'image en Base64 pour l'API Gemini
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
      
      // 1. Envoi à la vraie route /scan acceptée par server.py
      const res = await api.post('/scan', { image_base64: base64Image });
      
      if (res.data && res.data.product) {
        const prod = res.data.product;
        
        // 2. Enregistrement du produit analysé par Gemini dans l'étagère
        await api.post('/shelf/manual', {
          brand: prod.brand || "Marque Détectée",
          nom: prod.nom || "Produit Détecté",
          categorie: (prod.categorie || prod.category || "serum").toLowerCase(),
          actifs: prod.actifs || [],
          texture: 3,
          moment: "les_deux"
        });

        await fetchProducts();
      }
    } catch (e) {
      console.error("Erreur lors de l'analyse Gemini :", e);
      alert(lang === 'fr' ? "Impossible d'analyser l'image. Réessaie." : "Could not analyze image. Try again.");
    } finally {
      setLoading(false);
      event.target.value = '';
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
          <p className="font-display text-[15px] font-medium" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Analyse de ton produit...' : 'Analyzing your product...'}
          </p>
        ) : (
          <>
            <p className="font-display text-[15px] font-medium text-center" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? 'Ajouter un produit' : 'Add a product'}
            </p>
            <div className="w-full flex flex-col gap-2.5">
              {/* Prendre une photo (caméra) */}
              <label className="w-full py-3 rounded-[12px] text-center cursor-pointer font-body text-[11px] uppercase tracking-caps font-semibold text-white active:scale-[0.98] transition-all" style={{ background: '#A37B68' }}>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" disabled={loading} />
                {lang === 'fr' ? 'Prendre une photo' : 'Take a photo'}
              </label>

              {/* Importer de la galerie */}
              <label className="w-full py-3 rounded-[12px] text-center cursor-pointer font-body text-[11px] uppercase tracking-caps font-semibold active:scale-[0.98] transition-all" style={{ background: 'transparent', border: '1px solid #A37B68', color: '#A37B68' }}>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={loading} />
                {lang === 'fr' ? 'Importer de la galerie' : 'Import from gallery'}
              </label>
            </div>
          </>
        )}
      </div>

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
            {products.map((p) => (
              <div key={p.shelf_id || p.id} className="p-4 rounded-[16px] flex items-center justify-between shadow-sm" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div>
                  <span className="font-body text-[9px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
                    {p.categorie || p.category || 'SOIN'}
                  </span>
                  <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{p.nom}</p>
                  <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{p.brand || p.marque}</p>
                </div>
                <button 
                  onClick={() => handleDelete(p.shelf_id || p.id)} 
                  className="p-2.5 rounded-full text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanScreen;