import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, Vibration, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useToast } from "@/src/components/Toast";
import { MorseAudio, MorseAudioHandle } from "@/src/morse/MorseAudio";
import {
  buildTimeline,
  MorseSegment,
  textToMorse,
  totalDurationMs,
  unitMsFromWpm,
  vibrationPattern,
} from "@/src/morse/morse";
import { useHistory } from "@/src/morse/useHistory";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Mode = null | "tone" | "flash" | "vibe";

export function EncodeTab() {
  const { colors } = useTheme();
  const toast = useToast();
  const history = useHistory();

  const [text, setText] = useState("");
  const [freq, setFreq] = useState(700);
  const [wpm, setWpm] = useState(20);
  const [mode, setMode] = useState<Mode>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [permBlocked, setPermBlocked] = useState(false);

  const audioRef = useRef<MorseAudioHandle>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [camPerm, requestCamPerm] = useCameraPermissions();

  const morse = useMemo(() => textToMorse(text), [text]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const stopAll = useCallback(() => {
    audioRef.current?.stop();
    Vibration.cancel();
    clearTimers();
    setTorchOn(false);
    setMode(null);
  }, [clearTimers]);

  useEffect(() => () => stopAll(), [stopAll]);

  const playTone = useCallback(() => {
    if (mode === "tone") {
      stopAll();
      return;
    }
    stopAll();
    if (!morse) {
      toast("Bitte Text eingeben");
      return;
    }
    const timeline = buildTimeline(morse, unitMsFromWpm(wpm));
    audioRef.current?.play(freq, timeline);
    history.add(text);
    setMode("tone");
  }, [mode, morse, wpm, freq, text, history, stopAll, toast]);

  const playVibe = useCallback(() => {
    if (mode === "vibe") {
      stopAll();
      return;
    }
    stopAll();
    if (!morse) {
      toast("Bitte Text eingeben");
      return;
    }
    const timeline = buildTimeline(morse, unitMsFromWpm(wpm));
    Vibration.vibrate(vibrationPattern(timeline), false);
    history.add(text);
    setMode("vibe");
    const t = setTimeout(
      () => setMode((m) => (m === "vibe" ? null : m)),
      totalDurationMs(timeline) + 150,
    );
    timers.current.push(t);
  }, [mode, morse, wpm, text, history, stopAll, toast]);

  const startFlash = useCallback(
    (timeline: MorseSegment[]) => {
      setMode("flash");
      history.add(text);
      let elapsed = 0;
      timeline.forEach((seg) => {
        if (seg.on) {
          const on = setTimeout(() => setTorchOn(true), elapsed);
          const off = setTimeout(() => setTorchOn(false), elapsed + seg.ms);
          timers.current.push(on, off);
        }
        elapsed += seg.ms;
      });
      const end = setTimeout(() => {
        setTorchOn(false);
        setMode((m) => (m === "flash" ? null : m));
      }, elapsed + 150);
      timers.current.push(end);
    },
    [text, history],
  );

  const playFlash = useCallback(async () => {
    if (mode === "flash") {
      stopAll();
      return;
    }
    stopAll();
    if (!morse) {
      toast("Bitte Text eingeben");
      return;
    }
    if (!camPerm?.granted) {
      const res = await requestCamPerm();
      if (!res.granted) {
        if (!res.canAskAgain) setPermBlocked(true);
        toast("Kamerazugriff für Taschenlampe nötig");
        return;
      }
    }
    setPermBlocked(false);
    startFlash(buildTimeline(morse, unitMsFromWpm(wpm)));
  }, [mode, morse, wpm, camPerm, requestCamPerm, startFlash, stopAll, toast]);

  const onAudioEnded = useCallback(() => setMode((m) => (m === "tone" ? null : m)), []);

  const renderPlay = (testID: string, icon: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        styles.playBtn,
        {
          backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
          borderColor: active ? colors.brandPrimary : colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={(active ? "stop" : icon) as never}
        size={26}
        color={active ? colors.onBrandPrimary : colors.brand}
      />
      <Text style={[styles.playLabel, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>
        {active ? "Stopp" : label}
      </Text>
    </Pressable>
  );

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bottomOffset={spacing.xl}
    >
      <MorseAudio ref={audioRef} onEnded={onAudioEnded} />
      {camPerm?.granted && (
        <CameraView style={styles.hiddenCam} facing="back" enableTorch={torchOn} />
      )}

      <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>KLARTEXT</Text>
      <TextInput
        testID="encode-text-input"
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Text eingeben ..."
        placeholderTextColor={colors.onSurfaceMuted}
        style={[
          styles.input,
          { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.onSurface },
        ]}
      />

      <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>MORSECODE</Text>
      <View style={[styles.outputCard, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
        <Text
          testID="morse-output"
          selectable
          style={[styles.morseText, { color: colors.brand, fontFamily: monoFont }]}
        >
          {morse || "\u2014"}
        </Text>
      </View>

      <View style={styles.playRow}>
        {renderPlay("play-tone-button", "sine-wave", "Ton", mode === "tone", playTone)}
        {renderPlay("play-flash-button", "flashlight", "Licht", mode === "flash", playFlash)}
        {renderPlay("play-vibrate-button", "vibrate", "Vibration", mode === "vibe", playVibe)}
      </View>

      {permBlocked && (
        <View style={[styles.warnCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.warning }]}>
          <Text style={[styles.warnText, { color: colors.onSurface }]}>
            Kamerazugriff ist blockiert. Bitte in den Einstellungen aktivieren.
          </Text>
          <Pressable
            testID="open-settings-button"
            onPress={() => Linking.openSettings()}
            style={[styles.settingsBtn, { backgroundColor: colors.brandPrimary }]}
          >
            <Text style={[styles.settingsBtnText, { color: colors.onBrandPrimary }]}>
              Einstellungen öffnen
            </Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.sliderCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={styles.sliderRow}>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>Frequenz</Text>
          <Text testID="freq-value" style={[styles.sliderValue, { color: colors.brand }]}>
            {freq} Hz
          </Text>
        </View>
        <Slider
          testID="freq-slider"
          minimumValue={400}
          maximumValue={1000}
          step={10}
          value={freq}
          onValueChange={setFreq}
          onSlidingStart={() => Haptics.selectionAsync()}
          minimumTrackTintColor={colors.brandPrimary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.brandPrimary}
        />

        <View style={[styles.sliderRow, { marginTop: spacing.md }]}>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>Geschwindigkeit</Text>
          <Text testID="wpm-value" style={[styles.sliderValue, { color: colors.brand }]}>
            {wpm} WPM
          </Text>
        </View>
        <Slider
          testID="wpm-slider"
          minimumValue={5}
          maximumValue={40}
          step={1}
          value={wpm}
          onValueChange={setWpm}
          onSlidingStart={() => Haptics.selectionAsync()}
          minimumTrackTintColor={colors.brandPrimary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.brandPrimary}
        />
      </View>

      {history.items.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>VERLAUF</Text>
            <Pressable testID="clear-history-button" onPress={history.clear} hitSlop={8}>
              <Text style={[styles.clearText, { color: colors.brand }]}>Leeren</Text>
            </Pressable>
          </View>
          <KeyboardAwareScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {history.items.map((item, idx) => (
              <Pressable
                key={`${item}-${idx}`}
                testID={`history-chip-${idx}`}
                onPress={() => setText(item)}
                style={[styles.chip, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
              >
                <Text numberOfLines={1} style={[styles.chipText, { color: colors.onSurface }]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </KeyboardAwareScrollView>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  hiddenCam: { width: 1, height: 1, position: "absolute", opacity: 0, top: -10, left: -10 },
  label: { fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1, marginTop: spacing.sm },
  input: {
    minHeight: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: fontSize.lg,
    textAlignVertical: "top",
  },
  outputCard: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: "center",
  },
  morseText: { fontSize: fontSize.xl, lineHeight: 30, letterSpacing: 1 },
  playRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  playBtn: {
    flex: 1,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  playLabel: { fontSize: fontSize.sm, fontWeight: "700" },
  warnCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  warnText: { fontSize: fontSize.base, lineHeight: 20 },
  settingsBtn: { borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: "center" },
  settingsBtnText: { fontSize: fontSize.base, fontWeight: "700" },
  sliderCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.lg, marginTop: spacing.md },
  sliderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sliderLabel: { fontSize: fontSize.base, fontWeight: "600" },
  sliderValue: { fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },
  historySection: { marginTop: spacing.md },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clearText: { fontSize: fontSize.sm, fontWeight: "700" },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.lg },
  chip: {
    flexShrink: 0,
    maxWidth: 180,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { fontSize: fontSize.base, fontWeight: "600" },
});
