"""The order engine — the heart of MySolaia.
Deterministic, works offline once a routine is computed.
Orders products fluid->rich with acid-first, eye-before-cream, SPF-last rules,
and resolves risky same-session combinations by *acting* (moving, not blocking).
Tone is soft, first person, no alarms.
Bilingue : compute_routine(..., lang="fr" | "en").
"""
from datetime import date

# Base rank per category (lower = earlier). Texture (1-5) is the tie-breaker.
CATEGORY_RANK = {
    "nettoyant": 0, "masque": 5, "exfoliant": 10, "toner": 20, "essence": 25,
    "serum": 30, "traitement_cible": 45, "yeux": 50, "hydratant": 60,
    "huile": 70, "spf": 90, "levres": 95, "cils_sourcils": 97,
}

STRONG_ACTIVES = {"retinol", "aha", "bha", "vitamine_c"}

# --- Traductions ---------------------------------------------------------

WEEKDAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
WEEKDAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

ACTIVE_LABELS = {
    "fr": {
        "aha": "l'acide glycolique", "bha": "l'acide salicylique", "retinol": "le rétinol",
        "vitamine_c": "la vitamine C", "niacinamide": "le niacinamide",
    },
    "en": {
        "aha": "glycolic acid", "bha": "salicylic acid", "retinol": "retinol",
        "vitamine_c": "vitamin C", "niacinamide": "niacinamide",
    },
}

WHY = {
    "fr": {
        "nettoyant": "On part sur peau propre — tout le reste se pose mieux ensuite.",
        "exfoliant": "Le plus acide passe en premier, sur peau nue : rien ne doit faire barrière.",
        "vitamine_c": "La vitamine C aime la peau nue du matin — elle protège avant tout le reste.",
        "niacinamide": "Texture aqueuse, elle pénètre vite et calme la peau.",
        "acide_hyaluronique": "L'hydratation légère se glisse tôt, elle retient l'eau pour la suite.",
        "retinol": "Le rétinol se pose sur peau sèche, après les textures fluides.",
        "traitement_cible": "En touches ciblées seulement — pas sur tout le visage.",
        "yeux": "Le contour reste à l'écart des acides : on l'hydrate avant la crème.",
        "hydratant": "La plus riche scelle tout le reste. Toujours en dernier sur le visage.",
        "spf": "Le SPF ferme la marche du matin, sans exception — il protège ce que les autres réparent.",
        "levres": "Les lèvres à la toute fin, pour ne rien transférer ailleurs.",
        "cils_sourcils": "Sur cils et sourcils propres, une fois le visage terminé.",
        "default": "Sa texture le place naturellement ici dans l'ordre.",
    },
    "en": {
        "nettoyant": "We start on clean skin — everything else settles better afterward.",
        "exfoliant": "The most acidic one goes first, on bare skin: nothing should form a barrier.",
        "vitamine_c": "Vitamin C loves bare morning skin — it protects before everything else.",
        "niacinamide": "Watery texture, it absorbs quickly and calms the skin.",
        "acide_hyaluronique": "Light hydration slips in early, it holds water for what follows.",
        "retinol": "Retinol goes on dry skin, after the fluid textures.",
        "traitement_cible": "In targeted dabs only — not all over the face.",
        "yeux": "The eye area stays away from acids: we hydrate it before the cream.",
        "hydratant": "The richest one seals everything else. Always last on the face.",
        "spf": "SPF closes the morning, no exception — it protects what the others repair.",
        "levres": "Lips at the very end, so nothing transfers elsewhere.",
        "cils_sourcils": "On clean lashes and brows, once the face is done.",
        "default": "Its texture places it naturally here in the order.",
    },
}

TEXTS = {
    "fr": {
        "title_matin": "Matin",
        "title_soir_no_exfo": "Soir sans exfoliation",
        "title_soir_exfo": "Soir avec exfoliation",
        "banner_rest": "Tu as exfolié récemment. On laisse la peau souffler — l'exfoliation revient vendredi.",
        "banner_retinol": "Ton rétinol reste au placard ce soir — {acid} occupe déjà le terrain. Je l'ai replacé à jeudi.",
        "banner_three": "Trois actifs forts, c'était beaucoup pour un soir. J'en ai gardé deux et reporté le reste.",
        "decision_one_exfo": "Un seul exfoliant ce soir — je garde {nom} et je replace l'autre plus tard dans la semaine.",
        "wait": "attendre {wait} min",
        "timer_note": ("Il a besoin d'environ {wait} minutes avant la suite. Pars le compte "
                       "quand tu es prête — c'est la seule attente de ce soir."),
        "default_acid": "l'acide",
    },
    "en": {
        "title_matin": "Morning",
        "title_soir_no_exfo": "Evening without exfoliation",
        "title_soir_exfo": "Evening with exfoliation",
        "banner_rest": "You exfoliated recently. We let the skin breathe — exfoliation comes back Friday.",
        "banner_retinol": "Your retinol stays in the cabinet tonight — {acid} already holds the ground. I moved it to Thursday.",
        "banner_three": "Three strong actives was a lot for one evening. I kept two and postponed the rest.",
        "decision_one_exfo": "Just one exfoliant tonight — I'm keeping {nom} and moving the other later this week.",
        "wait": "wait {wait} min",
        "timer_note": ("It needs about {wait} minutes before the next step. Start the timer "
                       "when you're ready — it's the only wait tonight."),
        "default_acid": "the acid",
    },
}


def _norm_lang(lang):
    return "en" if lang == "en" else "fr"


def _has(actifs, tag):
    return tag in (actifs or [])


def _rank(prod):
    base = CATEGORY_RANK.get(prod["categorie"], 55)
    # Among exfoliants, most acidic (lowest pH) goes first.
    ph = prod.get("ph_approx")
    ph_bump = (ph or 7) * 0.1 if prod["categorie"] == "exfoliant" else 0
    return base + prod.get("texture", 3) + ph_bump


def _why(prod, phase, lang="fr"):
    w = WHY[_norm_lang(lang)]
    a = prod["actifs"]
    cat = prod["categorie"]
    if cat == "nettoyant":
        return w["nettoyant"]
    if cat == "exfoliant":
        return w["exfoliant"]
    if _has(a, "vitamine_c"):
        return w["vitamine_c"]
    if _has(a, "niacinamide"):
        return w["niacinamide"]
    if _has(a, "acide_hyaluronique"):
        return w["acide_hyaluronique"]
    if _has(a, "retinol"):
        return w["retinol"]
    if cat == "traitement_cible":
        return w["traitement_cible"]
    if cat == "yeux":
        return w["yeux"]
    if cat == "hydratant":
        return w["hydratant"]
    if cat == "spf":
        return w["spf"]
    if cat == "levres":
        return w["levres"]
    if cat == "cils_sourcils":
        return w["cils_sourcils"]
    return w["default"]


def exfoliation_days(sensibilite):
    """Which weekdays carry exfoliation, based on declared sensitivity (0-3)."""
    if sensibilite is None:
        sensibilite = 1
    if sensibilite <= 1:
        return {1, 4}  # mardi, vendredi (2x)
    if sensibilite == 2:
        return {4}     # vendredi (1x)
    return {4}          # very sensitive: 1x, gentlest


def compute_routine(products, phase="soir", on=None, sensibilite=1, lang="fr"):
    """products: list of product dicts (the user's active shelf).
    Returns dict with title, banner, steps. lang: 'fr' or 'en'."""
    lang = _norm_lang(lang)
    T = TEXTS[lang]
    labels = ACTIVE_LABELS[lang]
    weekdays = WEEKDAYS_FR if lang == "fr" else WEEKDAYS_EN

    on = on or date.today()
    weekday = on.weekday()
    exfo_today = weekday in exfoliation_days(sensibilite)

    # Filter by moment
    pool = [p for p in products if p["moment"] == phase or p["moment"] == "les_deux"]

    banner = None
    decisions = []

    if phase == "matin":
        # No exfoliation in the morning; retinol never in the morning.
        pool = [p for p in pool if p["categorie"] != "exfoliant" and not _has(p["actifs"], "retinol")]
        title = T["title_matin"]
    else:
        exfoliants = [p for p in pool if p["categorie"] == "exfoliant"]
        retinols = [p for p in pool if _has(p["actifs"], "retinol") and p["categorie"] == "serum"]

        if not exfo_today:
            # Rest night: drop exfoliants, keep retinol if present.
            pool = [p for p in pool if p["categorie"] != "exfoliant"]
            title = T["title_soir_no_exfo"]
            if exfoliants:
                banner = T["banner_rest"]
        else:
            title = T["title_soir_exfo"]
            # Keep only the strongest single exfoliant (lowest pH).
            if len(exfoliants) > 1:
                exfoliants_sorted = sorted(exfoliants, key=lambda p: (p.get("ph_approx") or 7))
                keep = exfoliants_sorted[0]
                drop = exfoliants_sorted[1:]
                pool = [p for p in pool if p["categorie"] != "exfoliant" or p is keep]
                decisions.append(T["decision_one_exfo"].format(nom=keep["nom"]))
            # Retinol + exfoliant same night -> keep acid, move retinol.
            if retinols and any(p["categorie"] == "exfoliant" for p in pool):
                acid = next(p for p in pool if p["categorie"] == "exfoliant")
                acid_label = labels.get(acid["actifs"][0], T["default_acid"]) if acid["actifs"] else T["default_acid"]
                pool = [p for p in pool if not (_has(p["actifs"], "retinol") and p["categorie"] == "serum")]
                banner = T["banner_retinol"].format(acid=acid_label)

    # Too many strong actives -> lighten.
    strong = [p for p in pool if set(p["actifs"]) & STRONG_ACTIVES]
    if len(strong) >= 3:
        strong_sorted = sorted(strong, key=lambda p: _rank(p))
        for extra in strong_sorted[2:]:
            pool = [p for p in pool if p is not extra]
        if not banner:
            banner = T["banner_three"]

    # Order the surviving pool.
    ordered = sorted(pool, key=_rank)

    steps = []
    for i, prod in enumerate(ordered, start=1):
        wait = prod.get("temps_attente_apres_min", 0)
        wait_txt = f" · {T['wait'].format(wait=wait)}" if wait else ""
        step = {
            "n": f"{i:02d}",
            "title": prod["nom"],
            "brand": prod["brand"],
            "sub": prod["brand"] + wait_txt,
            "why": _why(prod, phase, lang),
            "category": prod["categorie"],
        }
        if wait:
            step["timer"] = {
                "seconds": wait * 60,
                "note": T["timer_note"].format(wait=wait),
            }
        steps.append(step)

    if decisions and not banner:
        banner = decisions[0]

    return {
        "phase": phase,
        "title": title,
        "date_label": f"{weekdays[weekday].capitalize()} {on.day}",
        "banner": banner,
        "steps": steps,
        "total": len(steps),
    }