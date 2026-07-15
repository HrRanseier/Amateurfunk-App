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
  - task: "Bandplan hub refactor — embedded UniversalFreqCheck + tile layout (Amateurfunk top, CB/Flugfunk below)"
    implemented: true
    working: "NA"
    file: "app/bandplan/index.tsx, src/bandplan/UniversalFreqCheck.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Hub now shows embedded 'Frequenz prüfen' (testID freq-check-input, freq-unit-kHz/MHz, freq-detected) that identifies BOTH Amateur and CB. Tiles: bandplan-amateur-button (full-width, top), bandplan-cb-button + bandplan-flugfunk-button (row below). 27.555 MHz -> freq-result-cb with 'Tripple Five, DX Weltweit, illegal' + 'Kanal 12 · Band B' export warning. 14300 kHz -> freq-result-ham + emcomm-hint. 27065 -> CB Kanal 9. Verified via screenshot."
  - task: "Bandplan Amateurfunk subpage — KW band list moved from hub"
    implemented: true
    working: "NA"
    file: "app/bandplan/amateur.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "New /bandplan/amateur screen: 'Frequenz prüfen' button (bandplan-check-button -> /bandplan/check kept) + KURZWELLEN-BÄNDER rows (band-row-160m etc -> /bandplan/band?id=)."
  - task: "Bandplan CB screen refactor — EU Kanäle grid + Export A–J + Tripple Five"
    implemented: true
    working: "NA"
    file: "app/bandplan/cb.tsx, src/bandplan/cbData.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Tabs renamed: 'EU Kanäle' (cb-channel-grid: tap cb-channel-9 -> cb-channel-detail with freq + power + note), 'Freq. prüfen' (unchanged, cb-freq-input), 'Export A–J' (cb-tab-lookup: band chips cb-band-A..J FIRST then cb-lookup-channel input; Band A -> green legal, B-J -> cb-lookup-warn; Band B ch12 = 27.555 -> cb-triple-five 'Tripple Five, DX Weltweit, illegal')."
  - task: "Amateurfunk bands — remove 2200m/600m, reorder (10m first), add 23cm/70cm/2m/6m + integrate into Frequenz prüfen"
    implemented: true
    working: "NA"
    file: "src/bandplan/data.ts, src/bandplan/frequency.ts, app/bandplan/amateur.tsx, app/bandplan/band.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "data.ts BANDS reordered: 10m,12m,15m,17m,20m,30m,40m,60m,80m,160m,23cm,70cm,2m,6m (2200m & 600m removed). New VHF/UHF bands carry unit:'MHz' so segmentRange renders MHz; formatBandwidth() shows kHz for >=10kHz segments. findHamSegment now identifies VHF/UHF on hub 'Frequenz prüfen' AND /bandplan/check. Unit test scripts/bandplan-selftest.ts: 21/21 PASS. Verified amateur list order + 2m band detail via screenshot."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 0
  run_ui: false

backend:
  - task: "Flugfunk OpenAIP proxy — airport search + reverse frequency lookup"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "GET /api/flugfunk/airports?search= proxies OpenAIP (apiKey query param, server-side only in OPENAIP_API_KEY). GET /api/flugfunk/frequency?mhz=&country=DE reverse-lookup with ±0.005 MHz tolerance over cached country airports (24h in-memory cache). Verified via curl: EDDM search returns freqs; 118.705 reverse -> BITBURG/MUENCHEN(TOWER NORTH)/NORTHEIM. External URL works."

test_plan:
  current_focus:
    - "Bandplan hub refactor — embedded UniversalFreqCheck + tile layout (Amateurfunk top, CB/Flugfunk below)"
    - "Bandplan Amateurfunk subpage — KW band list moved from hub"
    - "Bandplan CB screen refactor — EU Kanäle grid + Export A–J + Tripple Five"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: |
      BANDPLAN REFACTOR (frontend only, web preview). Test on /bandplan:
      1) HUB: embedded 'Frequenz prüfen' at top (freq-check-input + freq-unit-kHz/MHz). Enter 14300 kHz -> freq-result-ham (20m) + emcomm-hint.
         Enter 27.555 MHz -> freq-result-cb showing 'Tripple Five, DX Weltweit, illegal' + 'Kanal 12 · Band B' + export warning.
         Enter 27.065 MHz -> freq-result-cb 'Kanal 9'. Tiles: bandplan-amateur-button (full width) -> /bandplan/amateur; bandplan-cb-button; bandplan-flugfunk-button.
      2) AMATEUR SUBPAGE (/bandplan/amateur): bandplan-check-button -> /bandplan/check (still works). band-row-160m etc -> band detail.
      3) CB (/bandplan/cb): tabs 'EU Kanäle'(cb-tab-channels), 'Freq. prüfen'(cb-tab-check), 'Export A–J'(cb-tab-lookup).
         EU Kanäle: cb-channel-grid, tap cb-channel-9 -> cb-channel-detail (freq 27,065 MHz + power + Notrufkanal note). Tap cb-channel-56 -> 'nur FM'.
         Export A–J: cb-band-B selected FIRST then cb-lookup-channel '12' -> cb-lookup-result + cb-triple-five 'Tripple Five, DX Weltweit, illegal'. cb-band-A + '19' -> green legal. cb-band-B + '19' -> cb-lookup-warn.
         Freq. prüfen tab unchanged: cb-freq-input 27.065 -> Kanal 9.
      Regression: Morse, Antennenrechner, Rufzeichen hub tiles still open. (Rufzeichen live lookup native-only — not a bug on web.)

    -agent: "main"
    -message: |
      (Earlier) full Bandplan module (3 phases). Backend + frontend.
      BACKEND (curl/pytest): GET /api/flugfunk/airports?search=EDDM (expect FRANKFURT/MUENCHEN with frequencies),
      GET /api/flugfunk/frequency?mhz=118.705&country=DE (expect matches incl. MUENCHEN 'TOWER NORTH'). Key is in
      OPENAIP_API_KEY (backend .env) — must NEVER appear in any frontend file/response beyond the proxied data.
      FRONTEND (web preview): Hub tile 'tool-tile-bandplan' active -> /bandplan.
        Phase 1: 'bandplan-check-button' -> Frequenz prüfen. testIDs: freq-check-input, freq-unit-kHz/MHz, freq-detected,
          freq-result-in (in-band), emcomm-hint (enter 14300 kHz -> EMCOMM box), freq-result-out (enter 27000 kHz -> §16 AFuV text).
          Band rows: band-row-160m etc -> band detail 'segment-160m-0' with mode/bandwidth/power per class + Quelle footer.
        Phase 2 CB ('bandplan-cb-button'): tabs cb-tab-channels/check/lookup. Channel list cb-channel-9 shows the
          'informeller Notrufkanal – keine amtliche Festlegung' text (NOT official emergency). cb-freq-input 27.065 ->
          cb-check-result 'Kanal 9' with 'AM 4 Watt/FM 4 Watt/SSB 12 Watt'. 26.715 -> Kanal 56 'nur FM'. 27.500 -> cb-check-outside.
          Lookup: cb-lookup-channel 19 + cb-band-A -> green 'legal in Deutschland'; cb-band-B -> cb-lookup-warn export warning.
        Phase 3 Flugfunk ('bandplan-flugfunk-button'): ff-tab-airport/frequency. ff-input 'EDDM' + ff-search-button -> ff-results
          with MUENCHEN frequencies + mandatory disclaimer + 'Daten: OpenAIP (openaip.net)'. ff-tab-frequency 118.705 -> matches.
      Regression: Morse, Antennenrechner, Rufzeichen tiles still open. (Rufzeichen live lookup remains native-only — not a bug on web.)
