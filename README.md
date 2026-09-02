# MySolaia — la routine qui se construit toute seule

Application PWA mobile-first de routine skincare qui **calcule l'ordre d'application** des
produits et **avertit des combinaisons risquees**. L'utilisatrice ajoute ses produits (photo ou
bibliotheque), l'app les classe, construit ses routines matin/soir et tient un journal de constance.

## Stack

- **Frontend** : React (CRA + CRACO), PWA installable (manifest + service worker, mode hors ligne), Tailwind, i18n FR/EN
- **Backend** : FastAPI (Python)
- **Base de donnees** : MongoDB (motor)
- **Auth** : JWT (courriel + mot de passe)
- **IA** : reconnaissance de produit par vision (cle Emergent LLM)
- **Paiement** : Stripe (essai 7 jours, bac a sable)

## Structure

```
backend/
  server.py            # API FastAPI (auth, produits, etagere, routine, journal, scan, stripe)
  engine.py            # Le moteur d'ordre + regles d'incompatibilite (coeur de l'app)
  seed_products.py     # Bibliotheque de produits (seed) + etagere de demo
  setup_stripe.py      # Creation du catalogue Stripe (idempotent)
  requirements.txt
frontend/
  src/
    App.js             # Gate: auth -> onboarding -> app
    i18n.jsx           # Traductions FR/EN
    context/AuthContext.jsx
    lib/api.js         # Client axios
    components/AppShell.jsx
    screens/           # Home, Scan, Routine, Journal, Trial, Auth, Onboarding
  public/
    manifest.json, service-worker.js, icon-192.png, icon-512.png
```

## Variables d'environnement

Creer `backend/.env` :

```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="ordre"
JWT_SECRET="change-moi"
EMERGENT_LLM_KEY="..."        # ou votre propre cle OpenAI/Gemini
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
```

Creer `frontend/.env` :

```
REACT_APP_BACKEND_URL="http://localhost:8001"
```

## Lancer en local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn install
yarn start
```

Le catalogue Stripe se cree avec `python backend/setup_stripe.py` (necessite une cle Stripe).

## Le moteur d'ordre

Priorites : du plus fluide au plus riche - le plus acide en premier sur peau nue - contour des yeux
avant la creme - hydratant toujours en dernier sur le visage - SPF absolument en dernier le matin -
levres/cils/sourcils apres le visage. Les combinaisons risquees (retinol + AHA/BHA, deux exfoliants,
trois actifs forts...) sont **reorganisees** et expliquees, jamais bloquees.

---

> Aucun conseil medical : l'app ordonne et previent, elle ne diagnostique pas.
