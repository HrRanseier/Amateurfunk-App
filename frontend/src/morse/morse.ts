// International Morse (ITU) encoding/decoding + playback timeline helpers.

export const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
  '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};

const REVERSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [char, code]) => {
    acc[code] = char;
    return acc;
  },
  {} as Record<string, string>,
);

// Klartext -> Morse. Letters separated by a space, words by " / ".
export function textToMorse(text: string): string {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  return words
    .map((word) =>
      word
        .split("")
        .map((ch) => MORSE_MAP[ch] ?? "")
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .join(" / ");
}

// Morse -> Klartext. Unknown codes are dropped.
export function morseToText(morse: string): string {
  if (!morse.trim()) return "";
  return morse
    .split("/")
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => REVERSE_MAP[code] ?? "")
        .join(""),
    )
    .join(" ")
    .trim();
}

export type MorseSegment = { on: boolean; ms: number };

// Standard timing: unit (ms) = 1200 / WPM (PARIS standard).
export function unitMsFromWpm(wpm: number): number {
  return 1200 / wpm;
}

// Build an alternating on/off timeline for tone / light / vibration output.
// Dot = 1 unit, Dash = 3 units, intra-char gap = 1, inter-char gap = 3, word gap = 7.
export function buildTimeline(morse: string, unitMs: number): MorseSegment[] {
  const segs: MorseSegment[] = [];
  const words = morse
    .split("/")
    .map((w) => w.trim())
    .filter(Boolean);

  words.forEach((word, wi) => {
    const letters = word.split(/\s+/).filter(Boolean);
    letters.forEach((letter, li) => {
      const symbols = letter.split("").filter((s) => s === "." || s === "-");
      symbols.forEach((sym, si) => {
        segs.push({ on: true, ms: Math.round(sym === "." ? unitMs : unitMs * 3) });
        if (si < symbols.length - 1) segs.push({ on: false, ms: Math.round(unitMs) });
      });
      if (li < letters.length - 1) segs.push({ on: false, ms: Math.round(unitMs * 3) });
    });
    if (wi < words.length - 1) segs.push({ on: false, ms: Math.round(unitMs * 7) });
  });

  return segs;
}

// Android vibration pattern: [initialWait, vibrate, wait, vibrate, ...].
// Timeline is always on,off,on,...,on so we prepend a 0 wait.
export function vibrationPattern(segs: MorseSegment[]): number[] {
  return [0, ...segs.map((s) => s.ms)];
}

export function totalDurationMs(segs: MorseSegment[]): number {
  return segs.reduce((sum, s) => sum + s.ms, 0);
}
