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

user_problem_statement: |
  Funk Toolbox — offline amateur-radio toolbox (Expo). Add an ACTIVE "Rufzeichen" (callsign)
  module replacing the placeholder tile. Screen: callsign input (auto-UPPERCASE) + search button.
  On search, load hamqth.com/<callsign-lowercase> in a hidden WebView, extract Name, QTH, Country,
  Grid, CQ zone, ITU zone into a native result card (never show address/birth/license/activity/social/nav).
  "Callsign not found in the database" -> native "Rufzeichen nicht gefunden". Fallback: visible WebView
  with injected CSS/JS hiding nav/address/activity/footer. Same theme/light-dark/layout as other modules.

frontend:
  - task: "Rufzeichen module — hub tile active + navigation"
    implemented: true
    working: true
    file: "app/index.tsx, src/modules/registry.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Registry entry enabled (route /callsign). Hub shows active green tile 'Rufzeichen / Callbook-Suche'. Verified via screenshot."
        -working: true
        -agent: "testing"
        -comment: "iteration_4: tile active (no lock), navigates to Rufzeichen screen. PASS."
  - task: "Rufzeichen screen — input uppercase + search + web-only notice"
    implemented: true
    working: true
    file: "app/callsign.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Input auto-uppercases (dl5xyz->DL5XYZ), search button disabled when empty. On WEB preview the live WebView lookup is NOT available; searching shows a German native-only notice (testID callsign-web-notice). Verified via screenshots."
        -working: true
        -agent: "testing"
        -comment: "iteration_4: uppercase works, button disabled-when-empty works, callsign-web-notice shows expected German text, back nav works. PASS."
  - task: "Rufzeichen live lookup (HamQTH WebView extraction) — NATIVE ONLY"
    implemented: true
    working: "NA"
    file: "app/callsign.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "react-native-webview extraction of 6 fields + notfound + CSS fallback. CANNOT be validated in web preview (cross-origin iframe). Extraction selectors validated OFFLINE against real HamQTH HTML (OK2CQR -> all 6 fields; DL5XYZ -> notfound). Requires Expo Go / build to test live."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Rufzeichen module — hub tile active + navigation"
    - "Rufzeichen screen — input uppercase + search + web-only notice"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: |
      Please test FRONTEND ONLY (web preview). Focus on the new Rufzeichen module UI + no regressions.
      IMPORTANT: The live HamQTH lookup uses react-native-webview and is NATIVE-ONLY — it does NOT work in
      the web preview (cross-origin). Do NOT treat missing live callsign data as a bug. In the web preview,
      pressing Suchen MUST show the German notice with testID 'callsign-web-notice'. Verify:
      1) Hub tile testID 'tool-tile-callsign' is active and navigates to the Rufzeichen screen.
      2) 'callsign-input' auto-uppercases typed text; 'callsign-search-button' is disabled when input empty.
      3) After entering a callsign and pressing search, 'callsign-web-notice' appears.
      4) Back navigation returns to hub.
      5) Regression: Morsecode + Antennenrechner tiles still open and Antennenrechner both modes still work.
