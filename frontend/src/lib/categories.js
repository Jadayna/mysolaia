// Source unique des libellés de catégories de produits (FR/EN)
export const CATEGORIES = [
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
  { value: 'patch', fr: 'Patch (boutons)', en: 'Pimple patch' },
];

export const categoryLabel = (value, lang) => {
  const v = String(value || '').toLowerCase();
  return (CATEGORIES.find((c) => c.value === v)?.[lang === 'fr' ? 'fr' : 'en']) || value;
};
