# -*- coding: utf-8 -*-
"""Étape 8 — Base de connaissances : les produits « capricieux ».
Rétinoïdes, vitamine C, AHA/BHA, peroxyde de benzoyle : des actifs puissants
qui demandent un mode d'emploi. Source unique (FR/EN) utilisée par :
- GET /knowledge/tricky (guide complet, affiché dans Aide & Support)
- la fiche produit (section « Produit capricieux » quand ses actifs matchent)
"""

TRICKY_FAMILIES = {
    "retinoides": {
        "emoji": "🌙",
        "keywords": ["retinol", "rétinol", "retinal", "rétinal", "tretinoin",
                     "trétinoïne", "adapalene", "adapalène", "tazarotene",
                     "tazarotène", "rétinoïde", "retinoid"],
        "fr": {
            "titre": "Rétinoïdes (rétinol & co)",
            "intro": "Les champions de l'anti-âge et de l'acné — mais ils demandent du doigté.",
            "conseils": [
                "Le soir uniquement, sur peau parfaitement sèche.",
                "Commence doucement : 2 soirs par semaine, puis augmente progressivement.",
                "Une noisette suffit pour tout le visage.",
                "SPF 30+ obligatoire chaque matin pendant toute la cure.",
                "Hydrate bien : les rétinoïdes assèchent la peau au début.",
            ],
            "a_eviter": [
                "Pas le même soir que les AHA/BHA ou la vitamine C.",
                "À éviter si tu es enceinte ou si tu allaites — demande à ton médecin.",
            ],
        },
        "en": {
            "titre": "Retinoids (retinol & co)",
            "intro": "The anti-aging and acne champions — but they need a gentle hand.",
            "conseils": [
                "Evenings only, on perfectly dry skin.",
                "Start slow: 2 evenings a week, then build up gradually.",
                "A pea-sized amount is enough for the whole face.",
                "SPF 30+ mandatory every morning during the course.",
                "Moisturize well: retinoids dry skin out at first.",
            ],
            "a_eviter": [
                "Not on the same evening as AHAs/BHAs or vitamin C.",
                "Avoid if pregnant or breastfeeding — ask your doctor.",
            ],
        },
    },
    "vitamine_c": {
        "emoji": "🍊",
        "keywords": ["vitamine_c", "vitamine c", "vitamin c", "acide ascorbique",
                     "ascorbic", "ascorbate"],
        "fr": {
            "titre": "Vitamine C",
            "intro": "L'éclat du matin en flacon — à condition de bien la traiter.",
            "conseils": [
                "Le matin, sur peau propre et sèche, avant ta crème.",
                "Toujours suivie d'un SPF : c'est un duo gagnant.",
                "Conserve le flacon à l'abri de la lumière et de la chaleur.",
                "Peau sensible ? Commence par une concentration douce (10 %).",
            ],
            "a_eviter": [
                "Ne la mélange pas aux AHA/BHA ni au rétinol dans la même routine.",
                "Flacon devenu orange foncé = oxydé, il est temps de le remplacer.",
            ],
        },
        "en": {
            "titre": "Vitamin C",
            "intro": "Morning glow in a bottle — if you treat it right.",
            "conseils": [
                "In the morning, on clean dry skin, before your cream.",
                "Always followed by SPF: they're a winning duo.",
                "Store the bottle away from light and heat.",
                "Sensitive skin? Start with a gentle concentration (10%).",
            ],
            "a_eviter": [
                "Don't mix with AHAs/BHAs or retinol in the same routine.",
                "Bottle turned dark orange = oxidized, time to replace it.",
            ],
        },
    },
    "aha": {
        "emoji": "✨",
        "keywords": ["aha", "glycolique", "glycolic", "lactique", "lactic",
                     "mandélique", "mandelic", "acide_mandelique", "citrique",
                     "citric"],
        "fr": {
            "titre": "AHA (acides de fruits)",
            "intro": "Grain de peau affiné et éclat — en douceur d'abord.",
            "conseils": [
                "Le soir, 1 à 3 fois par semaine selon ta tolérance.",
                "Des picotements légers au début, c'est normal.",
                "SPF 30+ le lendemain : ta peau est plus sensible au soleil.",
                "Laisse poser, ne rince pas (sauf s'il s'agit d'un masque).",
            ],
            "a_eviter": [
                "Pas le même soir que le rétinol.",
                "Évite sur une peau irritée ou après un coup de soleil.",
            ],
        },
        "en": {
            "titre": "AHAs (fruit acids)",
            "intro": "Refined texture and glow — gently does it.",
            "conseils": [
                "In the evening, 1 to 3 times a week depending on tolerance.",
                "Mild tingling at first is normal.",
                "SPF 30+ the next day: your skin is more sun-sensitive.",
                "Leave on, don't rinse (unless it's a mask).",
            ],
            "a_eviter": [
                "Not on the same evening as retinol.",
                "Avoid on irritated skin or after a sunburn.",
            ],
        },
    },
    "bha": {
        "emoji": "🎯",
        "keywords": ["bha", "salicylique", "salicylic"],
        "fr": {
            "titre": "BHA (acide salicylique)",
            "intro": "L'allié des pores et des imperfections.",
            "conseils": [
                "2 à 3 fois par semaine, le soir de préférence, sur peau sèche.",
                "Une « purge » (petits boutons) peut survenir les 2 à 4 premières semaines.",
                "Hydrate après : il peut assécher.",
                "Excellent en traitement local sur les imperfections.",
            ],
            "a_eviter": [
                "Pas en même temps que la vitamine C ou le rétinol.",
                "Stoppe en cas de rougeurs persistantes ou de brûlures.",
            ],
        },
        "en": {
            "titre": "BHA (salicylic acid)",
            "intro": "The ally for pores and breakouts.",
            "conseils": [
                "2 to 3 times a week, preferably in the evening, on dry skin.",
                "A 'purge' (small breakouts) may happen in the first 2–4 weeks.",
                "Moisturize after: it can be drying.",
                "Great as a spot treatment on blemishes.",
            ],
            "a_eviter": [
                "Not at the same time as vitamin C or retinol.",
                "Stop if redness persists or skin burns.",
            ],
        },
    },
    "peroxyde_benzoyle": {
        "emoji": "⚠️",
        "keywords": ["peroxyde_benzoyle", "peroxyde de benzoyle", "benzoyle",
                     "benzoyl", "benzoyl peroxide"],
        "fr": {
            "titre": "Peroxyde de benzoyle",
            "intro": "Redoutable contre les boutons — à manier avec précaution.",
            "conseils": [
                "En traitement local sur les boutons, ou en fine couche.",
                "Commence par une faible concentration (2,5 %).",
                "Hydrate généreusement : il assèche beaucoup.",
            ],
            "a_eviter": [
                "Tache les tissus (serviettes, taies d'oreiller) — utilise du blanc.",
                "Ne le combine pas avec le rétinol : ils s'annulent.",
                "SPF le jour, toujours.",
            ],
        },
        "en": {
            "titre": "Benzoyl peroxide",
            "intro": "Tough on breakouts — handle with care.",
            "conseils": [
                "As a spot treatment on blemishes, or in a thin layer.",
                "Start with a low concentration (2.5%).",
                "Moisturize generously: it's very drying.",
            ],
            "a_eviter": [
                "Stains fabrics (towels, pillowcases) — stick to white.",
                "Don't combine with retinol: they cancel each other out.",
                "SPF during the day, always.",
            ],
        },
    },
}


def _norm(s: str) -> str:
    return (s or "").strip().lower()


def tricky_keys_for_actifs(actifs) -> list:
    """Retourne les clés de familles « capricieuses » présentes dans les actifs."""
    found = []
    if not actifs:
        return found
    texts = [_norm(str(a)) for a in actifs]
    for key, fam in TRICKY_FAMILIES.items():
        kws = [_norm(k) for k in fam["keywords"]]
        if any(kw and any(kw in t for t in texts) for kw in kws):
            found.append(key)
    return found


def tricky_guide(lang: str = "fr") -> list:
    """Guide complet dans la langue demandée (repli FR)."""
    lang = "en" if lang == "en" else "fr"
    out = []
    for key, fam in TRICKY_FAMILIES.items():
        data = fam[lang]
        out.append({
            "key": key,
            "emoji": fam["emoji"],
            "titre": data["titre"],
            "intro": data["intro"],
            "conseils": data["conseils"],
            "a_eviter": data["a_eviter"],
        })
    return out


def tricky_for_keys(keys, lang: str = "fr") -> list:
    """Fiches détaillées pour une liste de clés de familles."""
    lang = "en" if lang == "en" else "fr"
    out = []
    for key in keys or []:
        fam = TRICKY_FAMILIES.get(key)
        if not fam:
            continue
        data = fam[lang]
        out.append({
            "key": key,
            "emoji": fam["emoji"],
            "titre": data["titre"],
            "intro": data["intro"],
            "conseils": data["conseils"],
            "a_eviter": data["a_eviter"],
        })
    return out
