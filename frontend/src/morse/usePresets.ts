import { useCallback, useEffect, useState } from "react";

import { storage } from "@/src/utils/storage";
import { RepeatMode } from "./useMorseSender";

export type Preset = { text: string; repeat: RepeatMode };

const KEY = "funk_morse_presets_v1";
export const PRESET_COUNT = 5;
const EMPTY: Preset = { text: "", repeat: 1 };

const isRepeat = (r: unknown): r is RepeatMode => r === 1 || r === 2 || r === 3 || r === "inf";

function normalize(parsed: unknown): Preset[] {
  const arr = Array.isArray(parsed) ? (parsed as Partial<Preset>[]) : [];
  return Array.from({ length: PRESET_COUNT }, (_, i) => {
    const p = arr[i];
    if (p && typeof p.text === "string" && isRepeat(p.repeat)) return { text: p.text, repeat: p.repeat };
    return { ...EMPTY };
  });
}

// Five text-block presets (text + per-preset repeat setting), persisted locally
// so they survive an app restart. Stored as a single JSON string under one key.
export function usePresets() {
  const [presets, setPresets] = useState<Preset[]>(() =>
    Array.from({ length: PRESET_COUNT }, () => ({ ...EMPTY })),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(KEY, "");
      if (raw) {
        try {
          setPresets(normalize(JSON.parse(raw)));
        } catch {
          /* keep defaults */
        }
      }
      setReady(true);
    })();
  }, []);

  const persist = useCallback((next: Preset[]) => {
    setPresets(next);
    storage.setItem(KEY, JSON.stringify(next));
  }, []);

  const setText = useCallback(
    (i: number, text: string) => persist(presets.map((p, idx) => (idx === i ? { ...p, text } : p))),
    [persist, presets],
  );

  const setRepeat = useCallback(
    (i: number, repeat: RepeatMode) =>
      persist(presets.map((p, idx) => (idx === i ? { ...p, repeat } : p))),
    [persist, presets],
  );

  return { presets, ready, setText, setRepeat };
}
