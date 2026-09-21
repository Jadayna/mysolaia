from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, json, re, secrets, string, asyncio
import requests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta, timezone, date
from zoneinfo import ZoneInfo
import jwt
import bcrypt

from seed_products import SEED_PRODUCTS
from tricky_guide import tricky_keys_for_actifs, tricky_guide
from engine import compute_routine, exfoliation_days, WEEKDAYS_FR, WEEKDAYS_EN

load_dotenv()

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'skincare_db')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret')
JWT_ALGO = 'HS256'

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------- Models ----------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    langue: str = "fr"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ForgotIn(BaseModel):
    email: EmailStr
    origin_url: str = ""

class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)

class ProfileIn(BaseModel):
    nom: Optional[str] = None
    type_de_peau: Optional[str] = None
    sensibilite: Optional[int] = None
    objectifs: Optional[List[str]] = None
    langue: Optional[str] = None
    track_skin_feel: Optional[bool] = None
    skin_photos: Optional[List[dict]] = None

class SecurityUpdateIn(BaseModel):
    current_password: str
    new_email: Optional[EmailStr] = None
    new_password: Optional[str] = None

class DeleteAccountIn(BaseModel):
    current_password: str

class ShelfIn(BaseModel):
    product_id: str
    notes: str = ""

class ManualProductIn(BaseModel):
    brand: str
    nom: str
    categorie: str
    actifs: List[str] = []
    texture: int = 3
    moment: str = "les_deux"
    notes: str = ""
    photo_url: Optional[str] = None
    date_ouverture: Optional[str] = None
    pao_mois: Optional[int] = 0

class ScanIn(BaseModel):
    image_base64: str

class JournalIn(BaseModel):
    routine_type: str
    etapes_completees: int
    nb_total_etapes: int
    note_peau: Optional[int] = None

class CheckoutIn(BaseModel):
    lookup_key: str
    origin_url: str

class PortalIn(BaseModel):
    origin_url: str

class JoinCircleIn(BaseModel):
    code: str


# ---------------- Helpers ----------------
def make_token(uid: str) -> str:
    payload = {"uid": uid, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(401, "Non authentifie")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except Exception:
        raise HTTPException(401, "Session invalide")
    user = await db.users.find_one({"id": payload["uid"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "Utilisateur introuvable")
    return user

def public_user(u: dict) -> dict:
    return {k: v for k, v in u.items() if k not in ("_id", "password")}

def user_has_full_access(user: dict) -> bool:
    if user.get("is_premium", False) or user.get("statut_abonnement") == "actif":
        return True
    fin_essai = user.get("fin_essai")
    if fin_essai:
        try:
            end_date = datetime.fromisoformat(fin_essai)
            if datetime.now(timezone.utc) < end_date:
                return True
        except Exception:
            pass
    return False


# ---------------- Auth & Profile ----------------
@api_router.post("/auth/register")
async def register(body: RegisterIn):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(400, "Ce courriel est deja utilise")
    now = datetime.now(timezone.utc)
    user = {
        "id": str(uuid.uuid4()),
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "langue": body.langue,
        "nom": "",
        "type_de_peau": None,
        "sensibilite": 1,
        "objectifs": [],
        "date_inscription": now.isoformat(),
        "statut_abonnement": "gratuit",
        "fin_essai": None,
        "onboarded": False,
    }
    await db.users.insert_one(user)
    return {"token": make_token(user["id"]), "user": public_user(user)}

@api_router.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(401, "Courriel ou mot de passe incorrect")
    return {"token": make_token(user["id"]), "user": public_user(user)}

def _send_reset_email(to_email: str, reset_link: str, lang: str = "fr") -> bool:
    """Envoie le courriel de réinitialisation via Resend (si configuré)."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        logging.warning("RESEND_API_KEY non configuré — courriel de réinitialisation non envoyé à %s", to_email)
        return False
    from_email = os.environ.get("RESET_FROM_EMAIL", "MySolaia <noreply@mysolaia.app>")
    if lang == "fr":
        subject = "Réinitialise ton mot de passe MySolaia"
        html = f"""<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#FAF6F0;padding:32px;border-radius:16px;">
<h2 style="color:#A37B68;">MySolaia</h2>
<p style="color:#4a4a4a;">Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous (lien valide 1 heure) :</p>
<p style="text-align:center;margin:28px 0;"><a href="{reset_link}" style="display:inline-block;background:#A37B68;color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;white-space:nowrap;">Choisir un nouveau mot de passe</a></p>
<p style="color:#8a8a8a;font-size:13px;">Si ce n'était pas toi, ignore simplement ce courriel — ton mot de passe reste inchangé.</p></div>"""
    else:
        subject = "Reset your MySolaia password"
        html = f"""<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#FAF6F0;padding:32px;border-radius:16px;">
<h2 style="color:#A37B68;">MySolaia</h2>
<p style="color:#4a4a4a;">You asked to reset your password. Click the button below (link valid for 1 hour):</p>
<p style="text-align:center;margin:28px 0;"><a href="{reset_link}" style="display:inline-block;background:#A37B68;color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;white-space:nowrap;">Choose a new password</a></p>
<p style="color:#8a8a8a;font-size:13px;">If this wasn't you, just ignore this email — your password stays unchanged.</p></div>"""
    # Version texte brut : améliore la délivrabilité (les courriels 100 % HTML sont plus suspects)
    if lang == "fr":
        text = (
            "MySolaia — réinitialisation du mot de passe\n\n"
            "Tu as demandé à réinitialiser ton mot de passe. Ouvre ce lien (valide 1 heure) :\n"
            f"{reset_link}\n\n"
            "Si ce n'était pas toi, ignore simplement ce courriel — ton mot de passe reste inchangé."
        )
    else:
        text = (
            "MySolaia — password reset\n\n"
            "You asked to reset your password. Open this link (valid 1 hour):\n"
            f"{reset_link}\n\n"
            "If this wasn't you, just ignore this email — your password stays unchanged."
        )
    try:
        r = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"from": from_email, "to": [to_email], "subject": subject, "html": html, "text": text},
            timeout=15,
        )
        if r.status_code not in (200, 201):
            logging.error("Resend: échec envoi (%s): %s", r.status_code, r.text[:200])
            return False
        return True
    except Exception as e:
        logging.error("Resend: exception: %s", str(e)[:200])
        return False


@api_router.post("/auth/forgot")
async def forgot_password(body: ForgotIn):
    # Toujours répondre OK pour ne pas révéler si le courriel existe ou non
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        await db.password_resets.insert_one({
            "token": token,
            "user_id": user["id"],
            "email": user["email"],
            "expires_at": (now + timedelta(hours=1)).isoformat(),
            "used": False,
            "created_at": now.isoformat(),
        })
        origin = (body.origin_url or "").rstrip("/") or "https://mysolaia.vercel.app"
        link = f"{origin}/?reset_token={token}"
        await asyncio.to_thread(_send_reset_email, user["email"], link, user.get("langue", "fr"))
    return {"ok": True}


@api_router.post("/auth/reset")
async def reset_password(body: ResetIn):
    rec = await db.password_resets.find_one({"token": body.token, "used": False})
    if not rec:
        raise HTTPException(400, "Lien invalide ou déjà utilisé")
    try:
        exp = datetime.fromisoformat(rec["expires_at"])
    except Exception:
        raise HTTPException(400, "Lien invalide")
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(400, "Lien expiré — demande un nouveau lien")
    await db.users.update_one({"id": rec["user_id"]}, {"$set": {"password": hash_password(body.new_password)}})
    await db.password_resets.update_many({"user_id": rec["user_id"]}, {"$set": {"used": True}})
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user=Depends(current_user)):
    # Récupérer le user complet avec mot de passe pour les vérif si besoin, mais on retourne public_user
    full_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"user": public_user(full_user)}

@api_router.put("/auth/profile")
async def update_profile(body: ProfileIn, user=Depends(current_user)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    updates["onboarded"] = True
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return {"user": fresh}

@api_router.post("/auth/tip-seen")
async def mark_tip_seen(user=Depends(current_user)):
    """Mémorise que l'astuce 'premier scan' a été vue (persisté au compte : survit aux changements d'appareil/navigateur/adresse)."""
    await db.users.update_one({"id": user["id"]}, {"$set": {"first_scan_tip_seen": True}})
    return {"ok": True}

@api_router.put("/auth/security")
async def update_security(body: SecurityUpdateIn, user=Depends(current_user)):
    full_user = await db.users.find_one({"id": user["id"]})
    if not full_user or not verify_password(body.current_password, full_user["password"]):
        raise HTTPException(401, "Mot de passe actuel incorrect")
    
    set_updates = {}
    if body.new_email:
        existing = await db.users.find_one({"email": body.new_email.lower()})
        if existing and existing["id"] != user["id"]:
            raise HTTPException(400, "Ce courriel est deja utilise par un autre compte")
        set_updates["email"] = body.new_email.lower()
        
    if body.new_password:
        set_updates["password"] = hash_password(body.new_password)
        
    if set_updates:
        await db.users.update_one({"id": user["id"]}, {"$set": set_updates})
        
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return {"ok": True, "user": fresh}

@api_router.post("/auth/reset-data")
async def reset_data(user=Depends(current_user)):
    uid = user["id"]
    await db.user_products.delete_many({"user_id": uid})
    await db.journal_entries.delete_many({"user_id": uid})
    return {"ok": True}

@api_router.post("/auth/delete-account")
async def delete_account(body: DeleteAccountIn, user=Depends(current_user)):
    full_user = await db.users.find_one({"id": user["id"]})
    if not full_user or not verify_password(body.current_password, full_user["password"]):
        raise HTTPException(401, "Mot de passe incorrect")
    # Bloquer si un abonnement payant est actif
       # Annulation automatique de tout abonnement Stripe en cours
    try:
        tx = await db.payment_transactions.find_one({"user_id": user["id"], "customer_id": {"$exists": True}})
        if tx and tx.get("customer_id"):
            subscriptions = stripe.Subscription.list(customer=tx["customer_id"], status="all")
            for sub in subscriptions.auto_paging_iter():
                if sub.status in ("active", "trialing", "past_due"):
                    stripe.Subscription.cancel(sub.id)
    except Exception as e:
        logger.error(f"Erreur annulation Stripe à la suppression du compte: {e}")

    uid = user["id"]

    await db.user_products.delete_many({"user_id": uid})
    await db.journal_entries.delete_many({"user_id": uid})
    await db.payment_transactions.delete_many({"user_id": uid})
    await db.users.delete_one({"id": uid})
    return {"ok": True} 

# ---------------- Products ----------------
@api_router.get("/products")
async def list_products(q: str = "", limit: int = 80):
    query = {}
    if q:
        query = {"$or": [
            {"nom": {"$regex": re.escape(q), "$options": "i"}},
            {"brand": {"$regex": re.escape(q), "$options": "i"}},
        ]}
    items = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return {"products": items}


# ---------------- Shelf ----------------
async def _shelf_products(uid: str, active_only=True):
    q = {"user_id": uid}
    if active_only:
        q["actif"] = True
    ups = await db.user_products.find(q, {"_id": 0}).to_list(500)
    result = []
    for up in ups:
        prod = await db.products.find_one({"id": up["product_id"]}, {"_id": 0})
        if prod:
            merged = {**prod, "shelf_id": up["id"], "photo_url": up.get("photo_url"),
                      "notes": up.get("notes", ""), "actif": up.get("actif", True),
                      "date_ouverture": up.get("date_ouverture"), "pao_mois": up.get("pao_mois", 0),
                      "force_soir": up.get("force_soir", False),
                      "is_favorite": up.get("is_favorite", False),
                      "locked_by_downgrade": up.get("locked_by_downgrade", False),
                      "tricky": tricky_keys_for_actifs(prod.get("actifs", []))}
            result.append(merged)
    return result

@api_router.get("/shelf")
async def get_shelf(user=Depends(current_user)):
    return {"shelf": await _shelf_products(user["id"], active_only=False)}

MAX_FREE_PRODUCTS = 5

@api_router.post("/shelf")
async def add_shelf(body: ShelfIn, user=Depends(current_user)):
    if not user_has_full_access(user):
        current_count = await db.user_products.count_documents({"user_id": user["id"], "actif": True})
        if current_count >= MAX_FREE_PRODUCTS:
            raise HTTPException(
                status_code=403,
                detail="Tu as atteint la limite gratuite de 5 produits. Passe à MySolaia Illimité pour en ajouter davantage !"
            )

    prod = await db.products.find_one({"id": body.product_id}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Produit introuvable")
    up = {"id": str(uuid.uuid4()), "user_id": user["id"], "product_id": body.product_id,
          "photo_url": None, "date_ajout": datetime.now(timezone.utc).isoformat(),
          "actif": True, "notes": body.notes}
    await db.user_products.insert_one(up)
    return {"ok": True, "shelf_id": up["id"]}

@api_router.patch("/shelf/{prod_id}/favorite")
async def toggle_favorite(prod_id: str, user=Depends(current_user)):
    p = await db.user_products.find_one({"id": prod_id, "user_id": user["id"]})
    if not p:
        raise HTTPException(404, "Produit introuvable")
    new_fav = not p.get("is_favorite", False)
    await db.user_products.update_one(
        {"id": prod_id, "user_id": user["id"]},
        {"$set": {"is_favorite": new_fav}}
    )
    return {"id": prod_id, "is_favorite": new_fav}

@api_router.post("/shelf/{shelf_id}/use-tonight")
async def use_tonight(shelf_id: str, user=Depends(current_user)):
    """Étape 5 — force (ou non) l'ajout du produit à la routine du soir.
    Le moteur recalcule ensuite la routine en appliquant ses règles de sécurité."""
    up = await db.user_products.find_one({"id": shelf_id, "user_id": user["id"]})
    if not up:
        raise HTTPException(404, "Produit introuvable")
    new_val = not up.get("force_soir", False)
    await db.user_products.update_one(
        {"id": shelf_id, "user_id": user["id"]},
        {"$set": {"force_soir": new_val}}
    )
    return {"id": shelf_id, "force_soir": new_val}

@api_router.post("/shelf/manual")
async def add_manual(body: ManualProductIn, user=Depends(current_user)):
    if not user_has_full_access(user):
        current_count = await db.user_products.count_documents({"user_id": user["id"], "actif": True})
        if current_count >= MAX_FREE_PRODUCTS:
            raise HTTPException(
                status_code=403,
                detail="Tu as atteint la limite gratuite de 5 produits. Passe à MySolaia Illimité pour en ajouter davantage !"
            )

    prod = {"id": str(uuid.uuid4()), "brand": body.brand, "nom": body.nom,
            "categorie": body.categorie, "actifs": body.actifs, "texture": body.texture,
            "moment": body.moment, "frequence_max_par_semaine": 7,
            "temps_attente_apres_min": 10 if body.categorie == "exfoliant" else 0,
            "incompatibilites": [], "concentration": "", "ph_approx": None,
            "source": "manuel", "verifie": False}
    await db.products.insert_one(prod)
    up = {"id": str(uuid.uuid4()), "user_id": user["id"], "product_id": prod["id"],
          "photo_url": body.photo_url, "date_ajout": datetime.now(timezone.utc).isoformat(),
          "date_ouverture": body.date_ouverture, "pao_mois": body.pao_mois or 0,
          "actif": True, "notes": body.notes}
    await db.user_products.insert_one(up)
    return {"ok": True, "product": {k: v for k, v in prod.items() if k != "_id"}}

@api_router.delete("/shelf/{shelf_id}")
async def del_shelf(shelf_id: str, user=Depends(current_user)):
    await db.user_products.delete_one({"id": shelf_id, "user_id": user["id"]})
    return {"ok": True}

@api_router.post("/shelf/{shelf_id}/toggle")
async def toggle_shelf(shelf_id: str, user=Depends(current_user)):
    up = await db.user_products.find_one({"id": shelf_id, "user_id": user["id"]})
    if not up:
        raise HTTPException(404, "Produit introuvable")
    nouveau = not up.get("actif", True)
    if up.get("locked_by_downgrade") and nouveau:
        # Produit verrouillé 🔴 : réactivation réservée aux abonnées
        if not user_has_full_access(user):
            raise HTTPException(
                403, "Ce soin est verrouillé 🔴 — réabonne-toi à MySolaia Illimité pour le réactiver.")
        await db.user_products.update_one(
            {"id": shelf_id, "user_id": user["id"]},
            {"$set": {"actif": True, "locked_by_downgrade": False}})
        return {"ok": True, "actif": True}
    await db.user_products.update_one(
        {"id": shelf_id, "user_id": user["id"]},
        {"$set": {"actif": nouveau}}
    )
    return {"ok": True, "actif": nouveau}

@api_router.delete("/shelf/clear")
async def clear_shelf(user=Depends(current_user)):
    await db.user_products.delete_many({"user_id": user["id"]})
    return {"ok": True, "message": "Shelf cleared"}

# ---------------- Routine & Home ----------------
@api_router.get("/routine")
async def get_routine(phase: str = "soir", lang: str = "fr", user=Depends(current_user)):
    products = await _shelf_products(user["id"])
    routine = compute_routine(products, phase=phase, sensibilite=user.get("sensibilite", 1), lang=lang)
    return routine

GAPS_TEXTS = {
    "fr": {
        "title": "💡 Ce qui manque à ton étagère",
        "spf": "Un SPF le matin — c'est la seule étape qui protège ce que les autres réparent.",
        "nettoyant": "Un nettoyant doux — tout commence sur peau propre.",
        "hydratant": "Un hydratant — pour sceller tous tes actifs.",
    },
    "en": {
        "title": "💡 What's missing from your shelf",
        "spf": "An SPF in the morning — it's the only step that protects what the others repair.",
        "nettoyant": "A gentle cleanser — everything starts on clean skin.",
        "hydratant": "A moisturizer — to seal in all your actives.",
    },
}


def _detect_gaps(products, phase, lang):
    """Le moteur ne se contente plus d'ordonner : il conseille ce qui manque."""
    if not products:
        return None
    lang = "en" if lang == "en" else "fr"
    t = GAPS_TEXTS[lang]
    cats = {p["categorie"] for p in products}
    missing = []
    # Priorité : ce qui protège / nettoie / scelle, selon le moment de la journée
    if phase == "matin" and "spf" not in cats:
        missing.append(t["spf"])
    if "nettoyant" not in cats:
        missing.append(t["nettoyant"])
    if "hydratant" not in cats:
        missing.append(t["hydratant"])
    if not missing:
        return None
    # Un seul conseil à la fois — doux, pas moralisateur
    return {"title": t["title"], "text": missing[0]}


@api_router.get("/home")
async def home(lang: str = "fr", phase: str = "matin", user=Depends(current_user)):
    phase = "soir" if phase == "soir" else "matin"
    products = await _shelf_products(user["id"])
    demo = False
    routine = compute_routine(products, phase=phase, sensibilite=user.get("sensibilite", 1), lang=lang)
    shelf_preview = [{"categorie": p["categorie"], "nom": p["nom"], "brand": p["brand"]}
                     for p in products[:5]]
    return {
        "greeting_kind": phase,
        "routine": routine,
        "shelf_count": len(products),
        "shelf_preview": shelf_preview,
        "suggestion": _detect_gaps(products, phase, lang),
        "demo": demo,
    }


# ---------------- Journal ----------------
@api_router.post("/journal")
async def add_journal(body: JournalIn, user=Depends(current_user)):
    entry = {"id": str(uuid.uuid4()), "user_id": user["id"], "routine_type": body.routine_type,
             "horodatage": datetime.now(timezone.utc).isoformat(),
             "etapes_completees": body.etapes_completees, "nb_total_etapes": body.nb_total_etapes,
             "note_peau": body.note_peau}
    await db.journal_entries.insert_one(entry)
    # Étape 6 — un Wizz reçu auquel on répond par une routine complétée (12h pour répondre)
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.wizzes.update_many(
        {"to_id": user["id"], "responded_at": None, "expires_at": {"$gt": now_iso}},
        {"$set": {"responded_at": now_iso}})
    return {"ok": True}

@api_router.get("/journal")
async def get_journal(periode: str = "week", lang: str = "fr", tz: str = "UTC", user=Depends(current_user)):
    lang = "en" if lang == "en" else "fr"
    try:
        user_tz = ZoneInfo(tz)
    except Exception:
        user_tz = ZoneInfo("UTC")
    entries = await db.journal_entries.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    entries.sort(key=lambda e: e["horodatage"], reverse=True)

    def local_day(e):
        """Jour calendaire de l'entrée dans le fuseau horaire de l'utilisatrice
        (les horodatages sont stockés en UTC)."""
        return datetime.fromisoformat(e["horodatage"]).astimezone(user_tz).date().isoformat()

    today = datetime.now(user_tz).date()
    n_days = 30 if periode == "month" else 7

    def is_morning(rt):
        rt = (rt or "").lower()
        return "matin" in rt or "morning" in rt

    def is_evening(rt):
        rt = (rt or "").lower()
        return "soir" in rt or "evening" in rt

    days = []
    for i in range(n_days - 1, -1, -1):
        d = today - timedelta(days=i)
        day_entries = [e for e in entries if local_day(e) == d.isoformat()]
        matin = any(is_morning(e["routine_type"]) for e in day_entries)
        soir = any(is_evening(e["routine_type"]) for e in day_entries)
        days.append({"d": d.day, "matin": matin, "soir": soir})

    last30 = [e for e in entries if local_day(e) >= (today - timedelta(days=30)).isoformat()]
    exfo = len([e for e in last30 if "exfoliation" in (e["routine_type"] or "").lower()])
    streak = 0
    cur = today
    day_set = {local_day(e) for e in entries}
    while cur.isoformat() in day_set:
        streak += 1
        cur = cur - timedelta(days=1)

    weekdays = WEEKDAYS_FR if lang == "fr" else WEEKDAYS_EN

    def fmt(e):
        dt = datetime.fromisoformat(e["horodatage"]).astimezone(user_tz)
        wd = weekdays[dt.weekday()][:3]
        complete = e["etapes_completees"] >= e["nb_total_etapes"]
        if lang == "fr":
            done = "complété" if complete else f"{e['etapes_completees']} étapes sur {e['nb_total_etapes']}"
            time_str = dt.strftime("%H h %M")
        else:
            done = "complete" if complete else f"{e['etapes_completees']} of {e['nb_total_etapes']} steps"
            time_str = dt.strftime("%H:%M")
        return {"title": e["routine_type"], "meta": f"{wd}. {dt.day} \u00b7 {done}", "time": time_str, "note_peau": e.get("note_peau")}

    stats = [{"n": str(streak), "label": "streak"},
             {"n": str(len(last30)), "label": "care30"},
             {"n": str(exfo), "label": "exfo30"}]

    start = (today - timedelta(days=n_days - 1)).isoformat()
    ranged = [e for e in entries if local_day(e) >= start]

    return {"days": days, "stats": stats, "entries": [fmt(e) for e in ranged[:30]],
            "observation": _observation(entries, lang),
            "tendance": _tendance_peau(entries, lang)}

def _tendance_peau(entries, lang="fr"):
    """Corrélation temporelle : la note moyenne de peau des 7 derniers jours
    notés, comparée aux 7 jours notés précédents."""
    notes = [(e["horodatage"][:10], e.get("note_peau")) for e in entries
             if e.get("note_peau") is not None]
    if len(notes) < 4:
        return None
    notes.sort(reverse=True)
    recentes = [n for _, n in notes[:7]]
    anciennes = [n for _, n in notes[7:14]]
    if not recentes or not anciennes:
        return None
    moy_r = sum(recentes) / len(recentes)
    moy_a = sum(anciennes) / len(anciennes)
    diff = moy_r - moy_a
    en = lang == "en"
    if diff >= 0.5:
        sens = "hausse"
        msg = ("Your skin has been feeling better lately — whatever you changed, keep going! ✨"
               if en else
               "Ta peau se sent mieux ces derniers temps — ce que tu as changé fonctionne, continue comme ça ! ✨")
    elif diff <= -0.5:
        sens = "baisse"
        msg = ("Your skin has felt a bit more uncomfortable lately. Simplify for a few days and watch how it reacts."
               if en else
               "Ta peau tiraille un peu plus ces derniers temps. Simplifie ta routine quelques jours et observe sa réaction.")
    else:
        sens = "stable"
        msg = ("Your skin feels steady — consistency is paying off."
               if en else
               "Ta peau est stable — ta régularité paie.")
    return {"sens": sens, "message": msg}


# NOUVEAU :
def _observation(entries, lang="fr"):
    # 1. Vérifier si un tiraillement récent a été signalé (note 1 ou 2)
    recent_feelings = [e.get("note_peau") for e in entries[:3] if e.get("note_peau") is not None]
    if any(note <= 2 for note in recent_feelings):
        if lang == "en":
            return "Your skin felt tight recently. Pause strong exfoliants and focus on rich hydration to comfort your skin barrier."
        return "Ta peau a tiraillé récemment. Espace tes exfoliants et privilégie une hydratation riche pour réparer ta barrière cutanée."

    # 2. Si la peau est éclatante (note 5)
    if any(note == 5 for note in recent_feelings):
        if lang == "en":
            return "Your skin is glowing! Your current combination of products is working wonderfully."
        return "Ta peau est rayonnante ! L'ordre et l'alternance de tes soins lui font le plus grand bien."

    # 3. Observation selon la régularité
    if len(entries) < 3:
        if lang == "en":
            return "A few more days and I'll be able to tell you what I notice in your rhythm."
        return "Encore quelques jours et je pourrai te dire ce que je remarque dans ton rythme."

    if lang == "en":
        return "Your routines are nice and consistent, keep it up!"
    return "Tes routines sont bien régulières, continue comme ça !"

# ---------------- Mon Cercle (Étape 6) ----------------
def _invite_code():
    alphabet = string.ascii_uppercase + string.digits
    return "SOLAIA-" + "".join(secrets.choice(alphabet) for _ in range(6))

async def _ensure_circle_fields(uid: str):
    """Garantit le code de parrainage unique + le compteur d'invitations (3 gratuites)."""
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    updates = {}
    if not u.get("invite_code"):
        for _ in range(5):
            code = _invite_code()
            if not await db.users.find_one({"invite_code": code}):
                break
        updates["invite_code"] = code
    if u.get("invites_remaining") is None:
        updates["invites_remaining"] = 3
    if updates:
        await db.users.update_one({"id": uid}, {"$set": updates})
        u.update(updates)
    return u

def _circle_streak(entries):
    day_set = set()
    for e in entries:
        h = e.get("horodatage") or ""
        if h:
            day_set.add(h[:10])
    streak = 0
    cur = date.today()
    if cur.isoformat() not in day_set:
        cur = cur - timedelta(days=1)
    while cur.isoformat() in day_set:
        streak += 1
        cur = cur - timedelta(days=1)
    return streak

def _friendship_query(uid: str, fid: str):
    return {"$or": [{"user_a": uid, "user_b": fid}, {"user_a": fid, "user_b": uid}]}

@api_router.get("/circle")
async def get_circle(user=Depends(current_user)):
    me = await _ensure_circle_fields(user["id"])
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    frs = await db.friendships.find(
        {"$or": [{"user_a": user["id"]}, {"user_b": user["id"]}]}, {"_id": 0}).to_list(200)
    friends = []
    for f in frs:
        fid = f["user_b"] if f["user_a"] == user["id"] else f["user_a"]
        fu = await db.users.find_one({"id": fid}, {"_id": 0})
        if not fu:
            continue
        entries = await db.journal_entries.find({"user_id": fid}, {"_id": 0}).to_list(1000)
        day_set = {e.get("horodatage", "")[:10] for e in entries}
        today = date.today()
        week = [{"d": (today - timedelta(days=i)).isoformat(),
                 "done": (today - timedelta(days=i)).isoformat() in day_set}
                for i in range(6, -1, -1)]
        recent_wizz = await db.wizzes.find_one({
            "from_id": user["id"], "to_id": fid,
            "created_at": {"$gte": (now - timedelta(hours=12)).isoformat()}})
        pending = await db.wizzes.find_one({
            "from_id": fid, "to_id": user["id"],
            "responded_at": None, "expires_at": {"$gt": now_iso}})
        friends.append({
            "user_id": fid,
            "nom": fu.get("nom") or (fu.get("email") or "?").split("@")[0],
            "is_premium": bool(fu.get("is_premium") or fu.get("statut_abonnement") == "actif"),
            "streak": _circle_streak(entries),
            "done_today": today.isoformat() in day_set,
            "week": week,
            "wizz_cooldown": bool(recent_wizz),
            "wizz_pending": bool(pending),
        })
    received_docs = await db.wizzes.find({"to_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    received = []
    for w in received_docs:
        fu = await db.users.find_one({"id": w["from_id"]}, {"_id": 0}) or {}
        expired = (not w.get("responded_at")) and w.get("expires_at", "") < now_iso
        received.append({
            "id": w["id"],
            "from_nom": fu.get("nom") or "?",
            "created_at": w.get("created_at"),
            "expires_at": w.get("expires_at"),
            "responded": bool(w.get("responded_at")),
            "expired": expired,
        })
    return {
        "invite_code": me.get("invite_code"),
        "invites_remaining": me.get("invites_remaining", 3),
        "friends": friends,
        "wizz_received": received,
    }

@api_router.post("/circle/join")
async def join_circle(body: JoinCircleIn, user=Depends(current_user)):
    await _ensure_circle_fields(user["id"])
    code = (body.code or "").strip().upper()
    inviter = await db.users.find_one({"invite_code": code}, {"_id": 0})
    if not inviter:
        raise HTTPException(404, "Code d'invitation invalide")
    if inviter["id"] == user["id"]:
        raise HTTPException(400, "Tu ne peux pas utiliser ton propre code")
    if await db.friendships.find_one(_friendship_query(user["id"], inviter["id"])):
        raise HTTPException(400, "Vous êtes déjà amies")
    inviter = await _ensure_circle_fields(inviter["id"])
    if (inviter.get("invites_remaining") or 0) <= 0:
        raise HTTPException(400, "Cette personne n'a plus d'invitations disponibles")
    await db.friendships.insert_one({
        "id": str(uuid.uuid4()),
        "user_a": inviter["id"], "user_b": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()})
    await db.users.update_one({"id": inviter["id"]}, {"$inc": {"invites_remaining": -1}})
    await db.users.update_one({"id": user["id"]}, {"$set": {"referred_by": inviter["id"]}})
    return {"ok": True, "friend_nom": inviter.get("nom")}

@api_router.delete("/circle/friends/{friend_id}")
async def remove_friend(friend_id: str, user=Depends(current_user)):
    await db.friendships.delete_many(_friendship_query(user["id"], friend_id))
    return {"ok": True}

@api_router.post("/circle/wizz/{friend_id}")
async def send_wizz(friend_id: str, user=Depends(current_user)):
    if not await db.friendships.find_one(_friendship_query(user["id"], friend_id)):
        raise HTTPException(404, "Amie introuvable dans ton cercle")
    now = datetime.now(timezone.utc)
    recent = await db.wizzes.find_one({
        "from_id": user["id"], "to_id": friend_id,
        "created_at": {"$gte": (now - timedelta(hours=12)).isoformat()}})
    if recent:
        raise HTTPException(429, "Un seul Wizz par amie toutes les 12h")
    w = {"id": str(uuid.uuid4()), "from_id": user["id"], "to_id": friend_id,
         "created_at": now.isoformat(),
         "expires_at": (now + timedelta(hours=12)).isoformat(),
         "responded_at": None}
    await db.wizzes.insert_one(w)
    return {"ok": True}


# ---------------- Étape 8 : base de connaissances produits capricieux ----------------
@api_router.get("/knowledge/tricky")
async def get_tricky_guide(lang: str = "fr"):
    """Guide complet des actifs « capricieux » (rétinoïdes, vitamine C, AHA/BHA...)."""
    return {"familles": tricky_guide(lang)}


# ---------------- Quota anti-abus du scan IA ----------------
SCAN_DAILY_LIMIT_FREE = int(os.environ.get("SCAN_DAILY_LIMIT_FREE", "15"))
SCAN_DAILY_LIMIT_PREMIUM = int(os.environ.get("SCAN_DAILY_LIMIT_PREMIUM", "100"))

async def check_scan_quota(user):
    """Incrémente et vérifie le quota journalier de scans IA (chaque scan = un appel Gemini payant).
    Lève 429 si le quota est dépassé."""
    today = datetime.now(timezone.utc).date().isoformat()
    limit = SCAN_DAILY_LIMIT_PREMIUM if user_has_full_access(user) else SCAN_DAILY_LIMIT_FREE
    await db.scan_usage.update_one(
        {"user_id": user["id"], "date": today},
        {"$inc": {"count": 1}},
        upsert=True,
    )
    doc = await db.scan_usage.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    if (doc.get("count", 1) if doc else 1) > limit:
        raise HTTPException(
            status_code=429,
            detail=f"Limite de scans IA atteinte ({limit}/jour). Réessaie demain ✨",
        )


# ---------------- Scan (AI vision Gemini) ----------------
@api_router.post("/scan")
async def scan(body: ScanIn, user=Depends(current_user)):
    await check_scan_quota(user)
    key = os.environ.get("EMERGENT_LLM_KEY")
    img = body.image_base64.split(",")[-1]
    sys = ("Tu es l'expert produits de l'app MySolaia. On te montre la face avant d'un produit "
           "de soin. Identifie la marque et le nom exact. Reponds UNIQUEMENT en JSON: "
           '{"brand":"","nom":"","categorie":"nettoyant|exfoliant|serum|yeux|hydratant|spf|levres|cils_sourcils|traitement_cible|patch","actif_cle":"","texture_label":"","confiance":0.0}')
    data = {}
    gemini_key = os.environ.get("GEMINI_API_KEY")
    
    if gemini_key:
        try:
            import base64
            from google import genai
            from google.genai import types

            client_ai = genai.Client(api_key=gemini_key)
            raw_img = body.image_base64
            mime_type = "image/jpeg"
            if "data:" in raw_img and ";base64," in raw_img:
                header, raw_b64 = raw_img.split(";base64,")
                mime_type = header.replace("data:", "")
            else:
                raw_b64 = raw_img

            image_bytes = base64.b64decode(raw_b64)

            sys_prompt = (
                "Tu es l'expert produits cosmétiques de l'application MySolaia. On te montre l'image d'un produit de soin.\n"
                "1. LIS ATTENTIVEMENT le texte écrit sur le flacon/l'étiquette (OCR). La marque (ex: 'The Ordinary', 'CeraVe', 'La Roche-Posay') et le nom complet exact du produit (ex: 'Niacinamide 10% + Zinc 1%'). Ne confonds pas avec une autre marque célèbre.\n"
                "2. Détermine la catégorie parmi : nettoyant, exfoliant, serum, yeux, hydratant, spf, levres, cils_sourcils, traitement_cible, patch (patchs à boutons hydrocolloïdes).\n"
                "3. Détecte la durée PAO en mois (Period After Opening) : si le symbole de pot ouvert (ex: 3M, 6M, 12M, 24M) est visible, utilise ce chiffre (3, 6, 12 ou 24). Sinon, déduis la durée standard selon la formule (vitamine C = 3, sérums/yeux = 6, crèmes/nettoyants = 12, huiles/poudres = 24).\n"
                "4. Identifie les actifs présents parmi cette liste stricte : retinol, vitamine_c, aha, bha, niacinamide, peroxyde_benzoyle, acide_hyaluronique, peptides, ceramides, squalane, panthenol, acide_azelaique, acide_mandelique, vitamine_e, centella, zinc, allantoine, cafeine.\n"
                "Réponds UNIQUEMENT en JSON valide sans balises markdown ni texte autour:\n"
                '{"brand":"","nom":"","categorie":"serum","pao_mois":6,"actifs":[],"texture_label":"Fluide","confiance":0.95}'
            )


            # Cascade de modèles : si l'un est surchargé (503), on bascule sur le suivant
            import asyncio
            modeles = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash']
            response = None
            for i, modele in enumerate(modeles):
                try:
                    response = client_ai.models.generate_content(
                        model=modele,
                        contents=[
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                            sys_prompt
                        ]
                    )
                    if i > 0:
                        logger.info(f"Scan réussi avec le modèle de secours: {modele}")
                    break  # succès : on sort
                except Exception as retry_err:
                    msg = str(retry_err)
                    est_temporaire = "503" in msg or "UNAVAILABLE" in msg or "overloaded" in msg
                    if est_temporaire and i < len(modeles) - 1:
                        logger.warning(f"{modele} surchargé, bascule sur {modeles[i + 1]}...")
                        await asyncio.sleep(1)
                        continue
                    raise  # autre erreur, ou dernier modèle épuisé

            if response.text:
                m = re.search(r"\{.*\}", response.text, re.S)
                if m:
                    data = json.loads(m.group(0))
        except Exception as e:
            logger.error(f"Gemini scan error: {e}")

    brand = (data.get("brand") or "").strip()
    nom = (data.get("nom") or "").strip()
    matched = None

    # On ne fait de correspondance avec le catalogue QUE si la marque ET le nom matchent
    if brand and nom:
        matched = await db.products.find_one({
            "source": "catalogue",
            "brand": {"$regex": f"^{re.escape(brand)}$", "$options": "i"},
            "nom": {"$regex": re.escape(nom[:10]), "$options": "i"}
        }, {"_id": 0})

    if matched:
        matched["category"] = matched.get("category") or matched.get("categorie") or "Serum"
        matched["texture_score"] = matched.get("texture") or 3
        matched["pao_mois"] = int(data.get("pao_mois") or 6)
        matched["date_ouverture"] = datetime.now(timezone.utc).date().isoformat()
        return {"recognized": True, "product": matched, "note": "Produit certifié reconnu."}

    cat = data.get("categorie") or "serum"
    proposed = {
        "id": None, 
        "brand": brand or "Marque inconnue", 
        "nom": nom or "Produit scanné",
        "categorie": cat,
        "category": cat.capitalize(),
        "actifs": [a for a in (data.get("actifs") or []) if a in {"retinol", "vitamine_c", "aha", "bha", "niacinamide", "peroxyde_benzoyle", "acide_hyaluronique", "peptides", "ceramides", "squalane", "panthenol", "acide_azelaique", "acide_mandelique", "vitamine_e", "centella", "zinc", "allantoine", "cafeine"}],
        "pao_mois": int(data.get("pao_mois") or 6),
        "date_ouverture": datetime.now(timezone.utc).date().isoformat(),
        "texture": 3,
        "texture_score": 3,
        "moment": "les_deux", 
        "source": "scan", 
        "verifie": False,
        "texture_label": data.get("texture_label") or "Fluide",
    }
    return {"recognized": bool(brand or nom), "product": proposed, "note": "À confirmer."}


# ---------------- Modèle « 5 Actifs / Reste en Pause » ----------------
async def apply_free_downgrade(user_id: str):
    """Après annulation/expiration : 5 produits restent actifs (favoris d'abord,
    puis les plus récents), les autres sont verrouillés 🔴 jusqu'au réabonnement."""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"statut_abonnement": "expire", "is_premium": False,
                  "cancel_at_period_end": False, "current_period_end": None}})
    ups = await db.user_products.find(
        {"user_id": user_id, "actif": True}, {"_id": 0}).to_list(500)
    favs = [u for u in ups if u.get("is_favorite")]
    others = [u for u in ups if not u.get("is_favorite")]
    favs.sort(key=lambda u: u.get("date_ajout", ""), reverse=True)
    others.sort(key=lambda u: u.get("date_ajout", ""), reverse=True)
    ordered = favs + others
    keep_ids = {u["id"] for u in ordered[:MAX_FREE_PRODUCTS]}
    for u in ordered:
        if u["id"] in keep_ids:
            await db.user_products.update_one(
                {"id": u["id"]},
                {"$set": {"locked_by_downgrade": False}})
        else:
            await db.user_products.update_one(
                {"id": u["id"]},
                {"$set": {"actif": False, "locked_by_downgrade": True}})


async def restore_after_resubscribe(user_id: str):
    """Au réabonnement : déverrouille tout ce qui avait été mis en pause."""
    await db.user_products.update_many(
        {"user_id": user_id, "locked_by_downgrade": True},
        {"$set": {"actif": True, "locked_by_downgrade": False}})


# ---------------- Stripe & Billing Portal ----------------
import stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_placeholder"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

@api_router.post("/payments/checkout")
async def checkout(body: CheckoutIn, user=Depends(current_user)):
    try:
        prices = stripe.Price.list(lookup_keys=[body.lookup_key], active=True, limit=1).data
        if not prices:
            raise HTTPException(500, f"Prix introuvable: {body.lookup_key}")
        price = prices[0]
        session = stripe.checkout.Session.create(
            line_items=[{"price": price.id, "quantity": 1}],
            mode="subscription",
            subscription_data={"trial_period_days": 7},
            success_url=f"{body.origin_url}/trial?paid=1&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{body.origin_url}/trial?canceled=1",
            metadata={"lookup_key": body.lookup_key, "user_id": user["id"]},
        )
        await db.payment_transactions.insert_one({
            "session_id": session.id, "user_id": user["id"], "lookup_key": body.lookup_key,
            "amount": (price.unit_amount or 0), "currency": price.currency,
            "status": "initiated", "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/portal")
async def customer_portal(body: PortalIn, user=Depends(current_user)):
    """Crée un lien vers le portail client Stripe pour gérer/annuler l'abonnement en 1 clic"""
    try:
        # Chercher la dernière transaction du user pour retrouver son customer ID si existant, ou en créer un
        tx = await db.payment_transactions.find_one({"user_id": user["id"], "customer_id": {"$exists": True}})
        customer_id = tx.get("customer_id") if tx else None

        if not customer_id:
            # Créer un customer stripe à la volée si besoin avec l'email du user
            customer = stripe.Customer.create(email=user["email"], metadata={"user_id": user["id"]})
            customer_id = customer.id

        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{body.origin_url}/",
        )
        return {"url": portal_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    # 1. Vérification auprès de Stripe
    customer_id = None
    customer_email = None
    is_valid = False
    
    try:
        s = stripe.checkout.Session.retrieve(session_id)
        if s.status == "complete" or s.payment_status in ("paid", "no_payment_required"):
            is_valid = True
            customer_id = s.get("customer")
            customer_email = (s.get("customer_details") or {}).get("email")
    except Exception as e:
        logger.error(f"Erreur vérification Stripe session: {e}")

    # 2. Si Stripe valide, on débloque l'utilisateur sans aucune restriction !
    if is_valid:
        # Trouver l'utilisateur par son ID ou par son email de paiement
        user_id = record.get("user_id") if record else None
        user_filter = None
        if user_id:
            user_filter = {"id": user_id}
        elif customer_email:
            user_filter = {"email": customer_email.strip().lower()}

        if user_filter:
            await db.users.update_one(
                user_filter,
                {"$set": {
                    "statut_abonnement": "actif",
                    "is_premium": True,
                    "subscription_tier": "unlimited",
                    "stripe_customer_id": customer_id
                }}
            )
            # Modèle « 5 Actifs / Reste en Pause » : réabonnement → tout déverrouillé
            if user_filter:
                try:
                    uid = (await db.users.find_one(user_filter, {"_id": 0, "id": 1})) or {}
                    if uid.get("id"):
                        await restore_after_resubscribe(uid["id"])
                except Exception as e:
                    logger.warning(f"restore_after_resubscribe: {e}")
            # Étape 6 — parrainage : +1 invitation pour la marraine (une seule fois)
            if user_filter:
                new_sub = await db.users.find_one(user_filter, {"_id": 0})
                if new_sub and new_sub.get("referred_by") and not new_sub.get("referral_rewarded"):
                    await db.users.update_one(
                        {"id": new_sub["referred_by"]},
                        {"$inc": {"invites_remaining": 1}})
                    await db.users.update_one(
                        user_filter,
                        {"$set": {"referral_rewarded": True}})

        if record:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "completed", "payment_status": "paid", "customer_id": customer_id}}
            )

        fresh_user = None
        if user_filter:
            fresh_user = await db.users.find_one(user_filter, {"_id": 0, "password": 0})

        return {
            "session_id": session_id,
            "status": "complete",
            "payment_status": "paid",
            "unlocked": True,
            "user": fresh_user
        }

    return {
        "session_id": session_id,
        "status": record.get("status") if record else "pending",
        "payment_status": record.get("payment_status") if record else "unpaid",
        "unlocked": False
    }

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Signature invalide")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"), "customer_id": obj.get("customer")}})
    if t == "customer.subscription.updated":
        customer_id = obj.get("customer")
        if customer_id:
            u = await db.users.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
            if u:
                period_end = obj.get("current_period_end")
                await db.users.update_one(
                    {"id": u["id"]},
                    {"$set": {"cancel_at_period_end": bool(obj.get("cancel_at_period_end")),
                              "current_period_end": datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat() if period_end else None}})
                logger.info(f"Sync résiliation Stripe pour {u['id']}: cancel_at_period_end={bool(obj.get('cancel_at_period_end'))}")
    if t == "customer.subscription.deleted":
        customer_id = obj.get("customer")
        if customer_id:
            u = await db.users.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
            if u:
                await apply_free_downgrade(u["id"])
                logger.info(f"Downgrade après annulation Stripe pour {u['id']}")
    return {"status": "ok"}

@api_router.post("/subscription/refresh")
async def refresh_subscription(user=Depends(current_user)):
    """Vérifie auprès de Stripe si un abonnement actif existe encore.
    Si non → applique le modèle « 5 Actifs / Reste en Pause ».
    Ne dégrade jamais si l'appel Stripe échoue (principe de prudence)."""
    customer_id = user.get("stripe_customer_id")
    active = False
    stripe_ok = False
    if customer_id:
        try:
            for status in ("active", "trialing"):
                subs = stripe.Subscription.list(customer=customer_id, status=status, limit=1)
                if subs.data:
                    active = True
                    break
            stripe_ok = True
        except Exception as e:
            logger.warning(f"Stripe refresh failed: {e}")
    if active:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"statut_abonnement": "actif", "is_premium": True}})
        await restore_after_resubscribe(user["id"])
        return {"statut": "actif"}
    if stripe_ok and customer_id and (user.get("statut_abonnement") == "actif" or user.get("is_premium")):
        await apply_free_downgrade(user["id"])
        return {"statut": "expire"}
    return {"statut": user.get("statut_abonnement") or "gratuit"}

async def _active_stripe_sub(user: dict):
    """Retrouve l'abonnement Stripe actif ou en essai de l'utilisatrice."""
    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        tx = await db.payment_transactions.find_one({"user_id": user["id"], "customer_id": {"$exists": True}})
        customer_id = tx.get("customer_id") if tx else None
    if not customer_id:
        return None
    for status in ("active", "trialing"):
        subs = stripe.Subscription.list(customer=customer_id, status=status, limit=1)
        if subs.data:
            return subs.data[0]
    return None

def _period_end_iso(sub) -> str | None:
    ts = sub.get("current_period_end")
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None

@api_router.post("/subscription/cancel")
async def cancel_subscription(user=Depends(current_user)):
    """Résiliation en 1 clic : l'accès illimité continue jusqu'à la fin de la période payée."""
    try:
        sub = await _active_stripe_sub(user)
        if not sub:
            raise HTTPException(404, "Aucun abonnement actif trouvé")
        updated = stripe.Subscription.modify(sub.id, cancel_at_period_end=True)
        period_end = _period_end_iso(updated)
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"cancel_at_period_end": True, "current_period_end": period_end}})
        logger.info(f"Résiliation à fin de période pour {user['id']}")
        return {"ok": True, "current_period_end": period_end}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Échec résiliation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/subscription/reactivate")
async def reactivate_subscription(user=Depends(current_user)):
    """Réactive un abonnement résilié avant la fin de sa période."""
    try:
        sub = await _active_stripe_sub(user)
        if not sub:
            raise HTTPException(404, "Aucun abonnement à réactiver trouvé")
        stripe.Subscription.modify(sub.id, cancel_at_period_end=False)
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"cancel_at_period_end": False, "current_period_end": None}})
        logger.info(f"Réactivation pour {user['id']}")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Échec réactivation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok"}

@api_router.get("/")
async def root():
    return {"message": "MySolaia API"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mysolaia.vercel.app", "http://localhost:5173", "https://www.mysolaia.ca", "https://mysolaia.ca"],
    allow_origin_regex=r"https://mysolaia.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
async def seed():
    count = await db.products.count_documents({"source": "catalogue"})
    if count == 0:
        docs = [{"id": str(uuid.uuid4()), **p} for p in SEED_PRODUCTS]
        await db.products.insert_many(docs)
        logger.info(f"Seeded {len(docs)} products")


@app.on_event("shutdown")
async def shutdown():
    client.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)