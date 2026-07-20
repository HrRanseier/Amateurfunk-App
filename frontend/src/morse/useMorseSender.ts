import { useCallback, useEffect, useRef, useState } from "react";
import { Vibration } from "react-native";

import { MorseAudioHandle } from "./MorseAudio";
import { charTimeline, MorseSegment, unitMsFromWpm, vibrationPattern } from "./morse";

export type SendOutputs = { tone: boolean; light: boolean; vibe: boolean };

type Params = {
  freq: number;
  wpm: number;
  outputs: SendOutputs;
  audioRef: React.RefObject<MorseAudioHandle | null>;
  setTorch: (on: boolean) => void;
  camGranted: boolean;
};

export type RepeatMode = 1 | 2 | 3 | "inf";

// Single, unified transmission engine. Both the live text input AND the preset
// text blocks feed the SAME character queue, drained one character at a time by
// pump() over the selected outputs (tone / light / vibration). There is only
// one timing model (charTimeline) — no separate send logic per source.
export function useMorseSender({ freq, wpm, outputs, audioRef, setTorch, camGranted }: Params) {
  // Live input value (bound to the TextInput).
  const [text, setText] = useState("");
  const textRef = useRef("");

  // Unified send queue: characters not yet fully sent. While transmitting,
  // index 0 is the on-air character. Presets + live typing both append here.
  const queueRef = useRef("");
  const [pending, setPending] = useState(""); // chars still waiting (excludes on-air)
  const [onAir, setOnAir] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const txRef = useRef(false);
  const infiniteRef = useRef<string | null>(null); // text to repeat until stopped
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const freqRef = useRef(freq);
  const wpmRef = useRef(wpm);
  const outRef = useRef(outputs);
  const camRef = useRef(camGranted);
  useEffect(() => { freqRef.current = freq; }, [freq]);
  useEffect(() => { wpmRef.current = wpm; }, [wpm]);
  useEffect(() => { outRef.current = outputs; }, [outputs]);
  useEffect(() => { camRef.current = camGranted; }, [camGranted]);

  const syncPending = useCallback(() => {
    const q = queueRef.current;
    setPending(txRef.current ? q.slice(1) : q);
  }, []);

  const transmit = useCallback(
    (segments: MorseSegment[]) => {
      if (segments.length === 0) return;
      if (outRef.current.tone) audioRef.current?.play(freqRef.current, segments);
      if (outRef.current.vibe) Vibration.vibrate(vibrationPattern(segments), false);
      if (outRef.current.light && camRef.current) {
        let elapsed = 0;
        segments.forEach((seg) => {
          if (seg.on) {
            timers.current.push(setTimeout(() => setTorch(true), elapsed));
            timers.current.push(setTimeout(() => setTorch(false), elapsed + seg.ms));
          }
          elapsed += seg.ms;
        });
      }
    },
    [audioRef, setTorch],
  );

  const pump = useCallback(() => {
    if (txRef.current) return;
    if (queueRef.current.length === 0) {
      // Queue drained. Repeat forever if an infinite block is active, using a
      // single word-gap (leading space) as the pause between repeats.
      if (infiniteRef.current != null) {
        queueRef.current = " " + infiniteRef.current;
      } else {
        setSending(false);
        setOnAir(null);
        setPending("");
        return;
      }
    }
    txRef.current = true;
    setSending(true);
    const ch = queueRef.current[0];
    setOnAir(ch);
    setPending(queueRef.current.slice(1));
    const { segments, durationMs } = charTimeline(ch, unitMsFromWpm(wpmRef.current));
    transmit(segments);
    const t = setTimeout(() => {
      queueRef.current = queueRef.current.slice(1);
      txRef.current = false;
      setOnAir(null);
      syncPending();
      pump();
    }, Math.max(durationMs, 1));
    timers.current.push(t);
  }, [transmit, syncPending]);

  // Live typing → same queue. Diff prev vs next: enqueue newly added characters,
  // and drop not-yet-sent characters the user deleted (keeps the on-air char).
  const onChangeText = useCallback(
    (next: string) => {
      const prev = textRef.current;
      let c = 0;
      while (c < prev.length && c < next.length && prev[c] === next[c]) c++;
      const removed = prev.length - c;
      const added = next.slice(c);
      if (removed > 0 && queueRef.current.length > 0) {
        const minKeep = txRef.current ? 1 : 0;
        const newLen = Math.max(minKeep, queueRef.current.length - removed);
        queueRef.current = queueRef.current.slice(0, newLen);
      }
      if (added) queueRef.current += added;
      textRef.current = next;
      setText(next);
      syncPending();
      pump();
    },
    [pump, syncPending],
  );

  // Preset block → same queue. Finite repeat appends N copies (word-gap between
  // them); "inf" keeps repeating until stop() is called.
  const enqueue = useCallback(
    (raw: string, repeat: RepeatMode) => {
      const s = raw.trim();
      if (!s) return;
      const sep = queueRef.current.length > 0 ? " " : "";
      if (repeat === "inf") {
        infiniteRef.current = s;
        queueRef.current += sep + s;
      } else {
        const copies = Array.from({ length: repeat }, () => s).join(" ");
        queueRef.current += sep + copies;
      }
      syncPending();
      pump();
    },
    [pump, syncPending],
  );

  // Immediate stop: abort the running character NOW (no waiting for it to end),
  // wipe the entire remaining queue (incl. infinite repeat), reset to idle.
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    audioRef.current?.stop();
    Vibration.cancel();
    setTorch(false);
    txRef.current = false;
    infiniteRef.current = null;
    queueRef.current = "";
    textRef.current = "";
    setText("");
    setPending("");
    setOnAir(null);
    setSending(false);
  }, [audioRef, setTorch]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      audioRef.current?.stop();
      Vibration.cancel();
    },
    [audioRef],
  );

  const queueCount = pending.length;

  return { fullText: text, onAir, pending, sending, onChangeText, enqueue, queueCount, clear };
}
