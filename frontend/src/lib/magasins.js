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
  { id: 'uniprix', fr: 'Uniprix', en: 'Uniprix',
    url: (q) => `https://www.google.com/search?q=site:uniprix.com+${q}` },
  { id: 'familiprix', fr: 'Familiprix', en: 'Familiprix',
    url: (q) => `https://www.google.com/search?q=site:familiprix.com+${q}` },
  { id: 'brunet', fr: 'Brunet', en: 'Brunet',
    url: (q) => `https://www.google.com/search?q=site:brunet.ca+${q}` },
  { id: 'proxim', fr: 'Proxim', en: 'Proxim',
    url: (q) => `https://www.google.com/search?q=site:proxim.ca+${q}` },
  { id: 'rexall', fr: 'Rexall', en: 'Rexall',
    url: (q) => `https://www.google.com/search?q=site:rexall.ca+${q}` },
  { id: 'pharmasave', fr: 'Pharmasave', en: 'Pharmasave',
    url: (q) => `https://www.google.com/search?q=site:pharmasave.com+${q}` },
  { id: 'labaie', fr: 'La Baie', en: "Hudson's Bay",
    url: (q) => `https://www.google.com/search?q=site:thebay.com+${q}` },
  { id: 'simons', fr: 'Simons', en: 'Simons',
    url: (q) => `https://www.google.com/search?q=site:simons.ca+${q}` },
  { id: 'murale', fr: 'Murale', en: 'Murale',
    url: (q) => `https://www.google.com/search?q=site:murale.ca+${q}` },
  { id: 'beautyboutique', fr: 'Beauty Boutique', en: 'Beauty Boutique',
    url: (q) => `https://www.google.com/search?q=site:beautyboutique.ca+${q}` },
  { id: 'sally', fr: 'Sally Beauty', en: 'Sally Beauty',
    url: (q) => `https://www.google.com/search?q=site:sallybeauty.ca+${q}` },
  { id: 'chatters', fr: 'Chatters', en: 'Chatters',
    url: (q) => `https://www.google.com/search?q=site:chatters.ca+${q}` },
  { id: 'lush', fr: 'Lush', en: 'Lush',
    url: (q) => `https://www.google.com/search?q=site:lush.ca+${q}` },
  { id: 'bodyshop', fr: 'The Body Shop', en: 'The Body Shop',
    url: (q) => `https://www.google.com/search?q=site:thebodyshop.ca+${q}` },
  { id: 'saje', fr: 'Saje', en: 'Saje',
    url: (q) => `https://www.google.com/search?q=site:saje.com+${q}` },
  { id: 'aesop', fr: 'Aesop', en: 'Aesop',
    url: (q) => `https://www.google.com/search?q=site:aesop.com+${q}` },
  { id: 'kiehls', fr: "Kiehl's", en: "Kiehl's",
    url: (q) => `https://www.google.com/search?q=site:kiehls.ca+${q}` },
  { id: 'iherb', fr: 'iHerb', en: 'iHerb',
    url: (q) => `https://ca.iherb.com/search?kw=${q}` },
  { id: 'superstore', fr: 'Superstore', en: 'Superstore',
    url: (q) => `https://www.google.com/search?q=site:superstore.ca+${q}` },
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
