import React, { useState, useEffect } from 'react';
import { Camera, Trash2, ArrowLeft, Loader2, Package } from 'lucide-react';
import { useT } from '../i18n';
import api from '../lib/api';

const ScanScreen = ({ go }) => {
  const { lang } = useT();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger la liste des produits
  const fetchProducts = async () => {
    try {
      const res = await api.get('/shelf/');
      const data = res?.data;
      if (Array.isArray(data)) setProducts(data);
      else if (data && Array.isArray(data.products)) setProducts(data.products);
      else setProducts([]);
    } catch (e) {
      console.error("Erreur chargement étagère :", e);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Gestion de la sélection / capture de photo
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await api.post('/shelf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProducts();
    } catch (e) {
      console.warn("Erreur API upload, ajout en local pour démo :", e);
      const mockProduct = {
        id: Date.now(),
        nom: file.name.split('.')[0] || "Nouveau Produit",
        marque: "Mes Soins",
        categorie: "SOIN"
      };
      setProducts((prev) => [mockProduct, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  // Suppression d'un produit
  const handleDelete = async (id) => {
    try {
      await api.delete(`/shelf/${id}/`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="px-6 pt-6 pb-12 space-y-6">
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
            {lang === 'fr' ? 'Prends une photo ou choisis une image' : 'Take a photo or upload an image'}
          </p>
        </div>
      </div>

      {/* Option B : Bouton Importation / Caméra */}
      <label className="w-full p-6 rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.99]" style={{ borderColor: '#D4A373', background: 'var(--cream-card)' }}>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileUpload} 
          className="hidden" 
          disabled={loading}
        />
        <div className="p-3.5 rounded-full text-white" style={{ background: '#A37B68' }}>
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
        </div>
        <div className="text-center">
          <p className="font-display text-[15px] font-medium" style={{ color: 'var(--ink)' }}>
            {loading 
              ? (lang === 'fr' ? 'Analyse en cours...' : 'Analyzing photo...') 
              : (lang === 'fr' ? 'Prendre ou importer une photo' : 'Take or upload a photo')}
          </p>
          <p className="font-body text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Ouvre la caméra ou la galerie' : 'Opens camera or photo library'}
          </p>
        </div>
      </label>

      {/* Liste complète des produits */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-body text-[11px] uppercase tracking-caps font-semibold" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Mes produits enregistrés' : 'My saved products'} ({safeProducts.length})
          </h3>
        </div>

        {safeProducts.length === 0 ? (
          <div className="p-6 text-center rounded-[16px] border border-dashed" style={{ borderColor: 'var(--line)' }}>
            <Package size={28} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--ink-faint)' }} />
            <p className="font-body text-[13px]" style={{ color: 'var(--ink-faint)' }}>
              {lang === 'fr' ? 'Aucun produit dans ton étagère pour l\'instant.' : 'No products on your shelf yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {safeProducts.map((p) => (
              <div key={p.id || p.nom} className="p-4 rounded-[16px] flex items-center justify-between" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div>
                  <span className="font-body text-[9px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
                    {p.categorie || 'SOIN'}
                  </span>
                  <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{p.nom}</p>
                  <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{p.marque}</p>
                </div>
                <button 
                  onClick={() => handleDelete(p.id)} 
                  className="p-2.5 rounded-full text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                  title={lang === 'fr' ? 'Supprimer' : 'Delete'}
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