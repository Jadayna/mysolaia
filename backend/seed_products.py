"""Global product library seed for MySolaia.
Texture: 1 (most fluid) -> 5 (richest). moment: matin|soir|les_deux.
Categories drive ordering; actifs & incompatibilites drive the safety engine.
Product names stay in their original language (never translated).
"""

def p(brand, nom, categorie, actifs, texture, moment, freq=7, wait=0,
      incompat=None, concentration="", ph=None):
    return {
        "brand": brand, "nom": nom, "categorie": categorie, "actifs": actifs,
        "texture": texture, "moment": moment, "frequence_max_par_semaine": freq,
        "temps_attente_apres_min": wait, "incompatibilites": incompat or [],
        "concentration": concentration, "ph_approx": ph,
        "source": "catalogue", "verifie": True,
    }

SEED_PRODUCTS = [
    # ---- The Ordinary ----
    p("The Ordinary", "Glycolic Acid 7% Toning Solution", "exfoliant", ["aha"], 1, "soir", 2, 10, ["retinol", "vitamine_c", "bha"], "7%", 3.6),
    p("The Ordinary", "Lactic Acid 10% + HA", "exfoliant", ["aha"], 2, "soir", 2, 10, ["retinol", "vitamine_c"], "10%", 3.8),
    p("The Ordinary", "Salicylic Acid 2% Solution", "traitement_cible", ["bha"], 1, "soir", 3, 0, ["retinol"], "2%", 3.3),
    p("The Ordinary", "Niacinamide 10% + Zinc 1%", "serum", ["niacinamide"], 1, "les_deux", 7, 0, ["vitamine_c"], "10%"),
    p("The Ordinary", "Retinol 0.5% in Squalane", "serum", ["retinol"], 3, "soir", 3, 0, ["aha", "bha", "vitamine_c", "benzoyle"], "0.5%"),
    p("The Ordinary", "Granactive Retinoid 2% Emulsion", "serum", ["retinol"], 2, "soir", 4, 0, ["aha", "bha", "vitamine_c"], "2%"),
    p("The Ordinary", "Vitamin C Suspension 23%", "serum", ["vitamine_c"], 3, "matin", 7, 0, ["niacinamide", "retinol", "aha"], "23%"),
    p("The Ordinary", "Hyaluronic Acid 2% + B5", "serum", ["acide_hyaluronique"], 1, "les_deux", 7, 0, []),
    p("The Ordinary", "Succinic Acid 2% Solution", "traitement_cible", ["succinique"], 1, "soir", 7, 0, []),
    p("The Ordinary", "Argireline Solution 10%", "serum", ["peptides"], 1, "les_deux", 7, 0, []),
    p("The Ordinary", "Multi-Peptide Lash & Brow Serum", "cils_sourcils", ["peptides"], 1, "les_deux", 7, 0, []),
    p("The Ordinary", "PHA 5% Lip Serum", "levres", ["pha"], 2, "les_deux", 7, 0, []),
    p("The Ordinary", "Natural Moisturizing Factors + HA", "hydratant", [], 4, "les_deux", 7, 0, []),
    p("The Ordinary", "Squalane Cleanser", "nettoyant", [], 3, "les_deux", 7, 0, []),
    # ---- The Inkey List ----
    p("The Inkey List", "Retinol Serum", "serum", ["retinol"], 2, "soir", 3, 0, ["aha", "bha", "vitamine_c", "benzoyle"], "1%"),
    p("The Inkey List", "Niacinamide", "serum", ["niacinamide"], 1, "les_deux", 7, 0, ["vitamine_c"], "10%"),
    p("The Inkey List", "Caffeine Eye Cream", "yeux", ["cafeine"], 2, "les_deux", 7, 0, []),
    p("The Inkey List", "Hyaluronic Acid Serum", "serum", ["acide_hyaluronique"], 1, "les_deux", 7, 0, []),
    p("The Inkey List", "Beta Hydroxy Acid", "exfoliant", ["bha"], 1, "soir", 3, 10, ["retinol"], "2%", 3.5),
    p("The Inkey List", "Succinic Acid Acne Treatment", "traitement_cible", ["succinique"], 1, "les_deux", 7, 0, []),
    p("The Inkey List", "Vitamin C Serum", "serum", ["vitamine_c"], 2, "matin", 7, 0, ["niacinamide", "retinol"], "30%"),
    p("The Inkey List", "Polyglutamic Acid", "serum", ["acide_polyglutamique"], 1, "les_deux", 7, 0, []),
    p("The Inkey List", "Peptide Moisturizer", "hydratant", ["peptides"], 4, "les_deux", 7, 0, []),
    # ---- CeraVe ----
    p("CeraVe", "Hydrating Facial Cleanser", "nettoyant", ["ceramides"], 3, "les_deux", 7, 0, []),
    p("CeraVe", "Foaming Facial Cleanser", "nettoyant", [], 2, "les_deux", 7, 0, []),
    p("CeraVe", "Moisturizing Lotion", "hydratant", ["ceramides"], 4, "les_deux", 7, 0, []),
    p("CeraVe", "PM Facial Moisturizing Lotion", "hydratant", ["ceramides", "niacinamide"], 3, "soir", 7, 0, []),
    p("CeraVe", "AM Facial Moisturizing Lotion SPF 30", "spf", ["spf"], 4, "matin", 7, 0, [], "SPF 30"),
    p("CeraVe", "Eye Repair Cream", "yeux", ["ceramides"], 3, "les_deux", 7, 0, []),
    p("CeraVe", "Resurfacing Retinol Serum", "serum", ["retinol"], 3, "soir", 3, 0, ["aha", "bha"], ""),
    # ---- La Roche-Posay ----
    p("La Roche-Posay", "Toleriane Hydrating Gentle Cleanser", "nettoyant", ["ceramides"], 3, "les_deux", 7, 0, []),
    p("La Roche-Posay", "Effaclar Duo+", "traitement_cible", ["niacinamide", "lha"], 3, "les_deux", 7, 0, []),
    p("La Roche-Posay", "Anthelios UVMune 400 SPF 50", "spf", ["spf"], 3, "matin", 7, 0, [], "SPF 50"),
    p("La Roche-Posay", "Hyalu B5 Serum", "serum", ["acide_hyaluronique", "vitamine_b5"], 1, "les_deux", 7, 0, []),
    p("La Roche-Posay", "Retinol B3 Serum", "serum", ["retinol"], 2, "soir", 3, 0, ["aha", "bha", "vitamine_c"], ""),
    p("La Roche-Posay", "Cicaplast Baume B5", "hydratant", ["panthenol"], 5, "les_deux", 7, 0, []),
    # ---- Paula's Choice ----
    p("Paula's Choice", "Skin Perfecting 2% BHA Liquid Exfoliant", "exfoliant", ["bha"], 1, "soir", 3, 10, ["retinol"], "2%", 3.5),
    p("Paula's Choice", "Skin Perfecting 8% AHA Gel", "exfoliant", ["aha"], 2, "soir", 2, 10, ["retinol", "vitamine_c"], "8%", 3.6),
    p("Paula's Choice", "C15 Super Booster", "serum", ["vitamine_c"], 2, "matin", 7, 0, ["niacinamide", "retinol"], "15%"),
    p("Paula's Choice", "10% Niacinamide Booster", "serum", ["niacinamide"], 1, "les_deux", 7, 0, ["vitamine_c"], "10%"),
    p("Paula's Choice", "Clinical 1% Retinol Treatment", "serum", ["retinol"], 3, "soir", 2, 0, ["aha", "bha", "vitamine_c"], "1%"),
    # ---- Cetaphil / Neutrogena ----
    p("Cetaphil", "Gentle Skin Cleanser", "nettoyant", [], 3, "les_deux", 7, 0, []),
    p("Cetaphil", "Daily Facial Moisturizer SPF 15", "spf", ["spf"], 3, "matin", 7, 0, [], "SPF 15"),
    p("Neutrogena", "Hydro Boost Water Gel", "hydratant", ["acide_hyaluronique"], 3, "les_deux", 7, 0, []),
    p("Neutrogena", "Rapid Wrinkle Repair Retinol", "serum", ["retinol"], 3, "soir", 3, 0, ["aha", "bha"], ""),
    p("Neutrogena", "Ultra Sheer SPF 55", "spf", ["spf"], 2, "matin", 7, 0, [], "SPF 55"),
    # ---- Dr.Jart+ ----
    p("Dr.Jart+", "Cicapair Serum", "serum", ["centella"], 1, "les_deux", 7, 0, []),
    p("Dr.Jart+", "Ceramidin Cream", "hydratant", ["ceramides"], 5, "les_deux", 7, 0, []),
]

# A realistic starter shelf used only as a demo when a new user has no products yet,
# so the routine screen shows a believable ~8-step routine (never the whole catalogue).
_DEMO_NAMES = [
    "Foaming Facial Cleanser",
    "Glycolic Acid 7% Toning Solution",
    "Niacinamide 10% + Zinc 1%",
    "Retinol Serum",
    "Cicapair Serum",
    "Succinic Acid 2% Solution",
    "Caffeine Eye Cream",
    "Moisturizing Lotion",
    "Multi-Peptide Lash & Brow Serum",
    "PHA 5% Lip Serum",
    "Anthelios UVMune 400 SPF 50",
]
DEMO_SHELF = [p for name in _DEMO_NAMES for p in SEED_PRODUCTS if p["nom"] == name]
