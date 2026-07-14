import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SendOutputs } from "@/src/morse/useMorseSender";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Props = {
  visible: boolean;
  onClose: () => void;
  freq: number;
  wpm: number;
  setFreq: (n: number) => void;
  setWpm: (n: number) => void;
  outputs: SendOutputs;
  onToggleOutput: (key: keyof SendOutputs) => void;
};

// Settings bottom-sheet (frequency, speed, output selection) — no longer
// permanently on the main screen.
export function SettingsSheet({
  visible,
  onClose,
  freq,
  wpm,
  setFreq,
  setWpm,
  outputs,
  onToggleOutput,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const outBtn = (key: keyof SendOutputs, icon: string, label: string, testID: string) => {
    const active = outputs[key];
    return (
      <Pressable
        testID={testID}
        onPress={() => onToggleOutput(key)}
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable testID="settings-backdrop" style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Einstellungen</Text>
          <Pressable testID="settings-close-button" onPress={onClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
          </Pressable>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Frequenz</Text>
          <Text testID="freq-value" style={[styles.value, { color: colors.brand }]}>{freq} Hz</Text>
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

        <View style={[styles.row, { marginTop: spacing.md }]}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Geschwindigkeit</Text>
          <Text testID="wpm-value" style={[styles.value, { color: colors.brand }]}>{wpm} WPM</Text>
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

        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>AUSGABEARTEN</Text>
        <View style={styles.outRow}>
          {outBtn("tone", "sine-wave", "Ton", "output-toggle-tone")}
          {outBtn("light", "flashlight", "Licht", "output-toggle-light")}
          {outBtn("vibe", "vibrate", "Vibration", "output-toggle-vibrate")}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: radius.pill, marginBottom: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: "800" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  label: { fontSize: fontSize.base, fontWeight: "600" },
  value: { fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1, marginTop: spacing.lg, marginBottom: spacing.sm },
  outRow: { flexDirection: "row", gap: spacing.sm },
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
});
