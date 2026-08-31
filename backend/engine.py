"""The order engine — the heart of Ordre.
Deterministic, works offline once a routine is computed.
Orders products fluid->rich with acid-first, eye-before-cream, SPF-last rules,
and resolves risky same-session combinations by *acting* (moving, not blocking).
Tone is soft, first person, no alarms.
"""
from datetime import date

# Base rank per category (lower = earlier). Texture (1-5) is the tie-breaker.
CATEGORY_RANK = {
    "nettoyant": 0, "masque": 5, "exfoliant": 10, "toner": 20, "essence": 25,
    "serum": 30, "traitement_cible": 45, "yeux": 50, "hydratant": 60,
    "huile": 70, "spf": 90, "levres": 95, "cils_sourcils": 97,
}

STRONG_ACTIVES = {"retinol", "aha", "bha", "vitamine_c"}

ACTIVE_LABELS = {
    "aha": "l'acide glycolique", "bha": "l'acide salicylique", "retinol": "le rétinol",
    "vitamine_c": "la vitamine C", "niacinamide": "le niacinamide",
}


def _has(actifs, tag):
    return tag in (actifs or [])


def _rank(prod):
    base = CATEGORY_RANK.get(prod["categorie"], 55)
    # Among exfoliants, most acidic (lowest pH) goes first.
    ph = prod.get("ph_approx")
    ph_bump = (ph or 7) * 0.1 if prod["categorie"] == "exfoliant" else 0
    return base + prod.get("texture", 3) + ph_bump


def _why(prod, phase):
    a = prod["actifs"]
    cat = prod["categorie"]
    if cat == "nettoyant":
        return "On part sur peau propre — tout le reste se pose mieux ensuite."
    if cat == "exfoliant":
        return "Le plus acide passe en premier, sur peau nue : rien ne doit faire barrière."
    if _has(a, "vitamine_c"):
        return "La vitamine C aime la peau nue du matin — elle protège avant tout le reste."
    if _has(a, "niacinamide"):
        return "Texture aqueuse, elle pénètre vite et calme la peau."
    if _has(a, "acide_hyaluronique"):
        return "L'hydratation légère se glisse tôt, elle retient l'eau pour la suite."
    if _has(a, "retinol"):
        return "Le rétinol se pose sur peau sèche, après les textures fluides."
    if cat == "traitement_cible":
        return "En touches ciblées seulement — pas sur tout le visage."
    if cat == "yeux":
        return "Le contour reste à l'écart des acides : on l'hydrate avant la crème."
    if cat == "hydratant":
        return "La plus riche scelle tout le reste. Toujours en dernier sur le visage."
    if cat == "spf":
        return "Le SPF ferme la marche du matin, sans exception — il protège ce que les autres réparent."
    if cat == "levres":
        return "Les lèvres à la toute fin, pour ne rien transférer ailleurs."
    if cat == "cils_sourcils":
        return "Sur cils et sourcils propres, une fois le visage terminé."
    return "Sa texture le place naturellement ici dans l'ordre."


WEEKDAYS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]


def exfoliation_days(sensibilite):
    """Which weekdays carry exfoliation, based on declared sensitivity (0-3)."""
    if sensibilite is None:
        sensibilite = 1
    if sensibilite <= 1:
        return {1, 4}  # mardi, vendredi (2x)
    if sensibilite == 2:
        return {4}     # vendredi (1x)
    return {4}          # very sensitive: 1x, gentlest


def compute_routine(products, phase="soir", on=None, sensibilite=1):
    """products: list of product dicts (the user's active shelf).
    Returns dict with title, banner, steps."""
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
        title = "Matin"
    else:
        exfoliants = [p for p in pool if p["categorie"] == "exfoliant"]
        retinols = [p for p in pool if _has(p["actifs"], "retinol") and p["categorie"] == "serum"]

        if not exfo_today:
            # Rest night: drop exfoliants, keep retinol if present.
            pool = [p for p in pool if p["categorie"] != "exfoliant"]
            title = "Soir sans exfoliation"
            if exfoliants:
                banner = "Tu as exfolié récemment. On laisse la peau souffler — l'exfoliation revient vendredi."
        else:
            title = "Soir avec exfoliation"
            # Keep only the strongest single exfoliant (lowest pH).
            if len(exfoliants) > 1:
                exfoliants_sorted = sorted(exfoliants, key=lambda p: (p.get("ph_approx") or 7))
                keep = exfoliants_sorted[0]
                drop = exfoliants_sorted[1:]
                pool = [p for p in pool if p["categorie"] != "exfoliant" or p is keep]
                decisions.append(f"Un seul exfoliant ce soir — je garde {keep['nom']} et je replace l'autre plus tard dans la semaine.")
            # Retinol + exfoliant same night -> keep acid, move retinol.
            if retinols and any(p["categorie"] == "exfoliant" for p in pool):
                acid = next(p for p in pool if p["categorie"] == "exfoliant")
                acid_label = ACTIVE_LABELS.get(acid["actifs"][0], "l'acide") if acid["actifs"] else "l'acide"
                pool = [p for p in pool if not (_has(p["actifs"], "retinol") and p["categorie"] == "serum")]
                banner = (f"Ton rétinol reste au placard ce soir — {acid_label} occupe déjà le terrain. "
                          f"Je l'ai replacé à jeudi.")

    # Too many strong actives -> lighten.
    strong = [p for p in pool if set(p["actifs"]) & STRONG_ACTIVES]
    if len(strong) >= 3:
        strong_sorted = sorted(strong, key=lambda p: _rank(p))
        for extra in strong_sorted[2:]:
            pool = [p for p in pool if p is not extra]
        if not banner:
            banner = "Trois actifs forts, c'était beaucoup pour un soir. J'en ai gardé deux et reporté le reste."

    # Order the surviving pool.
    ordered = sorted(pool, key=_rank)

    steps = []
    for i, prod in enumerate(ordered, start=1):
        wait = prod.get("temps_attente_apres_min", 0)
        step = {
            "n": f"{i:02d}",
            "title": prod["nom"],
            "brand": prod["brand"],
            "sub": prod["brand"] + (f" · attendre {wait} min" if wait else ""),
            "why": _why(prod, phase),
            "category": prod["categorie"],
        }
        if wait:
            step["timer"] = {
                "seconds": wait * 60,
                "note": ("Il a besoin d'environ %d minutes avant la suite. Pars le compte "
                         "quand tu es prête — c'est la seule attente de ce soir.") % wait,
            }
        steps.append(step)

    if decisions and not banner:
        banner = decisions[0]

    return {
        "phase": phase,
        "title": title,
        "date_label": f"{WEEKDAYS_FR[weekday].capitalize()} {on.day}",
        "banner": banner,
        "steps": steps,
        "total": len(steps),
    }
