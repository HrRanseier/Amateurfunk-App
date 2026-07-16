# Funk-Toolbox — PRD

## Original Problem Statement
Android-App für Amateurfunker. Hub-and-Module-Architektur: zentraler Startbildschirm (2-Spalten-Grid mit Werkzeug-Kacheln), von dem einzelne Module gestartet werden. Erweiterbar für zukünftige Module. Erstes aktives Modul: Morsecode-Tool (Text→Morse encoding mit Ton/Licht/Vibration-Wiedergabe, Morse→Text decoding). App folgt automatisch dem System-Theme (Light/Dark).

## Architecture
- **Frontend:** Expo Router (SDK 54), file-based routing, stack navigation. Fully offline — **no backend / no DB / no auth / no external integrations.**
- **Theme:** `useColorScheme` reactive Light/Dark. Tokens in `src/theme/` (colors.ts, tokens.ts, useTheme.ts). Dark #121212 + #4CAF50, Light #F5F5F5 + #2E7D32.
- **Module registry:** `src/modules/registry.ts` — single source of truth for hub tiles. Add an entry + a screen file under `app/` to add a new tool (no structural changes).
- **Morse engine:** `src/morse/morse.ts` (ITU map, textToMorse, morseToText, buildTimeline, unitMsFromWpm=1200/wpm, vibrationPattern).
- **Tone:** hidden WebView + Web Audio oscillator (`src/morse/MorseAudio.tsx`) — sample-accurate sine, works in Expo Go.
- **Flashlight:** expo-camera `CameraView enableTorch` (hidden), camera permission handled with pre-explanation + Open-Settings fallback.
- **Vibration:** react-native `Vibration.vibrate(pattern)`.
- **Local storage:** `@/src/utils/storage` via `src/morse/useHistory.ts` (key `funk_morse_history_v1`).
- **Keyboard:** `react-native-keyboard-controller` (KeyboardProvider + KeyboardAwareScrollView).
- **Toast:** `src/components/Toast.tsx` (custom, cross-platform).

## Personas
- Amateur radio operators in the field needing quick, high-contrast, large-touch-target tools.

## Core Requirements (static)
1. Hub grid, 2 columns, 1 active (Morsecode) + 3 disabled placeholders (toast "Bald verfügbar").
2. Morse tool: two tabs (encode/decode), consistent header with back arrow.
3. Encode: live ITU morse, tone/light/vibration playback with shared timing, freq slider (400–1000Hz), speed slider (WPM), local history.
4. Decode: dot/dash tap buttons + alt text input, separators, live decode, reset.
5. Auto system Light/Dark theme, WCAG AA contrast.

## Implemented (2026-06)
- [x] Hub screen with module registry, active/disabled tiles, "Bald verfügbar" toast, haptics.
- [x] **Morse module reworked into a single combined "Betrieb" screen** (Empfang + Senden on one page; old two-tab encode/decode removed).
- [x] SENDEN: live char-by-char transmit queue (each typed char immediately encoded + queued), on-air char highlight, queue counter, backspace removes unsent chars, Reset; multi-select outputs Ton/Licht/Vibration (Ton default); Frequenz (400–1000Hz) + WPM sliders affect transmission in real time.
- [x] EMPFANG: microphone → Goertzel → adaptive Morse decoder pipeline via native `expo-stream-audio` (1s noise calibration, on/off hysteresis, adaptive unit/WPM, 1/3/7 timing, live transcript with auto-scroll). NATIVE-ONLY: shows a clear "nur im veröffentlichten Build" notice in Expo Go / web preview.
- [x] Pure decode + Goertzel logic unit-tested (frontend/scripts/decoder-selftest.ts → 7/7 pass): text→morse→timeline→decoder round-trips incl. adaptive speed; Goertzel frequency discrimination.
- [x] Permissions: RECORD_AUDIO + CAMERA + VIBRATE (app.json + expo-stream-audio config plugin); mic denied → Open-Settings fallback.
- [x] Reactive Light/Dark theme, custom Toast, keyboard handling, back-button canGoBack fallback.
- [x] Frontend tested: hub/nav/toast (22/23) + combined screen send/toggles/sliders/receive-notice (11/11).
- [x] **Betrieb screen re-laid-out as a chat-style 3-zone layout (2026-06):** fixed header (back + title + mic toggle with green pulse + settings gear), scrollable transcript-only middle (flex:1, auto-scroll, dismissible native-only banner), fixed footer above keyboard (compact 1-line send preview + queue/Reset row + full-width input) via `KeyboardAvoidingView`. Frequency/speed sliders + output selection moved into a `SettingsSheet` modal (Modal-based bottom-sheet). Functionality unchanged (same useMorseSender/useMorseReceiver hooks).

## Update 2026-06 (Bandplan module — 3 phases, all tested green iteration_5)
- [x] Hub tile **Bandplan** active (`/bandplan`, subtitle "KW · CB · Flugfunk").
- [x] **Phase 1 — Amateur KW bandplan** (`app/bandplan/index.tsx`, `band.tsx`, `check.tsx`; data `src/bandplan/data.ts` + `frequency.ts`, 15/15 unit tests). Band list 2200m..10m → detail with per-segment mode, recommended Rufwelle, max bandwidth, power per class A/E/N, "Quelle: DARC …" footer. Frequenz prüfen: kHz/MHz toggle, comma+dot, "Erkannt: X kHz", in-band card, EMCOMM highlight (3760/7110/14300/18160/21360 kHz), out-of-band → §16 Abs.9 AFuV text. Main-screen disclaimer.
- [x] **Phase 2 — CB-Funk** (`app/bandplan/cb.tsx`, data `src/bandplan/cbData.ts`, 13/13 unit tests). 3 tabs: 80-channel list (ch9 = "informeller Notrufkanal – keine amtliche Festlegung", NOT official); Frequenz prüfen (ch1-40 AM/FM/SSB, ch41-80 nur FM, Datenkanal flag for {6,7,24,25,52,53,76,77}, outside 26.565-27.405 message); Kanal→Frequenz Band A–J (A green legal, B–J export warning, no power/mode). Band B–J derived from Band A + verified per-band offset (fixed one OCR anomaly Band D ch25 = 28.145).
- [x] **Phase 3 — Flugfunk / OpenAIP** (`app/bandplan/flugfunk.tsx` + backend `server.py` proxy). Backend `GET /api/flugfunk/airports?search=` and `GET /api/flugfunk/frequency?mhz=&country=DE` (±0.005 MHz, 24h in-memory country cache). API key server-side only in `OPENAIP_API_KEY`. Frontend: Flughafen→Freq. and Freq.→Flughafen tabs, mandatory disclaimer + "Daten: OpenAIP (openaip.net)". Works in web preview + native (backend-backed).
- [x] Data notes: ch9 text overridden per user; Bereich-1 channel notes come from PDF while Bereich-2 data-channel flag uses the user's explicit set {6,7,24,25,52,53,76,77}; Band D ch25 OCR corrected via deterministic offset scheme.

## Backlog
- P1: Bandplan, Q-Codes modules (registry-driven).
- P2: adjustable dot/dash weighting, waterfall/spectrum view for receive, save/share sessions.

## Update 2026-06 (Rufzeichen module)
- [x] New ACTIVE module **Rufzeichen** (`/app/callsign.tsx`, registry entry enabled, antenna icon, subtitle "Callbook-Suche"). Replaces the former disabled placeholder.
- [x] UI: callsign TextInput auto-uppercases + sanitises to A-Z0-9/, "Suchen" button (disabled when empty), native result card, same theme/tokens/layout as other modules.
- [x] Lookup: on search a hidden `react-native-webview` loads `https://www.hamqth.com/<call-lowercase>`. Injected JS (`EXTRACT_JS`) reads the fixed `td.infoDesc` label/value pairs and posts back ONLY Name, QTH, Country, Grid, CQ, ITU. Address/birth/license/activity/social/nav are never mapped.
- [x] "Callsign not found in the database" → native "Rufzeichen nicht gefunden".
- [x] Fallback (`FALLBACK_JS`): if extraction returns empty/errors or 12s timeout, the WebView is shown visibly with injected CSS/JS that isolates `#callInfo`, drops the address column (2nd `.col-sm-3`) and strips navbar/ads/footer.
- [x] **NATIVE-ONLY:** react-native-webview injection does not run in the web preview (cross-origin). On web (`Platform.OS==='web'`) the search shows a German notice (testID `callsign-web-notice`). Extraction selectors validated OFFLINE against real HamQTH HTML (OK2CQR → all 6 fields; DL5XYZ → notfound). Frontend UI + regressions tested green (iteration_4). Live lookup to be validated in Expo Go / build.

## Notes / Limitations
- Ton (WebView Web Audio) + Vibration work in Expo Go; Licht (torch) and **microphone live decoding require the published build** (expo-stream-audio is a native module, not in Expo Go / web). Receive decode validated via unit tests until a build is generated.
- expo-stream-audio v0.1.3 is a young module; if the first native build surfaces API/behaviour differences, the wrapper in `src/morse/nativeAudio.ts` is the single place to adjust.

## Next Tasks
- Generate an Android build (Publish) to validate live mic decoding + torch on-device, then tune calibration thresholds if needed.

## Update 2026-06 (Title + Antenna module)
- [x] Home title changed to "Funk Toolbox" with small subtitle "by DJ 1 IR".
- [x] New ACTIVE module **Antennenrechner** (`/app/antenna.tsx`, logic in `src/antenna/antenna.ts`, registry entry, calculator icon):
  - 3-step flow: frequency (MHz) → lambda (1/4, 1/2, 5/8, 1/1 → Bauform stretched/loop) → feed point (auto-locked for λ/4, 5/8, 1λ-stretched; user-choice for λ/2 and 1λ-loop).
  - Length: λ(m)=300/f, shortening factor 0.95 (editable under "Erweitert"); λ/4=0.25·300·VF/f, λ/2=0.5·…, 5/8=0.625·…, 1λ-stretched=1.0·…; 1λ-loop fixed 306.3/f (VF not applied).
  - Matching-device text + feed-point impedance per feed point (incl. 5/8 Anpassspule note); prominent length (2 decimals, German comma) + fixed disclaimer.
  - Pure logic unit-tested: `scripts/antenna-selftest.ts` → 19/19 pass. Flows verified via screenshots (λ/2 dipole, 1λ loop, λ/4 locked, 5/8 note, VF live-edit).

## Update 2026-06 (Antenna simplified to bidirectional calculator)
- [x] Removed feed-point (Speisepunkt) + matching-device (Anpassgerät) logic entirely. `src/antenna/antenna.ts` now: `computeLength(f, lambda, oneWhole, vf)` and `resonantBands(lengthM, vf)`.
- [x] Two modes via segmented control: **Frequenz → Länge** (f MHz + λ-fraction → wire length) and **Länge → Bänder** (wire length → resonant IARU-R1 ham bands incl. harmonics f_n = n·150·VF/L).
- [x] Verkürzungsfaktor fixed at DEFAULT_VF = 0.95 (loop uses 306.3/f). **"Erweitert · Verkürzungsfaktor" UI removed** per user request.
- [x] Frequency field placeholder is "Sendefrequenz eingeben"; **warning shown when frequency typed without a decimal point** (e.g. "14200") asking the user to confirm intent.
- [x] Unit tests: `scripts/antenna-selftest.ts` → 16/16 pass. Lint clean. UI verified via screenshots (forward result, decimal warning, advanced section gone).
- [x] **Forward layout reordered:** removed the separate numbered "Sendefrequenz" step card — frequency is now typed directly in the prominent top field (placeholder "Sendefrequenz eingeben", ruler icon + MHz). Order: Frequenz-Feld → Lambda-Anteil → DRAHTLÄNGE result (result card now sits below the lambda selection). Verified via screenshots (empty + 14.200/λ/2 → 10,04 m).
- [x] Fixed reverse-tab crash (leftover `renderAdvanced()` call after the advanced section was removed). Frequency field turned borderless to fit its card.
- [x] **Reverse mode expanded to multi-form usage:** `resonantBands(L, vf)` now checks λ/4 (coeff 75), 5/8 λ (187.5) and the full λ/2 harmonic series n·150 (n=1 λ/2, n=2 1 λ, n≥3 harmonics), f = coeff·VF/L. Added **CB 11 m band (26.965–27.405 MHz)** to `HAM_BANDS`. Each hit shows Band · Frequenz · Bauform, sorted by frequency asc. Example 6,60 m → 11 m (CB) · 26,989 MHz · 5/8 λ. Unit tests `scripts/antenna-selftest.ts` → 19/19 pass; UI verified via screenshots (6,60 m + 20,10 m).


## Update 2026-07 (Repeater-Finder module — Phase 1: Frequenzsuche DACH + Detailansicht)
- [x] New ACTIVE hub tile **Repeater** (`src/modules/registry.ts`, icon `access-point-network`, subtitle "DACH · Frequenz", route `/repeater`, testID `tool-tile-repeater`), inserted before the disabled Q-Codes tile.
- [x] **Backend (`backend/server.py`, NO API key):** scrapes RepeaterBook `row_repeaters/Display_SS.php` for DE/AT/CH into a 24h in-memory cache, **warmed on startup** (`@app.on_event("startup")` → ~1939 repeaters). Handoff `JSONDecodeError` is RESOLVED — the detail parser is regex/line-based (no `json.loads`).
  - `GET /api/repeater/search?freq=` → matches within ±0.0125 MHz; each item: id, state_id, call, freq, offsetDir, tone, location, modes, status, countryCode. (145.6875 → 53: DE39/AT8/CH6; 145.600 → 54.)
  - `GET /api/repeater/detail?state_id=&id=` → downlink, uplink, offset, bandwidth, sponsor, lat/lon, call, location, country. Bad params → HTTP 400.
- [x] **Search screen (`app/repeater/index.tsx`):** MHz input (`repeater-freq-input`) accepts BOTH comma and dot decimals; `repeater-search-button` → `repeater-results` list of tappable cards (`repeater-item-<id>`) with status dot (green on-air/red off-air/amber unknown), call, country badge, freq (comma), Ablage, location, mode + tone tags. Optional multi-select mode chips (`repeater-chip-fm/dmr/dstar/c4fm`) filter client-side (fm/dmr/d-star/fusion). Loading/error/empty states.
- [x] **Detail screen (`app/repeater/detail.tsx`):** instant list fields + augmented backend fetch. Cards: overview, FREQUENZDATEN (Downlink/Uplink/Offset/Ablage/Ton-CTCSS/Bandbreite/Betriebsart), STANDORT (location, coords, "In Karte öffnen" → Google Maps via `Linking`), BETREIBER (sponsor). Tone prefers richer list value.
- [x] **Attribution** "Daten: RepeaterBook.com" (links to repeaterbook.com) shown on results (`repeater-attribution`) and detail (`repeater-detail-attribution`).
- [x] Tested green iteration_8 (backend 6/6 pytest `backend/tests/test_repeater.py` + full frontend flow + regressions). Lint clean.

## Next Tasks
- **Repeater-Finder Phase 2 — "In meiner Nähe"** (P1): `expo-location` foreground permission → GPS coords, distance calc against cached DACH data (or scrape `radius_result.php`), 1–200 km radius slider, Band/Mode filters.
- **Q-Codes** module (P2, currently disabled placeholder tile).

## Update 2026-07 (Repeater-Finder REWORK — unified combinable filter screen; merges Phase 1 + Phase 2)
- [x] `/repeater` fully rewritten into ONE screen with combinable filters (no tabs). Tile subtitle → "DACH · Umkreis".
- [x] **Text search + live autocomplete:** `repeater-text-input` (debounced) → `GET /api/repeater/suggest?q=` (case-insensitive prefix on callsign OR location tokens; callsign-prefix ranked first). Dropdown `repeater-suggest` / `repeater-suggest-item-<id>`; tap → detail. ("Zug" → DB0ZU Zugspitze.)
- [x] **Dynamic band chips:** `GET /api/repeater/bands` returns ONLY bands actually present in the DACH cache with counts, freq-ascending (10m 19, 6m 5, 2m 310, 70cm 1479, 23cm 121, 13cm 2, 3cm 3). `repeater-band-<key>` multi-select. Bands derived server-side from `RB_BANDS` boundaries (`_band_for_freq`).
- [x] **Frequency filter:** `repeater-freq-input` MHz, comma+dot, ±0.0125 MHz — combinable with bands.
- [x] **Universal radius filter:** `repeater-radius-toggle`; GPS via `expo-location` (benefit pre-explanation + `repeater-gps-button`; denied → manual, blocked → `repeater-open-settings`) OR manual `repeater-location-input` + `repeater-geocode-button` (Nominatim proxy, server-side ≤1 req/s + descriptive UA). `repeater-radius-slider` 1–200 km default 30. Applies on top of any active freq/band filters.
- [x] **Unified search:** `GET /api/repeater/search?freq=&bands=csv&near=lat,lon&radius=` — intersection. No `near` → full DACH list sorted alphabetically by location + `repeater-count` "X Treffer" (no hard cutoff). With `near` → server-side haversine, sorted by distance, `distanceKm` badge, `pendingCoords`.
- [x] **Lazy coordinate cache:** coords fetched ONLY when a repeater appears in a real search result; persisted in MongoDB `repeater_coords` + mirrored in `_coords`. Bounded synchronous warm (cap 30) on radius queries + throttled background worker (~0.3 s) fills the rest; frontend shows a "X weitere Standorte werden geladen …" banner + `repeater-refresh-button` + auto-poll. Coverage grows with usage (per user's explicit choice — no preemptive bulk scrape).
- [x] Permissions added to `app.json` (iOS `NSLocationWhenInUseUsageDescription`, Android COARSE/FINE location, `expo-location` plugin). `expo-location@19.0.8` installed.
- [x] Tested green iteration_9 (backend 15/15 pytest + full frontend flow + regressions). Lint clean. NOTE: GPS button is native-only (browser geolocation blocked in web preview); manual location works everywhere.

## Next Tasks (updated)
- Optional cleanup: two web-only RN deprecation warnings (`shadow*`, `pointerEvents`); optional `server.py` split into routers as it now spans 3 domains (OpenAIP, RepeaterBook, geocode).

## Update 2026-07 (Q-Codes module — new offline reference)
- [x] Hub tile **Q-Codes** now ACTIVE (`/qcodes`, subtitle "Codes & Kürzel"), replaces the disabled placeholder.
- [x] New fully-offline module (no backend): `app/qcodes.tsx` + data `src/qcodes/data.ts` (64 entries — 30 Q-Codes + 73/88 + 32 Betriebsabkürzungen). Two categories in ONE searchable list, each card tagged with a type badge "Q-Code" / "Abkürzung".
- [x] Search `qcode-search-input` filters live & multi-match over code + Frage + Aussage + Praxis + Merkhilfe + a HIDDEN keyword field simultaneously (e.g. "standort" → QTH, "danke" → TNX). Filter chips `qcode-filter-all/qcode/abbr`; `qcode-count`. Sorted alphabetically.
- [x] Cards show Frage/Aussage (where both exist), Praxis-Hinweis + Merkhilfe where present, a green "Prüfung" badge for exam-relevant Q-codes, and an optional `qcode-exam-toggle` ("Nur prüfungsrelevante anzeigen").
- [x] Entry "99" rendered as a WARNING card (red border + alert icon + red text) per requirement.
- [x] Tested green iteration_10 (frontend 10/10 + regressions). Lint clean.

## Update 2026-07 (App-Metadaten + "Über die App")
- [x] `app.json` `expo.name` → **"Funk Toolbox"** (Homescreen-Label der installierten App). `slug` bewusst auf "frontend" belassen (an EAS `projectId` gebunden — Änderung bräche die Publish-/Build-Verknüpfung; das Label hängt an `name`, nicht am Slug).
- [x] `package.json` `author` → "Ingo Rummel (DJ1IR)". `eas.json` hat keinen Submit-Block; Store-Herausgebername kommt vom Entwickler-Account beim Publish.
- [x] Neuer Screen **`app/about.tsx`** ("Über die App"), erreichbar über Info-Icon oben rechts am Hub (`about-button`): App-Name, Version (auto via `expo-constants`, nicht hartkodiert), "Entwickelt von DJ1IR, Ingo Rummel", Platzhalter-Abschnitt "Kontakt – noch zu ergänzen". Verifiziert via Screenshot.

## Update 2026-07 (GLOBALER DESIGN-UMBAU — Design-Umschalter, Tablet-Layout, Dunkler Hintergrund) — getestet grün iteration_11
- [x] **Design-Umschalter** in Einstellungen (`app/about.tsx`, `design-option-minimal` / `design-option-darkbg`). Persistiert via `DesignProvider` (`src/theme/design.tsx`) in AsyncStorage (Key `funk_design_mode_v1`); RootLayout wartet auf `ready` bevor die UI rendert, damit der richtige Modus beim ersten Frame steht.
  - **Minimalistisch:** automatisches Hell-/Dunkel-Design nach Systemeinstellung (bisheriges Verhalten).
  - **Dunkler Hintergrund:** feste dunkle Platinen-Hintergrundbilder (1–8, je Modul), dunkle Palette erzwungen (weiße Schrift). Mapping in `src/theme/backgrounds.ts` (1 Hub+Einstellungen, 2 Rufzeichen, 3 Repeater, 4 Bandplan, 5 Q-Codes, 6 Morse, 7 Antenne, 8 CB/Flugfunk).
- [x] **`ScreenBg`-Wrapper** (`src/components/ScreenBg.tsx`) als Wurzel jeder Screen-Datei: rendert im darkbg-Modus das Modul-Bild (cover, memory-disk-Cache), im minimal-Modus eine schlichte Flächenfarbe → Layout unverändert. **Nicht entfernen/umgehen** beim Bearbeiten von Screens.
- [x] **`ScreenHeader`** ersetzt im darkbg-Modus die solide Leiste durch einen weichen dunklen Top-Gradient (Bilder sind oben am hellsten), Titel + Zurück-Pfeil in Weiß.
- [x] **Tablet-Responsivität** (`src/theme/layout.ts`): `MAX_CONTENT_WIDTH=600` (Text-/Formularbereiche via `centered`), `MAX_GRID_WIDTH=760` (Hub-Grid) — zentriert statt volle Breite auf breiten Screens.
- [x] **`overlayChip(darkbg)`**: halbtransparenter dunkler Chip hinter frei stehenden Hinweis-/Quellen-/Disclaimer-Texten für Lesbarkeit über den hellen Platinen-Symbolen.
- [x] Portrait-Lock. Über 15 Dateien umgebaut. **Regression grün (iteration_11):** alle 8 Routen in BEIDEN Modi geprüft — Morse fixe untere Eingabeleiste, Repeater Band-Chips (Mehrfachauswahl), Q-Codes/Rufzeichen Scroll-Verhalten alle intakt; keine kaputten ScrollViews/Inputs/Touch-Ziele.
- [x] **Standard-Modus = "darkbg"** (2026-07): Bei erstmaligem Start / ohne gespeicherte Wahl ist "Dunkler Hintergrund" die Vorgabe (`src/theme/design.tsx` Default + Context-Default). Manuelles Umschalten auf "Minimalistisch" bleibt möglich.
- [~] **Hintergrundbilder-Vorladen VERWORFEN** (2026-07): Der Versuch, alle 8 Bilder beim Start via `expo-asset` `Asset.loadAsync` zu laden und den Splash bis dahin zu blockieren (`bgReady`-Gate in `app/_layout.tsx`), führte auf NATIVEM Gerät (Expo Go) dazu, dass die Hintergründe gar nicht mehr rendern (schwarz) — vermutlich Interferenz zwischen expo-asset `localUri` und expo-image im Dev-Modus. Web war nicht betroffen. → Vollständig zurückgebaut; `_layout.tsx` gated wieder nur auf Icon-Fonts + Design-Wahl. Hintergründe laden wie zuvor lazy über `expo-image` (`cachePolicy="memory-disk"`). Original-Bilder (je ~2 MB) wiederhergestellt. Optimierung/Preload ggf. später über echten Build sauber testen.

## Offene / optionale Aufgaben
- Optional (nicht blockierend, web-only Konsolen-Warnungen): `shadow*` → `boxShadow` in `app/repeater/index.tsx` (suggestBox); `pointerEvents`-Prop → `style.pointerEvents` in `ScreenBg`/`ScreenHeader`/`app/index.tsx`.
- Optional: `server.py` (>600 Zeilen, 3 Domains) in Router aufteilen.
