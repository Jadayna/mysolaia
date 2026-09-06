from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, json, re
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta, timezone, date
import jwt
import bcrypt

from seed_products import SEED_PRODUCTS
from engine import compute_routine, exfoliation_days, WEEKDAYS_FR

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

class ProfileIn(BaseModel):
    nom: Optional[str] = None
    type_de_peau: Optional[str] = None
    sensibilite: Optional[int] = None
    objectifs: Optional[List[str]] = None
    langue: Optional[str] = None

class SecurityUpdateIn(BaseModel):
    current_password: str
    new_email: Optional[EmailStr] = None
    new_password: Optional[str] = None

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
        "statut_abonnement": "essai",
        "fin_essai": (now + timedelta(days=7)).isoformat(),
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
                      "notes": up.get("notes", ""), "actif": up.get("actif", True)}
            result.append(merged)
    return result

@api_router.get("/shelf")
async def get_shelf(user=Depends(current_user)):
    return {"shelf": await _shelf_products(user["id"], active_only=False)}

MAX_FREE_PRODUCTS = 4

@api_router.post("/shelf")
async def add_shelf(body: ShelfIn, user=Depends(current_user)):
    if not user_has_full_access(user):
        current_count = await db.user_products.count_documents({"user_id": user["id"], "actif": True})
        if current_count >= MAX_FREE_PRODUCTS:
            raise HTTPException(
                status_code=403,
                detail="Ton essai gratuit est terminé. Passe à MySolaia Illimité pour ajouter plus de 4 produits !"
            )

    prod = await db.products.find_one({"id": body.product_id}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Produit introuvable")
    up = {"id": str(uuid.uuid4()), "user_id": user["id"], "product_id": body.product_id,
          "photo_url": None, "date_ajout": datetime.now(timezone.utc).isoformat(),
          "actif": True, "notes": body.notes}
    await db.user_products.insert_one(up)
    return {"ok": True, "shelf_id": up["id"]}

@api_router.post("/shelf/manual")
async def add_manual(body: ManualProductIn, user=Depends(current_user)):
    if not user_has_full_access(user):
        current_count = await db.user_products.count_documents({"user_id": user["id"], "actif": True})
        if current_count >= MAX_FREE_PRODUCTS:
            raise HTTPException(
                status_code=403,
                detail="Ton essai gratuit est terminé. Passe à MySolaia Illimité pour ajouter plus de 4 produits !"
            )

    prod = {"id": str(uuid.uuid4()), "brand": body.brand, "nom": body.nom,
            "categorie": body.categorie, "actifs": body.actifs, "texture": body.texture,
            "moment": body.moment, "frequence_max_par_semaine": 7,
            "temps_attente_apres_min": 10 if body.categorie == "exfoliant" else 0,
            "incompatibilites": [], "concentration": "", "ph_approx": None,
            "source": "manuel", "verifie": False}
    await db.products.insert_one(prod)
    up = {"id": str(uuid.uuid4()), "user_id": user["id"], "product_id": prod["id"],
          "photo_url": None, "date_ajout": datetime.now(timezone.utc).isoformat(),
          "actif": True, "notes": body.notes}
    await db.user_products.insert_one(up)
    return {"ok": True, "product": {k: v for k, v in prod.items() if k != "_id"}}

@api_router.delete("/shelf/{shelf_id}")
async def del_shelf(shelf_id: str, user=Depends(current_user)):
    await db.user_products.delete_one({"id": shelf_id, "user_id": user["id"]})
    return {"ok": True}


# ---------------- Routine & Home ----------------
@api_router.get("/routine")
async def get_routine(phase: str = "soir", user=Depends(current_user)):
    products = await _shelf_products(user["id"])
    routine = compute_routine(products, phase=phase, sensibilite=user.get("sensibilite", 1))
    return routine

@api_router.get("/home")
async def home(user=Depends(current_user)):
    now = datetime.now(timezone.utc)
    hour = now.hour
    greeting_kind = "matin" if 4 <= hour < 17 else "soir"
    phase = greeting_kind
    products = await _shelf_products(user["id"])
    demo = False
    routine = compute_routine(products, phase=phase, sensibilite=user.get("sensibilite", 1))
    shelf_preview = [{"categorie": p["categorie"], "nom": p["nom"], "brand": p["brand"]}
                     for p in products[:5]]
    has_spf = any(p["categorie"] == "spf" for p in products)
    suggestion = None
    if products and not has_spf:
        suggestion = {"title": "Il te manque un ecran solaire.",
                      "text": "C'est la seule etape du matin qui protege ce que les autres reparent."}
    return {
        "greeting_kind": greeting_kind,
        "routine": routine,
        "shelf_count": len(products),
        "shelf_preview": shelf_preview,
        "suggestion": suggestion,
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
    return {"ok": True}

@api_router.get("/journal")
async def get_journal(user=Depends(current_user)):
    entries = await db.journal_entries.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    entries.sort(key=lambda e: e["horodatage"], reverse=True)
    today = date.today()
    days = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        day_entries = [e for e in entries if e["horodatage"][:10] == d.isoformat()]
        matin = any(e["routine_type"] == "Matin" for e in day_entries)
        soir = any("soir" in e["routine_type"].lower() for e in day_entries)
        days.append({"d": d.day, "matin": matin, "soir": soir})
    last30 = [e for e in entries if e["horodatage"][:10] >= (today - timedelta(days=30)).isoformat()]
    exfo = len([e for e in last30 if "exfoliation" in e["routine_type"].lower()])
    streak = 0
    cur = today
    day_set = {e["horodatage"][:10] for e in entries}
    while cur.isoformat() in day_set:
        streak += 1
        cur = cur - timedelta(days=1)
    def fmt(e):
        dt = datetime.fromisoformat(e["horodatage"])
        wd = WEEKDAYS_FR[dt.weekday()][:3]
        done = "complete" if e["etapes_completees"] >= e["nb_total_etapes"] else f"{e['etapes_completees']} etapes sur {e['nb_total_etapes']}"
        return {"title": e["routine_type"], "meta": f"{wd}. {dt.day} \u00b7 {done}",
                "time": dt.strftime("%H h %M")}
    stats = [{"n": str(streak), "label": "Jours de suite"},
             {"n": str(len(last30)), "label": "Soins / 30 j"},
             {"n": str(exfo), "label": "Exfoliations / 30 j"}]
    return {"days": days, "stats": stats, "entries": [fmt(e) for e in entries[:6]],
            "observation": _observation(entries)}

def _observation(entries):
    if len(entries) < 3:
        return "Encore quelques jours et je pourrai te dire ce que je remarque dans ton rythme."
    return "Tes routines sont bien régulières, continue comme ça !"


# ---------------- Scan (AI vision Gemini) ----------------
@api_router.post("/scan")
async def scan(body: ScanIn, user=Depends(current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    key = os.environ.get("EMERGENT_LLM_KEY")
    img = body.image_base64.split(",")[-1]
    sys = ("Tu es l'expert produits de l'app MySolaia. On te montre la face avant d'un produit "
           "de soin. Identifie la marque et le nom exact. Reponds UNIQUEMENT en JSON: "
           '{"brand":"","nom":"","categorie":"nettoyant|exfoliant|serum|yeux|hydratant|spf|levres|cils_sourcils|traitement_cible","actif_cle":"","texture_label":"","confiance":0.0}')
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
                "Tu es l'expert produits de l'app MySolaia. On te montre la face avant d'un produit "
                "de soin. Identifie la marque et le nom exact. Reponds UNIQUEMENT en JSON valide sans balises markdown:\n"
                '{"brand":"","nom":"","categorie":"nettoyant|exfoliant|serum|yeux|hydratant|spf|levres|cils_sourcils|traitement_cible","actif_cle":"","texture_label":"","confiance":0.0}'
            )

            response = client_ai.models.generate_content(
                model='gemini-3.6-flash',
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    sys_prompt
                ]
            )

            if response.text:
                m = re.search(r"\{.*\}", response.text, re.S)
                if m:
                    data = json.loads(m.group(0))
        except Exception as e:
            logger.error(f"Gemini scan error: {e}")

    brand = (data.get("brand") or "").strip()
    nom = (data.get("nom") or "").strip()
    matched = None

    if nom:
        matched = await db.products.find_one(
            {"nom": {"$regex": re.escape(nom[:12]), "$options": "i"}}, {"_id": 0})
    if not matched and brand:
        matched = await db.products.find_one(
            {"brand": {"$regex": re.escape(brand), "$options": "i"}}, {"_id": 0})

    if matched:
        matched["category"] = matched.get("category") or matched.get("categorie") or "Serum"
        matched["texture_score"] = matched.get("texture") or 3
        return {"recognized": True, "product": matched, "note": "Produit reconnu et placé dans ton ordre."}

    cat = data.get("categorie") or "serum"
    proposed = {
        "id": None, 
        "brand": brand or "Marque inconnue", 
        "nom": nom or "Produit à confirmer",
        "categorie": cat,
        "category": cat.capitalize(),
        "actifs": [data.get("actif_cle")] if data.get("actif_cle") else [],
        "texture": 3,
        "texture_score": 3,
        "moment": "les_deux", 
        "source": "scan", 
        "verifie": False,
        "texture_label": data.get("texture_label") or "Fluide",
    }
    return {"recognized": bool(brand or nom), "product": proposed, "note": "À confirmer."}


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
            success_url=f"{body.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{body.origin_url}/payment/cancel",
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
async def customer_portal(body: CheckoutIn, user=Depends(current_user)):
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
    if not record:
        raise HTTPException(404, "Transaction introuvable")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.status == "complete" or s.payment_status == "paid":
                customer_id = s.get("customer")
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid", "customer_id": customer_id}})
                
                user_id = record.get("user_id")
                if user_id:
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {"statut_abonnement": "actif", "is_premium": True}}
                    )
                record["status"], record["payment_status"] = "completed", "paid"
        except Exception:
            pass
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"]}

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
    return {"status": "ok"}


@api_router.get("/")
async def root():
    return {"message": "MySolaia API"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=Thread)
