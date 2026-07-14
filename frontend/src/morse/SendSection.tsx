import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useToast } from "@/src/components/Toast";
import { MorseAudio, MorseAudioHandle } from "@/src/morse/MorseAudio";
import { SendOutputs, useMorseSender } from "@/src/morse/useMorseSender";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Props = {
  freq: number;
  wpm: number;
  setFreq: (n: number) => void;
  setWpm: (n: number) => void;
};

export function SendSection({ freq, wpm, setFreq, setWpm }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const [outputs, setOutputs] = useState<SendOutputs>({ tone: true, light: false, vibe: false });
  const [torchOn, setTorchOn] = useState(false);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const audioRef = useRef<MorseAudioHandle | null>(null);

  const sender = useMorseSender({
    freq,
    wpm,
    outputs,
    audioRef,
    setTorch: setTorchOn,
    camGranted: !!camPerm?.granted,
  });

  const toggleOutput = async (key: keyof SendOutputs) => {
    Haptics.selectionAsync();
    if (key === "light" && !outputs.light && !camPerm?.granted) {
      const res = await requestCamPerm();
      if (!res.granted) {
        toast("Kamerazugriff für Licht nötig");
        return;
      }
    }
    setOutputs((p) => ({ ...p, [key]: !p[key] }));
  };

  const outBtn = (key: keyof SendOutputs, icon: string, label: string, testID: string) => {
    const active = outputs[key];
    return (
      <Pressable
        testID={testID}
        onPress={() => toggleOutput(key)}
        style={[
          styles.outBtn,
          {
            backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
            borderColor: active ? colors.brandPrimary : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as never}
          size={22}
          color={active ? colors.onBrandPrimary : colors.brand}
        />
        <Text style={[styles.outLabel, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.section}>
      <MorseAudio ref={audioRef} />
      {camPerm?.granted && <CameraView style={styles.hiddenCam} facing="back" enableTorch={torchOn} />}

      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Senden</Text>
      <Text style={[styles.hint, { color: colors.onSurfaceMuted }]}>
        Zeichen werden beim Tippen sofort gesendet
      </Text>

      <TextInput
        testID="send-text-input"
        multiline
        value={sender.fullText}
        onChangeText={sender.onChangeText}
        placeholder="Text tippen ..."
        placeholderTextColor={colors.onSurfaceMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        style={[
          styles.input,
          { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.onSurface },
        ]}
      />

      <View style={[styles.previewCard, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
        <Text testID="send-preview" style={[styles.previewText, { fontFamily: monoFont }]}>
          {sender.fullText.length === 0 ? (
            <Text style={{ color: colors.onSurfaceMuted }}>Übertragung erscheint hier</Text>
          ) : (
            <>
              <Text style={{ color: colors.onSurfaceMuted }}>{sender.sentText}</Text>
              {sender.onAir != null && (
                <Text style={{ color: colors.brand, fontWeight: "800", textDecorationLine: "underline" }}>
                  {sender.onAir}
                </Text>
              )}
              <Text style={{ color: colors.onSurfaceMuted, opacity: 0.5 }}>{sender.pending}</Text>
            </>
          )}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: sender.onAir ? colors.brandTertiary : colors.surfaceTertiary },
          ]}
        >
          <MaterialCommunityIcons
            name="radio-tower"
            size={14}
            color={sender.onAir ? colors.brand : colors.onSurfaceMuted}
          />
          <Text style={[styles.badgeText, { color: sender.onAir ? colors.brand : colors.onSurfaceMuted }]}>
            {sender.onAir ? "Auf Sendung" : "Bereit"}
          </Text>
        </View>
        <Text testID="queue-count" style={[styles.queueText, { color: colors.onSurfaceMuted }]}>
          {sender.queueCount} in Warteschlange
        </Text>
        <Pressable testID="send-clear-button" onPress={sender.clear} hitSlop={8}>
          <Text style={[styles.clearText, { color: colors.brand }]}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.outRow}>
        {outBtn("tone", "sine-wave", "Ton", "output-toggle-tone")}
        {outBtn("light", "flashlight", "Licht", "output-toggle-light")}
        {outBtn("vibe", "vibrate", "Vibration", "output-toggle-vibrate")}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  hiddenCam: { width: 1, height: 1, position: "absolute", opacity: 0, top: -10, left: -10 },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: "800" },
  hint: { fontSize: fontSize.sm },
  input: {
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: fontSize.lg,
    textAlignVertical: "top",
    marginTop: spacing.xs,
  },
  previewCard: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: "center",
  },
  previewText: { fontSize: fontSize.lg, letterSpacing: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: fontSize.sm, fontWeight: "700" },
  queueText: { fontSize: fontSize.sm, fontWeight: "600" },
  clearText: { fontSize: fontSize.sm, fontWeight: "700" },
  outRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  outBtn: {
    flex: 1,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  outLabel: { fontSize: fontSize.sm, fontWeight: "700" },
  sliderCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.lg, marginTop: spacing.md },
  sliderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sliderLabel: { fontSize: fontSize.base, fontWeight: "600" },
  sliderValue: { fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },
});
