import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { morseToText } from "@/src/morse/morse";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export function DecodeTab() {
  const { colors } = useTheme();
  const [buffer, setBuffer] = useState("");

  const decoded = useMemo(() => morseToText(buffer), [buffer]);

  const tapDot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBuffer((p) => p + ".");
  };
  const tapDash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBuffer((p) => p + "-");
  };
  const letterGap = () => {
    Haptics.selectionAsync();
    setBuffer((p) => (p === "" || p.endsWith(" ") ? p : p + " "));
  };
  const wordGap = () => {
    Haptics.selectionAsync();
    setBuffer((p) => {
      const trimmed = p.replace(/\s+$/, "");
      return trimmed === "" ? p : trimmed + " / ";
    });
  };
  const del = () => {
    setBuffer((p) => {
      if (p.endsWith(" / ")) return p.slice(0, -3);
      if (p.endsWith(" ")) return p.slice(0, -1);
      return p.slice(0, -1);
    });
  };
  const reset = () => {
    Haptics.selectionAsync();
    setBuffer("");
  };

  const renderSep = (testID: string, icon: string, label: string, onPress: () => void) => (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.sepBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
    >
      <MaterialCommunityIcons name={icon as never} size={20} color={colors.brand} />
      <Text numberOfLines={1} style={[styles.sepLabel, { color: colors.onSurface }]}>
        {label}
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
      <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>KLARTEXT</Text>
      <View style={[styles.outputCard, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
        <Text testID="decode-output" style={[styles.decodedText, { color: colors.brand }]}>
          {decoded || "\u2014"}
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>MORSE-EINGABE</Text>
      <TextInput
        testID="decode-morse-input"
        value={buffer}
        onChangeText={setBuffer}
        placeholder=".- / -..."
        placeholderTextColor={colors.onSurfaceMuted}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        style={[
          styles.morseInput,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            color: colors.onSurface,
            fontFamily: monoFont,
          },
        ]}
      />

      <View style={styles.tapRow}>
        <Pressable
          testID="decode-dot-button"
          onPress={tapDot}
          style={({ pressed }) => [
            styles.bigTap,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.dotSymbol, { color: colors.brand }]}>{"\u25CF"}</Text>
          <Text style={[styles.tapLabel, { color: colors.onSurface }]}>Punkt</Text>
        </Pressable>
        <Pressable
          testID="decode-dash-button"
          onPress={tapDash}
          style={({ pressed }) => [
            styles.bigTap,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <View style={[styles.dashSymbol, { backgroundColor: colors.brand }]} />
          <Text style={[styles.tapLabel, { color: colors.onSurface }]}>Strich</Text>
        </Pressable>
      </View>

      <View style={styles.sepRow}>
        {renderSep("decode-space-button", "arrow-right-thin", "Leerz.", letterGap)}
        {renderSep("decode-word-button", "arrow-collapse-right", "Wort", wordGap)}
        {renderSep("decode-delete-button", "backspace-outline", "Löschen", del)}
        {renderSep("decode-reset-button", "refresh", "Reset", reset)}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1, marginTop: spacing.sm },
  outputCard: {
    minHeight: 80,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: "center",
  },
  decodedText: { fontSize: fontSize.xxl, fontWeight: "800", letterSpacing: 1 },
  morseInput: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: fontSize.lg,
    letterSpacing: 2,
    textAlignVertical: "top",
  },
  tapRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  bigTap: {
    flex: 1,
    minHeight: 150,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  dotSymbol: { fontSize: 52, lineHeight: 56 },
  dashSymbol: { width: 56, height: 16, borderRadius: 8 },
  tapLabel: { fontSize: fontSize.lg, fontWeight: "700" },
  sepRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  sepBtn: {
    flex: 1,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sepLabel: { fontSize: fontSize.sm, fontWeight: "600" },
});
