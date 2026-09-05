import React, { useState, useEffect } from 'react';
import { Upload, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { useT } from '../i18n';
import api from '../lib/api';

const ScanScreen = ({ go }) => {
  const { lang } = useT();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les produits de l'étagère
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

  // Gestion de l'importation d'image
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      await api.post('/shelf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProducts(); // Rafraîchir la liste
    } catch (e) {
      console.error("Erreur d'importation :", e);
      // Fallback local si l'API d'upload n'existe pas encore
      const mockProduct = {
        id: Date.now(),
        nom: file.name.split('.')[0] || "Nouveau Produit",
        marque: "Soin Skincare",
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
      // Si la route API delete échoue, on supprime au moins côté frontend
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="px-6 pt-6 pb-12 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={() => go('home')} className="p-2 rounded-full bg-[#FAF6F0] border border-[#E8DFC8]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Mon Étagère' : 'My Shelf'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Ajoute et gère tes produits de beauté' : 'Add and manage your skincare products'}
          </p>
        </div>
      </div>

      {/* Bouton Télécharger une photo */}
      <label className="w-full p-6 rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-black/5" style={{ borderColor: 'var(--gold)', background: 'var(--cream-card)' }}>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileUpload} 
          className="hidden" 
          disabled={loading}
        />
        <div className="p-3 rounded-full bg-[#A37B68] text-white">
          <Upload size={24} />
        </div>
        <div className="text-center">
          <p className="font-display text-[15px] font-medium" style={{ color: 'var(--ink)' }}>
            {loading 
              ? (lang === 'fr' ? 'Analyse de la photo...' : 'Analyzing photo...') 
              : (lang === 'fr' ? 'Télécharger une photo de produit' : 'Upload a product photo')}
          </p>
          <p className="font-body text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Depuis ta galerie ou ton appareil photo' : 'From your gallery or camera'}
          </p>
        </div>
      </label>

      {/* Liste de mes produits */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-body text-[11px] uppercase tracking-caps font-semibold" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Liste de mes produits' : 'My Product List'} ({safeProducts.length})
          </h3>
        </div>

        {safeProducts.length === 0 ? (
          <div className="p-6 text-center rounded-[16px] border border-dashed" style={{ borderColor: 'var(--line)' }}>
            <p className="font-body text-[13px]" style={{ color: 'var(--ink-faint)' }}>
              {lang === 'fr' ? 'Aucun produit pour le moment.' : 'No products added yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
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
                  className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
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