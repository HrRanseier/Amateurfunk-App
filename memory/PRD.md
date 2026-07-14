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
- [x] Morse encode: live conversion, sine tone (WebView), flashlight (expo-camera), vibration; freq + WPM sliders; history chips (persisted).
- [x] Morse decode: Punkt/Strich tap buttons, alt morse text input, Leerzeichen/Wort/Löschen/Reset, live decode.
- [x] Reactive Light/Dark theme, custom Toast, keyboard handling, camera permission flow, back-button canGoBack fallback.
- [x] Frontend tested (22/23, both fixes applied).

## Backlog
- P1: Rufzeichen (callsign lookup/prefix), Bandplan (frequency band chart), Q-Codes (searchable list) modules.
- P2: Adjustable dot/dash weighting, save named favorites, share morse output, on-the-fly morse "keyer" straight-key mode in decode.

## Notes / Limitations
- Ton/Licht/Vibration are HARDWARE features: fully testable only on a real Android build (Expo Go: tone+vibration work; flashlight requires a real device/build). Web preview cannot validate audio/torch/vibration.

## Next Tasks
- Await user feedback; likely next module implementation (Rufzeichen or Q-Codes).
