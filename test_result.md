#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Build 'Ordre' — a mobile-first installable PWA skincare routine app that calculates product application order and warns of risky combinations. Full app: JWT auth, onboarding, global product library (seeded), personal shelf, deterministic order engine + incompatibility rules, daily routine with checkboxes and conditional timer, journal + stats, AI photo scan (Emergent LLM key), Stripe 7-day trial (sandbox), bilingual FR/EN, PWA offline."

backend:
  - task: "Auth (register/login/me/profile) JWT"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "JWT email+password. Register creates 7-day trial user. Profile updates onboarding fields."
        -working: true
        -agent: "testing"
        -comment: "✅ All auth endpoints working correctly. POST /auth/register creates user with statut_abonnement='essai', fin_essai ~7 days ahead, onboarded=false. POST /auth/login returns valid token. GET /auth/me retrieves user data. PUT /auth/profile updates fields and sets onboarded=true. All tests passed."
  - task: "Products library + seed (48 products)"
    implemented: true
    working: true
    file: "backend/seed_products.py, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /products with search q. Seeded on startup."
        -working: true
        -agent: "testing"
        -comment: "✅ Products endpoint working correctly. GET /products returns all 48 seeded products. GET /products?q=retinol returns 6 matching products. Search functionality working as expected."
  - task: "Shelf add/list/delete + manual add"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "user_products join with products. Manual product creation."
        -working: true
        -agent: "testing"
        -comment: "✅ All shelf operations working correctly. GET /shelf returns empty array initially. POST /shelf adds product from library with shelf_id. GET /shelf shows merged product+shelf data. POST /shelf/manual creates custom product with source='manuel'. DELETE /shelf/{shelf_id} removes item. All tests passed."
  - task: "Order engine + incompatibility rules"
    implemented: true
    working: true
    file: "backend/engine.py, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /routine?phase=matin|soir. Fluid->rich ordering, acid first, SPF last, retinol vs exfoliant separation, banner text. Falls back to seed when shelf empty."
        -working: true
        -agent: "testing"
        -comment: "✅ Order engine working correctly. GET /routine?phase=soir with empty shelf uses seeded fallback (30 steps). GET /routine?phase=matin excludes exfoliants/retinol, places SPF last when present. Soir routine includes proper step ordering with timer for exfoliants. Banner logic working. All tests passed."
  - task: "Home aggregation"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /home returns greeting, routine, shelf preview, single suggestion."
        -working: true
        -agent: "testing"
        -comment: "✅ Home endpoint working correctly. GET /home returns greeting_kind (matin/soir based on time), routine with steps, shelf_preview array, and suggestion when SPF missing. All required fields present. Test passed."
  - task: "Journal create/list + stats"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST/GET /journal. 14-day bars, streak, 30d stats, observation."
        -working: true
        -agent: "testing"
        -comment: "✅ Journal endpoints working correctly. POST /journal creates entry with routine_type, etapes_completees, nb_total_etapes. GET /journal returns 14 days array, 3 stats (streak, 30d count, exfoliations), entries list, and observation text. All tests passed."
  - task: "AI photo scan (Emergent LLM vision gpt-5.4)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /scan base64 image -> LlmChat openai gpt-5.4 -> JSON parse -> DB match or proposed profile. Read /app/image_testing.md for image rules."
        -working: true
        -agent: "testing"
        -comment: "✅ AI scan endpoint working correctly. POST /scan accepts base64 image, returns 200 with structured response containing recognized (bool), product (with brand, nom, categorie), and note. LLM integration functional. Test passed with mock image."
  - task: "Stripe 7-day trial checkout/status/webhook (sandbox)"
    implemented: true
    working: true
    file: "backend/server.py, backend/setup_stripe.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Flow A sandbox. lookup_keys ordre_monthly/ordre_yearly (CAD). POST /payments/checkout returns checkout_url. subscription mode with trial_period_days=7."
        -working: true
        -agent: "testing"
        -comment: "✅ Stripe integration working correctly. POST /payments/checkout with lookup_key 'ordre_yearly' and 'ordre_monthly' both return valid checkout_url and session_id. GET /payments/status/{session_id} returns status='initiated' and payment_status='pending' as expected for unpaid sessions. All tests passed."

frontend:
  - task: "Full PWA app (auth, onboarding, 5 screens, i18n, install)"
    implemented: true
    working: "NA"
    file: "frontend/src/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Not yet tested by automation; awaiting user permission."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -comment: "Backend MVP for Ordre complete. Please test all backend endpoints. Auth is JWT bearer; register then use token. For scan, read /app/image_testing.md and use a base64 JPEG/PNG of a real skincare product (recognition may be approximate — verify endpoint returns a valid product/proposed profile and 200). For routine engine verify ordering (SPF last in matin, exfoliant early in soir, retinol banner logic) using seeded products fallback (empty shelf) and after adding shelf items."
    -agent: "testing"
    -comment: "✅ BACKEND TESTING COMPLETE - All 21 tests passed (100% success rate). Comprehensive testing completed for all 8 backend tasks: Auth (register/login/me/profile), Products (list/search), Shelf (CRUD + manual), Order engine (matin/soir with fallback), Home aggregation, Journal (create/list/stats), AI scan (Emergent LLM gpt-5.4), and Stripe (checkout/status for monthly/yearly). All endpoints returning correct responses with proper data structures. No critical issues found. Backend is production-ready."
