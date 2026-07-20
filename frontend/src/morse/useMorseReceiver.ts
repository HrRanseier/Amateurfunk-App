import { useCallback, useEffect, useRef, useState } from "react";

import { MorseDecoder } from "./decoder";
import { bandTonePeak } from "./goertzel";
import { unitMsFromWpm } from "./morse";
import { micAvailable, requestMicPermission, startMic, stopMic } from "./nativeAudio";

export type ReceiverStatus = "idle" | "calibrating" | "listening" | "denied" | "unavailable" | "error";

// Tone band the decoder listens on. A single narrow Goertzel bin (~±12 Hz)
// almost never matches a real received signal, so we scan this whole band and
// take the strongest bin — the operator does not have to tune the exact pitch.
const RX_LO_HZ = 250;
const RX_HI_HZ = 1500;

// Microphone -> band tone detector -> adaptive decoder pipeline. Only active on
// a real build (see nativeAudio.micAvailable). Handles a ~1s noise calibration,
// an on/off envelope with hysteresis, and streams decoded text into `transcript`.
export function useMorseReceiver(seedWpm: number) {
  const [status, setStatus] = useState<ReceiverStatus>(micAvailable ? "idle" : "unavailable");
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const seedRef = useRef(seedWpm);
  useEffect(() => { seedRef.current = seedWpm; }, [seedWpm]);

  const decoderRef = useRef<MorseDecoder | null>(null);
  const subRef = useRef<{ remove: () => void } | null>(null);

  const calibratingRef = useRef(false);
  const calibStartRef = useRef(0);
  const calibValsRef = useRef<number[]>([]);
  const noiseRef = useRef(0.01);
  const toneRef = useRef(false);
  const accumRef = useRef(0);
  const lastLevelTs = useRef(0);

  const onFrame = useCallback((samples: Float32Array, sr: number) => {
    const mag = bandTonePeak(samples, sr, RX_LO_HZ, RX_HI_HZ).mag;
    const frameMs = (samples.length / sr) * 1000;
    const now = Date.now();

    if (calibratingRef.current) {
      calibValsRef.current.push(mag);
      if (now - lastLevelTs.current > 60) {
        lastLevelTs.current = now;
        setLevel(Math.min(1, mag / 0.2));
      }
      if (now - calibStartRef.current >= 1000) {
        const vals = calibValsRef.current;
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.01;
        noiseRef.current = Math.max(avg, 0.002);
        calibratingRef.current = false;
        toneRef.current = false;
        accumRef.current = 0;
        setStatus("listening");
      }
      return;
    }

    const onTh = Math.max(noiseRef.current * 6, 0.02);
    const offTh = Math.max(noiseRef.current * 3, 0.01);

    if (now - lastLevelTs.current > 60) {
      lastLevelTs.current = now;
      setLevel(Math.min(1, mag / (onTh * 1.5)));
    }

    const prev = toneRef.current;
    let cur = prev;
    if (!prev && mag >= onTh) cur = true;
    else if (prev && mag <= offTh) cur = false;

    if (cur !== prev) {
      if (prev) decoderRef.current?.pushTone(accumRef.current);
      else decoderRef.current?.pushGap(accumRef.current);
      accumRef.current = frameMs;
      toneRef.current = cur;
    } else {
      accumRef.current += frameMs;
      // A long silence flushes the last letter/word without needing more sound.
      if (!cur && accumRef.current > unitMsFromWpm(seedRef.current) * 12) {
        decoderRef.current?.pushGap(accumRef.current);
        accumRef.current = 0;
      }
    }
  }, []);

  const stop = useCallback(async () => {
    await stopMic(subRef.current);
    subRef.current = null;
    decoderRef.current?.finish();
    calibratingRef.current = false;
    setLevel(0);
    setStatus(micAvailable ? "idle" : "unavailable");
  }, []);

  const start = useCallback(async () => {
    if (!micAvailable) {
      setStatus("unavailable");
      return;
    }
    const granted = await requestMicPermission();
    if (!granted) {
      setStatus("denied");
      return;
    }
    setError("");
    decoderRef.current = new MorseDecoder({ initialUnitMs: unitMsFromWpm(seedRef.current) }, setTranscript);
    calibValsRef.current = [];
    calibStartRef.current = Date.now();
    calibratingRef.current = true;
    toneRef.current = false;
    accumRef.current = 0;
    setStatus("calibrating");
    const sub = await startMic(onFrame, (msg) => {
      setError(msg);
      setStatus("error");
      calibratingRef.current = false;
      setLevel(0);
      stopMic(subRef.current);
      subRef.current = null;
    });
    if (!sub) {
      setStatus((s) => (s === "error" ? s : "unavailable"));
      calibratingRef.current = false;
      return;
    }
    subRef.current = sub;
  }, [onFrame]);

  const toggle = useCallback(() => {
    if (status === "listening" || status === "calibrating") stop();
    else start();
  }, [status, start, stop]);

  const clear = useCallback(() => {
    decoderRef.current?.reset();
    setTranscript("");
  }, []);

  useEffect(() => () => { stopMic(subRef.current); }, []);

  return {
    status,
    listening: status === "listening" || status === "calibrating",
    calibrating: status === "calibrating",
    level,
    transcript,
    toggle,
    clear,
    error,
  };
}
