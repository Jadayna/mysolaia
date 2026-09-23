// Magasins les plus populaires pour les soins du visage (Canada).
// Chaque magasin sait construire l'URL de recherche directe d'un produit.
// Pour les magasins sans recherche directe fiable, on passe par une
// recherche Google restreinte au domaine du magasin (site:...).
export const MAGASINS = [
  { id: 'sephora', fr: 'Sephora', en: 'Sephora',
    url: (q) => `https://www.sephora.com/search?keyword=${q}` },
  { id: 'shoppers', fr: 'Shoppers Drug Mart', en: 'Shoppers Drug Mart',
    url: (q) => `https://shop.shoppersdrugmart.ca/search?text=${q}` },
  { id: 'pharmaprix', fr: 'Pharmaprix', en: 'Pharmaprix',
    url: (q) => `https://www.pharmaprix.ca/search?text=${q}` },
  { id: 'amazon', fr: 'Amazon.ca', en: 'Amazon.ca',
    url: (q) => `https://www.amazon.ca/s?k=${q}` },
  { id: 'walmart', fr: 'Walmart', en: 'Walmart',
    url: (q) => `https://www.walmart.ca/search?q=${q}` },
  { id: 'jeancoutu', fr: 'Jean Coutu', en: 'Jean Coutu',
    url: (q) => `https://www.google.com/search?q=site:jeancoutu.com+${q}` },
  { id: 'londondrugs', fr: 'London Drugs', en: 'London Drugs',
    url: (q) => `https://www.google.com/search?q=site:londondrugs.com+${q}` },
  { id: 'costco', fr: 'Costco', en: 'Costco',
    url: (q) => `https://www.costco.ca/CatalogSearch?keyword=${q}` },
  { id: 'well', fr: 'Well.ca', en: 'Well.ca',
    url: (q) => `https://www.google.com/search?q=site:well.ca+${q}` },
  { id: 'theordinary', fr: 'The Ordinary', en: 'The Ordinary',
    url: (q) => `https://theordinary.com/search?q=${q}` },
];

// Préfixe des magasins personnalisés (texte libre) : "custom:Nom du magasin"
export const CUSTOM_PREFIX = 'custom:';

// Résout une valeur stockée (id ou "custom:Nom") → { id, label, url }
export const resolveMagasin = (value, lang) => {
  if (typeof value !== 'string' || !value) return null;
  if (value.startsWith(CUSTOM_PREFIX)) {
    const nom = value.slice(CUSTOM_PREFIX.length).trim();
    if (!nom) return null;
    return {
      id: value,
      label: nom,
      url: (q) => `https://www.google.com/search?tbm=shop&q=${q}`,
    };
  }
  const m = MAGASINS.find((s) => s.id === value);
  if (!m) return null;
  return { id: m.id, label: lang === 'fr' ? m.fr : m.en, url: m.url };
};

export const magasinLabel = (value, lang) =>
  resolveMagasin(value, lang)?.label || value;
