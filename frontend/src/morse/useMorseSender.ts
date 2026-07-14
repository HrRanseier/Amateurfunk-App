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

// Live, character-by-character transmission engine. Each newly typed character
// is immediately converted to Morse and queued; the queue is drained one
// character at a time over the selected outputs (tone / light / vibration).
export function useMorseSender({ freq, wpm, outputs, audioRef, setTorch, camGranted }: Params) {
  const [text, setText] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const [onAirIndex, setOnAirIndex] = useState<number | null>(null);

  const textRef = useRef("");
  const sentRef = useRef(0);
  const txRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const freqRef = useRef(freq);
  const wpmRef = useRef(wpm);
  const outRef = useRef(outputs);
  const camRef = useRef(camGranted);
  useEffect(() => { freqRef.current = freq; }, [freq]);
  useEffect(() => { wpmRef.current = wpm; }, [wpm]);
  useEffect(() => { outRef.current = outputs; }, [outputs]);
  useEffect(() => { camRef.current = camGranted; }, [camGranted]);

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
    const start = sentRef.current;
    if (start >= textRef.current.length) return;
    txRef.current = true;
    setOnAirIndex(start);
    const ch = textRef.current[start];
    const { segments, durationMs } = charTimeline(ch, unitMsFromWpm(wpmRef.current));
    transmit(segments);
    const t = setTimeout(() => {
      sentRef.current = Math.min(start + 1, textRef.current.length);
      setSentCount(sentRef.current);
      setOnAirIndex(null);
      txRef.current = false;
      pump();
    }, Math.max(durationMs, 1));
    timers.current.push(t);
  }, [transmit]);

  const onChangeText = useCallback(
    (next: string) => {
      // Already-sent characters cannot be un-sent; clamp the pointer if the
      // user deletes into the sent region.
      if (next.length < sentRef.current) {
        sentRef.current = next.length;
        setSentCount(next.length);
      }
      textRef.current = next;
      setText(next);
      pump();
    },
    [pump],
  );

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    audioRef.current?.stop();
    Vibration.cancel();
    setTorch(false);
    txRef.current = false;
    sentRef.current = 0;
    textRef.current = "";
    setText("");
    setSentCount(0);
    setOnAirIndex(null);
  }, [audioRef, setTorch]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      audioRef.current?.stop();
      Vibration.cancel();
    },
    [audioRef],
  );

  const nextIdx = onAirIndex ?? sentCount;
  const sentText = text.slice(0, nextIdx);
  const onAir = onAirIndex != null ? text[onAirIndex] ?? null : null;
  const pending = text.slice(onAirIndex != null ? onAirIndex + 1 : sentCount);
  const queueCount = Math.max(0, text.length - (onAirIndex != null ? onAirIndex + 1 : sentCount));

  return { fullText: text, sentText, onAir, pending, onChangeText, queueCount, clear };
}
