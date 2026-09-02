#!/usr/bin/env python3
"""
Comprehensive backend test for MySolaia skincare PWA
Tests all API endpoints with realistic data
"""
import requests
import json
import base64
import uuid
from datetime import datetime
from PIL import Image
import io

# Backend URL from frontend/.env
BASE_URL = "https://bavarois-hub.preview.emergentagent.com/api"

# Test state
test_state = {
    "token": None,
    "user": None,
    "product_ids": [],
    "shelf_ids": [],
    "session_id": None,
}

def log_test(name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")
    return passed

def create_test_image():
    """Create a realistic test image of a skincare product (simple mock)"""
    # Create a simple image with text to simulate a product label
    img = Image.new('RGB', (400, 600), color=(255, 255, 255))
    
    # Save to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_bytes = buffer.getvalue()
    
    # Convert to base64
    b64 = base64.b64encode(img_bytes).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"

def test_auth_register():
    """Test 1: POST /api/auth/register"""
    print("\n" + "="*60)
    print("TEST 1: Auth Registration")
    print("="*60)
    
    # Generate unique email
    unique_id = str(uuid.uuid4())[:8]
    email = f"marie.dubois+{unique_id}@exemple.fr"
    password = "SecurePass123!"
    
    payload = {
        "email": email,
        "password": password,
        "langue": "fr"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        if response.status_code != 200:
            return log_test("Register", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        if "token" not in data or "user" not in data:
            return log_test("Register", False, "Missing token or user in response")
        
        user = data["user"]
        
        # Verify user fields
        checks = [
            ("email", user.get("email") == email.lower()),
            ("statut_abonnement", user.get("statut_abonnement") == "essai"),
            ("onboarded", user.get("onboarded") == False),
            ("fin_essai exists", "fin_essai" in user),
        ]
        
        failed = [name for name, check in checks if not check]
        if failed:
            return log_test("Register", False, f"Failed checks: {', '.join(failed)}")
        
        # Store for later tests
        test_state["token"] = data["token"]
        test_state["user"] = user
        test_state["email"] = email
        test_state["password"] = password
        
        return log_test("Register", True, f"User created: {email}, trial ends: {user.get('fin_essai')}")
        
    except Exception as e:
        return log_test("Register", False, f"Exception: {str(e)}")

def test_auth_login():
    """Test 2: POST /api/auth/login"""
    print("\n" + "="*60)
    print("TEST 2: Auth Login")
    print("="*60)
    
    payload = {
        "email": test_state["email"],
        "password": test_state["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code != 200:
            return log_test("Login", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "token" not in data or "user" not in data:
            return log_test("Login", False, "Missing token or user in response")
        
        # Update token
        test_state["token"] = data["token"]
        
        return log_test("Login", True, f"Logged in successfully")
        
    except Exception as e:
        return log_test("Login", False, f"Exception: {str(e)}")

def test_auth_me():
    """Test 3: GET /api/auth/me"""
    print("\n" + "="*60)
    print("TEST 3: Auth Me")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code != 200:
            return log_test("Auth Me", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "user" not in data:
            return log_test("Auth Me", False, "Missing user in response")
        
        user = data["user"]
        if user.get("email") != test_state["email"].lower():
            return log_test("Auth Me", False, "Email mismatch")
        
        return log_test("Auth Me", True, f"User retrieved: {user.get('email')}")
        
    except Exception as e:
        return log_test("Auth Me", False, f"Exception: {str(e)}")

def test_auth_profile():
    """Test 4: PUT /api/auth/profile"""
    print("\n" + "="*60)
    print("TEST 4: Update Profile")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    payload = {
        "type_de_peau": "mixte",
        "sensibilite": 2,
        "objectifs": ["hydratation", "anti-age"],
        "langue": "fr"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/auth/profile", json=payload, headers=headers)
        
        if response.status_code != 200:
            return log_test("Update Profile", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "user" not in data:
            return log_test("Update Profile", False, "Missing user in response")
        
        user = data["user"]
        
        # Verify updates
        checks = [
            ("onboarded", user.get("onboarded") == True),
            ("type_de_peau", user.get("type_de_peau") == "mixte"),
            ("sensibilite", user.get("sensibilite") == 2),
            ("objectifs", user.get("objectifs") == ["hydratation", "anti-age"]),
        ]
        
        failed = [name for name, check in checks if not check]
        if failed:
            return log_test("Update Profile", False, f"Failed checks: {', '.join(failed)}")
        
        return log_test("Update Profile", True, "Profile updated, onboarded=true")
        
    except Exception as e:
        return log_test("Update Profile", False, f"Exception: {str(e)}")

def test_products_list():
    """Test 5: GET /api/products"""
    print("\n" + "="*60)
    print("TEST 5: List Products")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/products")
        
        if response.status_code != 200:
            return log_test("List Products", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "products" not in data:
            return log_test("List Products", False, "Missing products in response")
        
        products = data["products"]
        
        if len(products) != 48:
            return log_test("List Products", False, f"Expected 48 products, got {len(products)}")
        
        # Store some product IDs for later
        test_state["product_ids"] = [p["id"] for p in products[:5]]
        
        return log_test("List Products", True, f"Retrieved {len(products)} products")
        
    except Exception as e:
        return log_test("List Products", False, f"Exception: {str(e)}")

def test_products_search():
    """Test 5b: GET /api/products?q=retinol"""
    print("\n" + "="*60)
    print("TEST 5b: Search Products")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/products?q=retinol")
        
        if response.status_code != 200:
            return log_test("Search Products", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "products" not in data:
            return log_test("Search Products", False, "Missing products in response")
        
        products = data["products"]
        
        # Should have some results (not necessarily all 48)
        if len(products) == 0:
            return log_test("Search Products", False, "No products found for 'retinol'")
        
        return log_test("Search Products", True, f"Found {len(products)} products matching 'retinol'")
        
    except Exception as e:
        return log_test("Search Products", False, f"Exception: {str(e)}")

def test_shelf_empty():
    """Test 6a: GET /api/shelf (empty initially)"""
    print("\n" + "="*60)
    print("TEST 6a: Get Empty Shelf")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    try:
        response = requests.get(f"{BASE_URL}/shelf", headers=headers)
        
        if response.status_code != 200:
            return log_test("Get Empty Shelf", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "shelf" not in data:
            return log_test("Get Empty Shelf", False, "Missing shelf in response")
        
        shelf = data["shelf"]
        
        if len(shelf) != 0:
            return log_test("Get Empty Shelf", False, f"Expected empty shelf, got {len(shelf)} items")
        
        return log_test("Get Empty Shelf", True, "Shelf is empty as expected")
        
    except Exception as e:
        return log_test("Get Empty Shelf", False, f"Exception: {str(e)}")

def test_shelf_add():
    """Test 6b: POST /api/shelf"""
    print("\n" + "="*60)
    print("TEST 6b: Add Product to Shelf")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    if not test_state["product_ids"]:
        return log_test("Add to Shelf", False, "No product IDs available")
    
    payload = {
        "product_id": test_state["product_ids"][0],
        "notes": "Mon sérum préféré"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/shelf", json=payload, headers=headers)
        
        if response.status_code != 200:
            return log_test("Add to Shelf", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if not data.get("ok") or "shelf_id" not in data:
            return log_test("Add to Shelf", False, "Missing ok or shelf_id in response")
        
        test_state["shelf_ids"].append(data["shelf_id"])
        
        return log_test("Add to Shelf", True, f"Product added, shelf_id: {data['shelf_id']}")
        
    except Exception as e:
        return log_test("Add to Shelf", False, f"Exception: {str(e)}")

def test_shelf_list():
    """Test 6c: GET /api/shelf (with items)"""
    print("\n" + "="*60)
    print("TEST 6c: Get Shelf with Items")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    try:
        response = requests.get(f"{BASE_URL}/shelf", headers=headers)
        
        if response.status_code != 200:
            return log_test("Get Shelf", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "shelf" not in data:
            return log_test("Get Shelf", False, "Missing shelf in response")
        
        shelf = data["shelf"]
        
        if len(shelf) == 0:
            return log_test("Get Shelf", False, "Shelf should have items")
        
        # Verify shelf item has merged product data
        item = shelf[0]
        required_fields = ["shelf_id", "nom", "brand", "categorie", "actifs"]
        missing = [f for f in required_fields if f not in item]
        
        if missing:
            return log_test("Get Shelf", False, f"Missing fields: {', '.join(missing)}")
        
        return log_test("Get Shelf", True, f"Shelf has {len(shelf)} item(s)")
        
    except Exception as e:
        return log_test("Get Shelf", False, f"Exception: {str(e)}")

def test_shelf_manual():
    """Test 6d: POST /api/shelf/manual"""
    print("\n" + "="*60)
    print("TEST 6d: Add Manual Product")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    payload = {
        "brand": "La Roche-Posay",
        "nom": "Effaclar Sérum",
        "categorie": "serum",
        "actifs": ["niacinamide", "acide_salicylique"],
        "texture": 2,
        "notes": "Ajouté manuellement"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/shelf/manual", json=payload, headers=headers)
        
        if response.status_code != 200:
            return log_test("Add Manual Product", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if not data.get("ok") or "product" not in data:
            return log_test("Add Manual Product", False, "Missing ok or product in response")
        
        product = data["product"]
        
        # Verify product fields
        checks = [
            ("brand", product.get("brand") == "La Roche-Posay"),
            ("nom", product.get("nom") == "Effaclar Sérum"),
            ("categorie", product.get("categorie") == "serum"),
            ("source", product.get("source") == "manuel"),
        ]
        
        failed = [name for name, check in checks if not check]
        if failed:
            return log_test("Add Manual Product", False, f"Failed checks: {', '.join(failed)}")
        
        return log_test("Add Manual Product", True, f"Manual product created: {product.get('nom')}")
        
    except Exception as e:
        return log_test("Add Manual Product", False, f"Exception: {str(e)}")

def test_routine_soir_empty():
    """Test 7a: GET /api/routine?phase=soir (with empty shelf - uses seeded fallback)"""
    print("\n" + "="*60)
    print("TEST 7a: Routine Soir (Empty Shelf Fallback)")
    print("="*60)
    
    # Create a new user with empty shelf
    unique_id = str(uuid.uuid4())[:8]
    email = f"test.routine+{unique_id}@exemple.fr"
    
    # Register
    reg_response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": "TestPass123!",
        "langue": "fr"
    })
    
    if reg_response.status_code != 200:
        return log_test("Routine Soir Empty", False, f"Failed to create test user: {reg_response.status_code}")
    
    token = reg_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/routine?phase=soir", headers=headers)
        
        if response.status_code != 200:
            return log_test("Routine Soir Empty", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify structure
        required_fields = ["phase", "title", "steps", "total"]
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return log_test("Routine Soir Empty", False, f"Missing fields: {', '.join(missing)}")
        
        steps = data["steps"]
        
        if len(steps) == 0:
            return log_test("Routine Soir Empty", False, "No steps in routine (should use seeded fallback)")
        
        # Verify step structure
        step = steps[0]
        step_fields = ["n", "title", "brand", "sub", "why", "category"]
        missing_step = [f for f in step_fields if f not in step]
        
        if missing_step:
            return log_test("Routine Soir Empty", False, f"Missing step fields: {', '.join(missing_step)}")
        
        return log_test("Routine Soir Empty", True, f"Routine has {len(steps)} steps (using seeded fallback)")
        
    except Exception as e:
        return log_test("Routine Soir Empty", False, f"Exception: {str(e)}")

def test_routine_matin():
    """Test 7b: GET /api/routine?phase=matin"""
    print("\n" + "="*60)
    print("TEST 7b: Routine Matin")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    try:
        response = requests.get(f"{BASE_URL}/routine?phase=matin", headers=headers)
        
        if response.status_code != 200:
            return log_test("Routine Matin", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        steps = data.get("steps", [])
        
        if len(steps) == 0:
            return log_test("Routine Matin", False, "No steps in routine")
        
        # Verify SPF is last (if present)
        spf_steps = [s for s in steps if s.get("category") == "spf"]
        if spf_steps:
            last_step = steps[-1]
            if last_step.get("category") != "spf":
                return log_test("Routine Matin", False, "SPF should be last step in matin routine")
        
        # Verify no exfoliants or retinol in matin
        exfoliant_steps = [s for s in steps if s.get("category") == "exfoliant"]
        if exfoliant_steps:
            return log_test("Routine Matin", False, "Exfoliants should not appear in matin routine")
        
        return log_test("Routine Matin", True, f"Matin routine has {len(steps)} steps, SPF placement correct")
        
    except Exception as e:
        return log_test("Routine Matin", False, f"Exception: {str(e)}")

def test_routine_soir_with_shelf():
    """Test 7c: GET /api/routine?phase=soir (with shelf items)"""
    print("\n" + "="*60)
    print("TEST 7c: Routine Soir (With Shelf)")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    try:
        response = requests.get(f"{BASE_URL}/routine?phase=soir", headers=headers)
        
        if response.status_code != 200:
            return log_test("Routine Soir", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        steps = data.get("steps", [])
        
        if len(steps) == 0:
            return log_test("Routine Soir", False, "No steps in routine")
        
        # Check for timer on exfoliant steps
        exfoliant_steps = [s for s in steps if s.get("category") == "exfoliant"]
        if exfoliant_steps:
            exfo = exfoliant_steps[0]
            if "timer" in exfo:
                timer = exfo["timer"]
                if "seconds" not in timer or "note" not in timer:
                    return log_test("Routine Soir", False, "Exfoliant timer missing required fields")
        
        # Check for banner (may or may not be present)
        banner = data.get("banner")
        
        return log_test("Routine Soir", True, f"Soir routine has {len(steps)} steps" + 
                       (f", banner: '{banner[:50]}...'" if banner else ""))
        
    except Exception as e:
        return log_test("Routine Soir", False, f"Exception: {str(e)}")

def test_home():
    """Test 8: GET /api/home"""
    print("\n" + "="*60)
    print("TEST 8: Home Aggregation")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    try:
        response = requests.get(f"{BASE_URL}/home", headers=headers)
        
        if response.status_code != 200:
            return log_test("Home", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify structure
        required_fields = ["greeting_kind", "routine", "shelf_preview"]
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return log_test("Home", False, f"Missing fields: {', '.join(missing)}")
        
        greeting = data["greeting_kind"]
        if greeting not in ["matin", "soir"]:
            return log_test("Home", False, f"Invalid greeting_kind: {greeting}")
        
        routine = data["routine"]
        if "steps" not in routine:
            return log_test("Home", False, "Routine missing steps")
        
        shelf_preview = data["shelf_preview"]
        if not isinstance(shelf_preview, list):
            return log_test("Home", False, "shelf_preview should be a list")
        
        suggestion = data.get("suggestion")
        
        return log_test("Home", True, f"Home data retrieved: {greeting}, {len(routine['steps'])} steps, " +
                       f"{len(shelf_preview)} shelf preview items" +
                       (f", suggestion: {suggestion.get('title')}" if suggestion else ""))
        
    except Exception as e:
        return log_test("Home", False, f"Exception: {str(e)}")

def test_journal_create():
    """Test 9a: POST /api/journal"""
    print("\n" + "="*60)
    print("TEST 9a: Create Journal Entry")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    payload = {
        "routine_type": "Soir avec exfoliation",
        "etapes_completees": 7,
        "nb_total_etapes": 8,
        "note_peau": 4
    }
    
    try:
        response = requests.post(f"{BASE_URL}/journal", json=payload, headers=headers)
        
        if response.status_code != 200:
            return log_test("Create Journal", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if not data.get("ok"):
            return log_test("Create Journal", False, "Response should have ok=true")
        
        return log_test("Create Journal", True, "Journal entry created")
        
    except Exception as e:
        return log_test("Create Journal", False, f"Exception: {str(e)}")

def test_journal_list():
    """Test 9b: GET /api/journal"""
    print("\n" + "="*60)
    print("TEST 9b: Get Journal")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    try:
        response = requests.get(f"{BASE_URL}/journal", headers=headers)
        
        if response.status_code != 200:
            return log_test("Get Journal", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify structure
        required_fields = ["days", "stats", "entries", "observation"]
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return log_test("Get Journal", False, f"Missing fields: {', '.join(missing)}")
        
        days = data["days"]
        if len(days) != 14:
            return log_test("Get Journal", False, f"Expected 14 days, got {len(days)}")
        
        stats = data["stats"]
        if len(stats) != 3:
            return log_test("Get Journal", False, f"Expected 3 stats, got {len(stats)}")
        
        entries = data["entries"]
        if len(entries) == 0:
            return log_test("Get Journal", False, "Should have at least one entry")
        
        observation = data["observation"]
        if not observation:
            return log_test("Get Journal", False, "Missing observation")
        
        return log_test("Get Journal", True, f"Journal retrieved: {len(days)} days, {len(stats)} stats, " +
                       f"{len(entries)} entries")
        
    except Exception as e:
        return log_test("Get Journal", False, f"Exception: {str(e)}")

def test_scan():
    """Test 10: POST /api/scan"""
    print("\n" + "="*60)
    print("TEST 10: AI Scan")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    # Create a test image
    image_base64 = create_test_image()
    
    payload = {
        "image_base64": image_base64
    }
    
    try:
        response = requests.post(f"{BASE_URL}/scan", json=payload, headers=headers, timeout=30)
        
        if response.status_code != 200:
            return log_test("AI Scan", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify structure
        required_fields = ["recognized", "product", "note"]
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return log_test("AI Scan", False, f"Missing fields: {', '.join(missing)}")
        
        product = data["product"]
        
        # Verify product has required fields (either matched or proposed)
        product_fields = ["brand", "nom", "categorie"]
        missing_product = [f for f in product_fields if f not in product]
        
        if missing_product:
            return log_test("AI Scan", False, f"Product missing fields: {', '.join(missing_product)}")
        
        recognized = data["recognized"]
        note = data["note"]
        
        return log_test("AI Scan", True, f"Scan completed: recognized={recognized}, " +
                       f"product={product.get('brand')} {product.get('nom')}")
        
    except Exception as e:
        return log_test("AI Scan", False, f"Exception: {str(e)}")

def test_stripe_checkout_yearly():
    """Test 11a: POST /api/payments/checkout (yearly)"""
    print("\n" + "="*60)
    print("TEST 11a: Stripe Checkout (Yearly)")
    print("="*60)
    
    payload = {
        "lookup_key": "ordre_yearly",
        "origin_url": "https://example.com"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/payments/checkout", json=payload)
        
        if response.status_code != 200:
            return log_test("Stripe Checkout Yearly", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify structure
        required_fields = ["checkout_url", "session_id"]
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return log_test("Stripe Checkout Yearly", False, f"Missing fields: {', '.join(missing)}")
        
        checkout_url = data["checkout_url"]
        session_id = data["session_id"]
        
        if not checkout_url.startswith("https://"):
            return log_test("Stripe Checkout Yearly", False, "Invalid checkout_url")
        
        test_state["session_id"] = session_id
        
        return log_test("Stripe Checkout Yearly", True, f"Checkout session created: {session_id}")
        
    except Exception as e:
        return log_test("Stripe Checkout Yearly", False, f"Exception: {str(e)}")

def test_stripe_checkout_monthly():
    """Test 11b: POST /api/payments/checkout (monthly)"""
    print("\n" + "="*60)
    print("TEST 11b: Stripe Checkout (Monthly)")
    print("="*60)
    
    payload = {
        "lookup_key": "ordre_monthly",
        "origin_url": "https://example.com"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/payments/checkout", json=payload)
        
        if response.status_code != 200:
            return log_test("Stripe Checkout Monthly", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "checkout_url" not in data or "session_id" not in data:
            return log_test("Stripe Checkout Monthly", False, "Missing checkout_url or session_id")
        
        return log_test("Stripe Checkout Monthly", True, f"Checkout session created: {data['session_id']}")
        
    except Exception as e:
        return log_test("Stripe Checkout Monthly", False, f"Exception: {str(e)}")

def test_stripe_status():
    """Test 11c: GET /api/payments/status/{session_id}"""
    print("\n" + "="*60)
    print("TEST 11c: Stripe Payment Status")
    print("="*60)
    
    if not test_state.get("session_id"):
        return log_test("Stripe Status", False, "No session_id available")
    
    session_id = test_state["session_id"]
    
    try:
        response = requests.get(f"{BASE_URL}/payments/status/{session_id}")
        
        if response.status_code != 200:
            return log_test("Stripe Status", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        # Verify structure
        required_fields = ["session_id", "status", "payment_status"]
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            return log_test("Stripe Status", False, f"Missing fields: {', '.join(missing)}")
        
        status = data["status"]
        payment_status = data["payment_status"]
        
        # Should be pending/initiated since we didn't complete payment
        if status not in ["initiated", "pending", "completed"]:
            return log_test("Stripe Status", False, f"Unexpected status: {status}")
        
        if payment_status not in ["pending", "paid"]:
            return log_test("Stripe Status", False, f"Unexpected payment_status: {payment_status}")
        
        return log_test("Stripe Status", True, f"Status retrieved: {status}, payment: {payment_status}")
        
    except Exception as e:
        return log_test("Stripe Status", False, f"Exception: {str(e)}")

def test_shelf_delete():
    """Test 12: DELETE /api/shelf/{shelf_id}"""
    print("\n" + "="*60)
    print("TEST 12: Delete Shelf Item")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {test_state['token']}"}
    
    if not test_state.get("shelf_ids"):
        return log_test("Delete Shelf", False, "No shelf_ids available")
    
    shelf_id = test_state["shelf_ids"][0]
    
    try:
        response = requests.delete(f"{BASE_URL}/shelf/{shelf_id}", headers=headers)
        
        if response.status_code != 200:
            return log_test("Delete Shelf", False, f"Status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if not data.get("ok"):
            return log_test("Delete Shelf", False, "Response should have ok=true")
        
        return log_test("Delete Shelf", True, f"Shelf item deleted: {shelf_id}")
        
    except Exception as e:
        return log_test("Delete Shelf", False, f"Exception: {str(e)}")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("ORDRE BACKEND API TEST SUITE")
    print("="*60)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test started at: {datetime.now().isoformat()}")
    
    results = []
    
    # Auth tests
    results.append(("Auth Register", test_auth_register()))
    results.append(("Auth Login", test_auth_login()))
    results.append(("Auth Me", test_auth_me()))
    results.append(("Auth Profile", test_auth_profile()))
    
    # Products tests
    results.append(("Products List", test_products_list()))
    results.append(("Products Search", test_products_search()))
    
    # Shelf tests
    results.append(("Shelf Empty", test_shelf_empty()))
    results.append(("Shelf Add", test_shelf_add()))
    results.append(("Shelf List", test_shelf_list()))
    results.append(("Shelf Manual", test_shelf_manual()))
    
    # Routine tests
    results.append(("Routine Soir Empty", test_routine_soir_empty()))
    results.append(("Routine Matin", test_routine_matin()))
    results.append(("Routine Soir", test_routine_soir_with_shelf()))
    
    # Home test
    results.append(("Home", test_home()))
    
    # Journal tests
    results.append(("Journal Create", test_journal_create()))
    results.append(("Journal List", test_journal_list()))
    
    # AI Scan test
    results.append(("AI Scan", test_scan()))
    
    # Stripe tests
    results.append(("Stripe Checkout Yearly", test_stripe_checkout_yearly()))
    results.append(("Stripe Checkout Monthly", test_stripe_checkout_monthly()))
    results.append(("Stripe Status", test_stripe_status()))
    
    # Shelf delete test
    results.append(("Shelf Delete", test_shelf_delete()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("\nDetailed Results:")
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit(main())
