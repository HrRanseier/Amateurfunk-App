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
  - task: "Morse RECEIVE fix — band tone detection (250–1500 Hz) instead of single narrow bin + live level meter + native error surfacing (Samsung S10 report: hearing morse doesn't work)"
    implemented: true
    working: "NA"
    file: "src/morse/goertzel.ts, src/morse/useMorseReceiver.ts, src/morse/nativeAudio.ts, app/morse.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "USER BUG (installed build, Samsung S10, mic granted): Morse RECEIVE/decoding does nothing. Root cause: receiver used a single narrow Goertzel bin at the configured freq (default 700 Hz, ±~12 Hz) — a real received CW tone almost never matches that exact pitch, so nothing is ever detected, and there was NO feedback. FIX: (1) new goertzel.bandTonePeak() scans a whole band and returns the strongest bin; receiver now detects a tone anywhere 250–1500 Hz (no exact tuning needed). Validated in Node: tones 450/600/700/800/1100 Hz all → strong mag ~6.3 w/ correct detected freq; quiet noise 0.02, silence 0. (2) useMorseReceiver signature changed to useMorseReceiver(seedWpm) — freq no longer needed for RX. (3) Live level meter (testID receive-level-meter) + 'Kalibriere…/Höre…' shown while listening so the operator sees the mic picking up sound. (4) Native errors surfaced via addErrorListener -> status 'error' + receive-error-notice banner (no more silent failure). NATIVE-ONLY feature: cannot be decoded in web preview (micAvailable=false -> shows 'Live-Dekodierung nur im veröffentlichten Build'). Needs on-device build validation by the user. Web smoke test: screen renders, mic tap shows unavailable notice, no crash, presets/stop intact."
  - task: "Morse Betrieb — 5 preset text blocks (persisted text + per-preset repeat 1x/2x/3x/∞), tap-to-send via shared queue, long-press edit, empty-opens-editor + immediate STOP switch"
    implemented: true
    working: "NA"
    file: "app/morse.tsx, src/morse/useMorseSender.ts, src/morse/usePresets.ts, src/morse/PresetEditor.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "NEW feature on /morse. Sender rewritten to a UNIFIED character queue: live typing AND preset blocks feed the SAME pump()/charTimeline (no separate send logic). Footer (above input, always visible): row of 5 compact numbered preset buttons (testID preset-button-1..5). Empty preset shows dashed italic 'Leer'; short-tap opens the editor. Filled preset short-tap => selects it (active highlight) + enqueues its text with its stored repeat. Long-press (delayLongPress 350) any preset => PresetEditor modal (preset-editor-input multiline, preset-editor-save/cancel) to edit text of any length. Repeat chips row (visible only when a preset is active): testID preset-repeat-1 / -2 / -3 / -inf, default 1x, persisted per preset. Presets (text+repeat) persist in AsyncStorage key funk_morse_presets_v1 (survive restart). ∞ = continuous repeat with a word-gap pause between repeats until stopped. STOP switch (testID send-stop-button) sits next to the input, ALWAYS visible: greyed red when idle (disabled), SOLID red when sending (live or preset). Press => immediate abort (audio.stop + clearTimeout + Vibration.cancel + torch off), wipes the whole queue incl. infinite, queue-count back to 0. Self-verified via screenshots: preset create/edit, active highlight + chips, ∞ send (queue-count 9, stop solid red), stop => 0 + greyed. Audio uses Web Audio on web; on-device tone/vibe in Expo Go, torch/mic native-only."
  - task: "GLOBAL DESIGN REFACTOR — Design switcher (Minimalist ↔ Dunkler Hintergrund), tablet max-width, gradient headers, dark text chips, ScreenBg wrapper across all screens"
    implemented: true
    working: "NA"
    file: "src/theme/design.tsx, src/theme/useTheme.ts, src/theme/backgrounds.ts, src/theme/layout.ts, src/components/ScreenBg.tsx, src/components/ScreenHeader.tsx, app/about.tsx, app/index.tsx, app/callsign.tsx, app/qcodes.tsx, app/repeater/index.tsx, app/repeater/detail.tsx, app/morse.tsx, app/antenna.tsx, app/bandplan/*.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Massive UI refactor across 15+ files. New DesignProvider persists mode 'minimal' (auto light/dark) or 'darkbg' (fixed dark bg images 1-8 per module) in AsyncStorage (key funk_design_mode_v1). Settings screen (/about via about-button) has design-option-minimal / design-option-darkbg radio toggle. ScreenBg wrapper is root of every screen (renders bg image in darkbg / plain surface in minimal). ScreenHeader drops solid bar for a dark top gradient in darkbg. Tablet responsiveness: MAX_CONTENT_WIDTH=600 (centered forms/text via layout.centered), MAX_GRID_WIDTH=760 (hub grid). overlayChip() adds semi-transparent dark chip behind free-standing hint/source/disclaimer texts in darkbg for readability. Portrait lock. Smoke-tested via screenshot: hub renders in BOTH modes, settings toggle works, darkbg circuit-board bg + gradient header visible. NEEDS full regression: verify ScreenBg/max-width/text-chips did NOT break scrollviews, inputs, touch targets, list rendering across all 7 modules. FOCUS AREAS per user: (1) Morse Betrieb screen fixed pinned bottom input bar; (2) Repeater band filter chips multi-select layout; (3) Q-Codes + Rufzeichen scroll behavior of live autocomplete/result list."
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
  - task: "Repeater-Finder — hub tile active + navigation"
    implemented: true
    working: "NA"
    file: "src/modules/registry.ts, app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "New ACTIVE tile 'Repeater' (icon access-point-network, subtitle 'DACH · Frequenz', route /repeater) inserted before the disabled Q-Codes tile. testID tool-tile-repeater. Verified via screenshot (tile opens /repeater)."
  - task: "Repeater-Finder — Frequenzsuche DACH (search screen)"
    implemented: true
    working: "NA"
    file: "app/repeater/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "MHz freq input (testID repeater-freq-input) accepts BOTH comma and dot as decimal separator; repeater-search-button calls GET /api/repeater/search?freq=. Results (testID repeater-results) render as tappable cards (repeater-item-<id>): status dot (green on-air/red off-air/amber unknown), call, country badge DE/AT/CH, freq (comma decimal) + Ablage, location, mode + tone tags, status label. Optional multi-select mode filter chips (repeater-chip-fm/dmr/dstar/c4fm) filter client-side (fm/dmr/d-star/fusion substrings). Loading + error + empty states. Attribution 'Daten: RepeaterBook.com' (repeater-attribution) links to repeaterbook.com. Verified via screenshot: '145,600' -> 54 results DE/AT/CH."
  - task: "Repeater-Finder — Detailansicht"
    implemented: true
    working: "NA"
    file: "app/repeater/detail.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Detail screen shows list-provided fields instantly then augments via GET /api/repeater/detail?state_id=&id=. Cards: overview (call, status, country, big freq), FREQUENZDATEN (Downlink/Uplink/Offset/Ablage/Ton-CTCSS/Bandbreite/Betriebsart), STANDORT (location, coords, 'In Karte öffnen' -> google maps), BETREIBER (sponsor if present). Tone prefers richer list value over detail parse. testID repeater-detail. Attribution link present. Verified via screenshot (DB0AL: Downlink 145.5875, Uplink 144.98125, Offset -0.600, coords)."
  - task: "Repeater-Finder REWORK — unified filter search screen (text autocomplete + dynamic band chips + freq + radius)"
    implemented: true
    working: "NA"
    file: "app/repeater/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Full rewrite: single screen, all filters combinable, no tabs. (1) Text autocomplete repeater-text-input debounced -> GET /api/repeater/suggest?q=, dropdown repeater-suggest + repeater-suggest-item-<id>; tap -> /repeater/detail. Prefix match on location/call (case-insensitive); 'Zug' -> Zugspitze verified. (2) Dynamic band chips repeater-band-<key> from GET /api/repeater/bands (only present bands + counts: 10m19,6m5,2m310,70cm1479,23cm121,13cm2,3cm3), multi-select. (3) Freq repeater-freq-input (comma+dot, ±0.0125). (4) Radius: repeater-radius-toggle -> GPS (expo-location, benefit text + repeater-gps-button; denied->manual, blocked->repeater-open-settings) OR manual repeater-location-input + repeater-geocode-button (Nominatim). repeater-radius-slider 1-200km default 30. (5) Results repeater-count 'X Treffer', alphabetical(no radius)/by-distance(radius) with distance badge; pending backfill banner + repeater-refresh-button + auto-poll. Attribution repeater-attribution. Verified via screenshots (Zug autocomplete; 2m->310; +radius München 30km -> DB0ULR 7.7km + pending)."

  - task: "Q-Codes module — new offline reference (Q-Codes + Betriebsabkürzungen unified searchable list)"
    implemented: true
    working: "NA"
    file: "app/qcodes.tsx, src/qcodes/data.ts, src/modules/registry.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Brand-new offline module (no backend). Hub tile qcodes now ENABLED (route /qcodes, subtitle 'Codes & Kürzel'). 64 entries (30 Q-Codes + 73/88 as abbr + 32 Betriebsabkürzungen). Screen: qcode-search-input (placeholder 'Code oder Stichwort suchen…') searches code+question+statement+practice+mnemonic+HIDDEN keywords simultaneously (live, all matches). Filter chips qcode-filter-all/qcode/abbr. Exam toggle qcode-exam-toggle ('Nur prüfungsrelevante anzeigen'). qcode-count 'X Einträge'. Cards qcode-item-<code>: code + type badge (Q-Code/Abkürzung) + 'Prüfung' badge when exam, Frage/Aussage lines, Praxis + Merkhilfe rows. Entry '99' rendered as WARNING (red border + alert icon + red text). Sorted alphabetically. Verified via screenshots: default 64; 'standort'->QTH (Frage/Aussage/Prüfung/Merkhilfe); 99 warning card."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 0
  run_ui: false

backend:
  - task: "Repeater-Finder REWORK — bands/suggest/geocode endpoints + unified search (freq+bands+near+radius) + lazy Mongo coord cache"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "NEW: GET /api/repeater/bands -> only bands present in DACH cache w/ counts (freq-ascending). GET /api/repeater/suggest?q= -> prefix match (call OR location tokens, case-insensitive), returns full repeater dicts. GET /api/repeater/geocode?q= -> Nominatim proxy, server-side rate-limit 1/s + descriptive UA (NOMINATIM_UA). GET /api/repeater/search now accepts freq, bands=csv, near=lat,lon, radius (default 30) — intersection; no near -> full list sorted alphabetically by location w/ count; near -> haversine distance filter, sorted by distance, distanceKm attached, pendingCoords count. LAZY COORDS: coords fetched only when a repeater appears in a real search result, persisted in MongoDB collection repeater_coords + mirrored in _coords; bounded synchronous warm (cap 30) on radius query + background worker (throttled ~0.3s) fills the rest. Verified via curl: bands dynamic; suggest 'Zug'->Zugspitze; bands=2m->310; geocode München; near München 2m 30km -> DB0ULR 7.7km (pending grows down as worker fills); Mongo persisted 122+ coords."
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

  - task: "Repeater-Finder — RepeaterBook DACH scrape/cache + search + detail endpoints"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: true
        -agent: "main"
        -comment: "No API key. Scrapes RepeaterBook row_repeaters/Display_SS.php for DE/AT/CH into a 24h in-memory cache (warmed on startup: 1939 repeaters). GET /api/repeater/search?freq= returns matches within ±0.0125 MHz (id,call,freq,offsetDir,tone,location,modes,status,countryCode). GET /api/repeater/detail?state_id=&id= parses the detail page (lat/lon, downlink, uplink, offset, bandwidth, sponsor). Handoff JSONDecodeError is RESOLVED (regex/line-based parse, no json.loads). Verified via curl+python: 145.6875 -> 53 (DE39/AT8/CH6); detail DM0WM downlink 145.581250, offset -0.600, coords."

test_plan:
  current_focus:
    - "Repeater + Flugfunk backend-dependent flows — verify they work end-to-end with current EXPO_PUBLIC_BACKEND_URL (user reported 'no internet' on installed build; isolate stale-build-URL vs code bug)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: |
      USER REPORT: on the INSTALLED build (Samsung S10) Flugfunk + Repeater show "keine Internetverbindung".
      Morse (offline) works. Backend verified healthy: curl to BOTH http://localhost:8001 and the EXTERNAL
      https://funk-toolbox.preview.emergentagent.com returns HTTP 200 for /api/repeater/bands and /api/flugfunk/airports.
      CORS allow_origins=["*"]. Main-agent screenshots already show Repeater "54 Treffer" for 145.600 and Flugfunk EDDM
      loading fine in the CURRENT preview. Hypothesis: the installed APK has a STALE EXPO_PUBLIC_BACKEND_URL baked in from
      before the fork (EXPO_PUBLIC_* is inlined at build time) → user must republish/rebuild. NO code change was made.
      PLEASE VERIFY (both backend + frontend) that the two backend-dependent flows work end-to-end in the current env, to
      authoritatively rule out a code/backend bug:
      BACKEND: GET /api/repeater/bands (200, bands[]), GET /api/repeater/search?freq=145.6 (200, results[]/count),
               GET /api/flugfunk/airports?search=EDDM (200, airports[] with frequencies), GET /api/flugfunk/frequency?mhz=118.705&country=DE.
      FRONTEND (390x844): /repeater — enter 145.600 in repeater-freq-input => repeater-results with repeater-count > 0 (no repeater-error).
               /bandplan/flugfunk — enter EDDM in ff-input, tap ff-search-button => ff-results (no ff-error).
      Report clearly whether these work; if they work, the on-device failure is a stale-build-URL issue (rebuild needed), not a bug.
      IMPORTANT: The actual mic decoding is a NATIVE-ONLY feature — it CANNOT run in the web preview
      (Constants.executionEnvironment on web => micAvailable=false). So on web the mic button will keep showing
      "Live-Dekodierung nur im veröffentlichten Build". Do NOT fail the task because decoding doesn't run on web.
      What to VERIFY on web (390x844):
      1) NO REGRESSION from the receiver refactor: /morse loads, header back/mic/settings work, tapping the mic
         (header-mic-button) shows the receive-unavailable-notice (native-only) and does NOT crash / no red screen.
      2) The SEND side still works fully (this was just re-tested green in iteration_12, re-confirm quickly):
         5 preset buttons (preset-button-1..5), long-press edit (preset-editor-input/save), repeat chips
         (preset-repeat-1/-2/-3/-inf), short-tap send raises queue-count + turns send-stop-button SOLID red,
         infinite send + STOP returns to 0, live typing in send-text-input works, Reset clears, persistence across reload.
      3) Confirm the new testIDs exist in code and render conditionally (receive-level-meter + receive-error-notice only
         appear while listening / on native error — expected NOT visible on web).
      Code changed: src/morse/goertzel.ts (bandTonePeak), src/morse/useMorseReceiver.ts (signature useMorseReceiver(wpm),
      band detection, error state), src/morse/nativeAudio.ts (addErrorListener), app/morse.tsx (level meter + error banner).
      Backend: none — SKIP.
      1) FOOTER LAYOUT: above the "Text tippen …" input there is a row of 5 numbered preset buttons (preset-button-1..5),
         all showing "Leer" (dashed) initially. A red STOP button (send-stop-button) sits to the RIGHT of the input,
         greyed/disabled when idle.
      2) EDIT: long-press preset-button-2 (hold ~500ms) => PresetEditor opens (preset-editor-input). Type "TEST DE DJ1IR",
         tap preset-editor-save => preset 2 now shows the text (solid), and the repeat chip row appears
         ("Wdh. Baustein 2" + preset-repeat-1/-2/-3/-inf, 1× selected by default).
      3) EMPTY TAP: short-tap an empty preset (e.g. preset-button-5) => opens the editor directly (does NOT send).
      4) SEND (finite): with preset 2 selected, tap preset-repeat-2, then short-tap preset-button-2 => queue-count rises,
         send-stop-button turns SOLID red while sending, preview shows chars; it drains and returns to "0 in Warteschlange",
         stop greys out. (Web plays Web-Audio tone — no need to verify sound, verify the queue/stop STATE.)
      5) SEND (infinite): tap preset-repeat-inf, short-tap preset-button-2 => keeps sending (queue-count stays > 0, stop SOLID red).
         Tap send-stop-button => IMMEDIATE stop: queue-count back to "0 in Warteschlange", stop greyed. Infinite loop must end.
      6) LIVE TYPING still works: type in send-text-input (autouppercases) => queue-count rises, send-preview shows on-air+pending,
         stop turns red during send; Reset (send-clear-button) clears. Backspacing not-yet-sent chars removes them from the queue.
      7) PERSISTENCE: after setting presets, reload the page => preset texts + their repeat settings are still there
         (AsyncStorage key funk_morse_presets_v1).
      8) REGRESSION: header back, mic toggle (native-only banner ok), settings gear opens SettingsSheet; transcript area scrolls.
      No backend involved — SKIP backend.
      injecting a <ScreenBg> root wrapper + tablet max-width + dark text chips into EVERY screen. Goal: confirm NO regressions
      were introduced (scrollviews, text inputs, touch targets, list rendering, navigation) in BOTH design modes.
      STEPS:
      1) Settings: from Hub tap about-button -> /about. Toggle design-option-darkbg then design-option-minimal (radio state changes,
         persists). In darkbg the whole app shows dark circuit-board background images + gradient headers + white text.
      2) Run each module in BOTH modes (switch via settings), verifying content is readable & interactive:
         - Hub (/): 6 tiles render in 2-col grid, centered on wide screens, all navigate.
         - Rufzeichen (/callsign): input auto-uppercases, Suchen button; on web the callsign-web-notice appears (native-only lookup).
         - Repeater (/repeater): FOCUS -> band filter chips repeater-band-<key> multi-select still lays out & toggles; text autocomplete
           repeater-suggest dropdown scrolls over the list; freq input; radius toggle reveals controls. Results list scrolls.
         - Bandplan (/bandplan + /bandplan/amateur, /cb, /flugfunk): embedded Frequenz prüfen, tiles, sub-screens render.
         - Q-Codes (/qcodes): FOCUS -> search live-match list scrolls; filter chips; exam toggle; 99 warning card intact.
         - Morse (/morse): FOCUS -> chat-style layout with FIXED pinned bottom input bar must stay above keyboard / not overlap;
           transcript scrolls; SettingsSheet modal opens.
         - Antenne (/antenna): segmented control, inputs, result cards.
      3) Confirm free-standing disclaimer/attribution texts sit on dark chips (readable) in darkbg mode.
      Known/ignore: web-only console warnings shadow*/pointerEvents (pre-existing, non-blocking). Rufzeichen live lookup is native-only.
      No backend changes in this task — SKIP backend (all green in iteration_9).

    -agent: "main"
    -message: |
      Q-CODES MODULE (new, offline, frontend-only — no backend). Test on /qcodes (hub tile tool-tile-qcodes).
      - Default: qcode-count '64 Einträge', list alphabetical (73, 88, 99, ANT, ...). Filter chips qcode-filter-all/qcode/abbr.
        qcode-filter-qcode -> only Q-Code type (excludes 73/88/99 and abbreviations). qcode-filter-abbr -> only abbreviations.
      - Search qcode-search-input matches code AND hidden keywords: 'standort' -> exactly QTH (qcode-item-QTH) with FRAGE + AUSSAGE + 'Prüfung' badge + Merkhilfe. 'QRZ' -> QRZ. 'danke' -> TNX. 'verschwinde' -> 99.
      - Exam toggle qcode-exam-toggle ON -> only entries with 'Prüfung' badge (e.g. QRL, QRZ, QTH present; QRA, CQ, 73 absent).
      - Entry '99' (qcode-item-99) shown as WARNING card (red border + alert icon + red text), type badge 'Abkürzung'.
      - qcode-search-clear clears the query. Regression: other hub tiles (morse, antenna, callsign, bandplan, repeater) still open.




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
