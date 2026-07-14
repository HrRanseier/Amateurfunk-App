import Constants from "expo-constants";
import { PermissionsAndroid, Platform } from "react-native";

// Thin wrapper around the native `expo-stream-audio` module. The real-time PCM
// stream is a NATIVE feature: it works only in a published / dev build, NOT in
// Expo Go or the web preview. We therefore load the module defensively and
// expose `micAvailable` so the UI can show a clear notice in the preview.

export type MicFrameCb = (samples: Float32Array, sampleRate: number, level: number) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mod: any = null;
if (Platform.OS !== "web") {
  try {
    // In Expo Go the native module fails to load here and we fall back gracefully.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("expo-stream-audio");
  } catch {
    mod = null;
  }
}

export const micAvailable =
  Platform.OS !== "web" &&
  Constants.executionEnvironment !== "storeClient" && // not Expo Go
  !!mod &&
  typeof mod.start === "function";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const out = new Uint8Array((len * 3) >> 2);
  let o = 0;
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < len; i++) {
    buf = (buf << 6) | B64.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buf >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}

function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const n = bytes.length >> 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
    if (v >= 0x8000) v -= 0x10000;
    out[i] = v / 32768;
  }
  return out;
}

export async function requestMicPermission(): Promise<boolean> {
  if (!micAvailable || !mod) return false;
  try {
    if (Platform.OS === "android") {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    const status = await mod.requestPermission();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function startMic(cb: MicFrameCb): Promise<{ remove: () => void } | null> {
  if (!micAvailable || !mod) return null;
  try {
    const sub = mod.addFrameListener((e: { pcmBase64: string; sampleRate?: number; level?: number }) => {
      const bytes = base64ToBytes(e.pcmBase64);
      cb(pcm16ToFloat32(bytes), e.sampleRate ?? 16000, e.level ?? 0);
    });
    await mod.start({ sampleRate: 16000, frameDurationMs: 40, channels: 1, enableLevelMeter: true });
    return sub;
  } catch {
    return null;
  }
}

export async function stopMic(sub: { remove: () => void } | null): Promise<void> {
  try {
    await mod?.stop();
  } catch {
    /* ignore */
  }
  try {
    sub?.remove();
  } catch {
    /* ignore */
  }
}
