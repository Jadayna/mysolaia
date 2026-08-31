import React, { useState, useRef } from 'react';
import { Camera, X, Search } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';

const Corner = ({ style }) => <span className="absolute w-7 h-7" style={style} />;
const g = 'var(--gold)';
const CAT_FR = { nettoyant: 'Nettoyant', exfoliant: 'Exfoliant', serum: 'Sérum', yeux: 'Yeux', hydratant: 'Hydratant', spf: 'SPF', levres: 'Lèvres', cils_sourcils: 'Cils & sourcils', traitement_cible: 'Ciblé' };

const ScanScreen = ({ go }) => {
  const { t } = useT();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [lib, setLib] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data } = await api.post('/scan', { image_base64: reader.result });
        setResult(data);
      } catch (err) { setResult({ product: null }); }
      finally { setBusy(false); }
    };
    reader.readAsDataURL(file);
  };

  const addProduct = async (prod) => {
    if (prod?.id) await api.post('/shelf', { product_id: prod.id });
    else if (prod) await api.post('/shelf/manual', { brand: prod.brand, nom: prod.nom, categorie: prod.categorie, actifs: prod.actifs || [], texture: prod.texture || 2, moment: prod.moment || 'les_deux' });
    go('accueil');
  };

  const openLib = async () => {
    setLib(true);
    const { data } = await api.get('/products');
    setProducts(data.products);
  };
  const searchLib = async (q) => {
    setQuery(q);
    const { data } = await api.get('/products', { params: { q } });
    setProducts(data.products);
  };

  return (
    <div className="relative" style={{ minHeight: '100%', background: 'linear-gradient(180deg,#2b2723,#1c1916)' }}>
      <div className="px-6 pt-6 text-center">
        <h2 className="font-display text-[24px]" style={{ color: '#f3ece0' }}>{t('frameProduct')}</h2>
        <p className="font-body text-[12.5px] mt-1" style={{ color: '#b9b0a2' }}>{t('frameHint')}</p>
      </div>

      <div className="flex items-center justify-center px-10" style={{ minHeight: 320 }}>
        <div className="relative" style={{ width: 190, height: 250 }}>
          <Corner style={{ top: 0, left: 0, borderTop: `2px solid ${g}`, borderLeft: `2px solid ${g}` }} />
          <Corner style={{ top: 0, right: 0, borderTop: `2px solid ${g}`, borderRight: `2px solid ${g}` }} />
          <Corner style={{ bottom: 0, left: 0, borderBottom: `2px solid ${g}`, borderLeft: `2px solid ${g}` }} />
          <Corner style={{ bottom: 0, right: 0, borderBottom: `2px solid ${g}`, borderRight: `2px solid ${g}` }} />
          <div className="absolute inset-5 rounded-[8px] flex items-center justify-center" style={{ background: 'linear-gradient(160deg,#d9d0c2,#b7ab98)' }}>
            {busy && <span className="font-body italic text-[13px]" style={{ color: '#3a352e' }}>{t('analyzing')}</span>}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="pb-8 flex flex-col items-center gap-4">
        <button onClick={() => fileRef.current?.click()} className="rounded-full flex items-center justify-center" style={{ width: 66, height: 66, border: `3px solid ${g}` }}>
          <span className="rounded-full" style={{ width: 50, height: 50, background: 'var(--gold-soft)' }} />
        </button>
        <button onClick={openLib} className="font-body text-[12px] tracking-caps uppercase" style={{ color: '#b9b0a2' }}>{t('chooseFromLibrary')}</button>
      </div>

      {/* Recognition result */}
      {result && (
        <div className="animate-sheet absolute bottom-0 left-0 right-0 rounded-t-[24px] px-6 pt-6 pb-8" style={{ background: 'var(--cream)', color: 'var(--ink)', maxHeight: '82%', overflowY: 'auto' }}>
          <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--gold)' }}>{result.recognized ? `${t('recognized')} · ${t('toConfirm')}` : t('toConfirm')}</span>
          <h3 className="font-display text-[24px] mt-2">{result.product?.nom}</h3>
          <p className="font-body italic text-[13px]" style={{ color: 'var(--ink-faint)' }}>{result.product?.brand}</p>
          <div className="mt-4">
            <Row k={t('category')} v={CAT_FR[result.product?.categorie] || result.product?.categorie} />
            {result.product?.actifs?.[0] && <Row k={t('keyActive')} v={result.product.actifs[0]} />}
            <Row k={t('texture')} v={result.product?.texture_label || `${result.product?.texture}/5`} />
          </div>
          <p className="font-body italic text-[12.5px] leading-relaxed mt-3" style={{ color: 'var(--ink-soft)' }}>{result.note}</p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => setResult(null)} className="rounded-[8px] py-3 font-body tracking-caps text-[11px] uppercase" style={{ border: '1px solid var(--line-strong)', color: 'var(--ink-soft)' }}>{t('retake')}</button>
            <button onClick={() => addProduct(result.product)} className="gold-btn rounded-[8px] py-3 font-body tracking-caps text-[11px] uppercase">{t('addToRoutine')}</button>
          </div>
        </div>
      )}

      {/* Library picker */}
      {lib && (
        <div className="animate-sheet absolute bottom-0 left-0 right-0 rounded-t-[24px] px-6 pt-5 pb-8" style={{ background: 'var(--cream)', color: 'var(--ink)', height: '82%', overflowY: 'auto' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[22px]">{t('addProduct')}</h3>
            <button onClick={() => setLib(false)}><X size={20} strokeWidth={1.6} style={{ color: 'var(--ink-soft)' }} /></button>
          </div>
          <div className="flex items-center gap-2 mt-3 rounded-[8px] px-3" style={{ border: '1px solid var(--line-strong)' }}>
            <Search size={15} style={{ color: 'var(--ink-faint)' }} />
            <input value={query} onChange={(e) => searchLib(e.target.value)} placeholder={t('search')} className="flex-1 bg-transparent py-2.5 font-body text-[14px] outline-none" />
          </div>
          <div className="mt-3">
            {products.map((p) => (
              <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center justify-between py-3 text-left hairline">
                <div>
                  <p className="font-body text-[14px]">{p.nom}</p>
                  <p className="font-body italic text-[12px]" style={{ color: 'var(--ink-faint)' }}>{p.brand} · {CAT_FR[p.categorie] || p.categorie}</p>
                </div>
                <span className="font-body text-[12px] tracking-caps uppercase" style={{ color: 'var(--gold)' }}>{t('add')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ k, v }) => (
  <div className="flex justify-between items-center py-3 hairline">
    <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{k}</span>
    <span className="font-body text-[13.5px]">{v}</span>
  </div>
);

export default ScanScreen;
