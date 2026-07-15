import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AFUV_OUTSIDE_HINT, EMCOMM_HINT } from "@/src/bandplan/data";
import { findHamSegment, formatBandwidth, isEmcomm, parseFrequencyKHz, powerRows, segmentRange, Unit } from "@/src/bandplan/frequency";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function FrequencyCheckScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [text, setText] = useState("");
  const [unit, setUnit] = useState<Unit>("MHz");

  const khz = useMemo(() => parseFrequencyKHz(text, unit), [text, unit]);
  const match = useMemo(() => (khz != null ? findHamSegment(khz) : null), [khz]);
  const emcomm = useMemo(() => (khz != null ? isEmcomm(khz) : false), [khz]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/bandplan"));
  const detected = khz != null ? String(khz).replace(".", ",") : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title="Bandplan · Frequenz prüfen" onBack={back} />
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        {/* Input */}
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
          <View style={styles.inputRow}>
            <TextInput
              testID="freq-check-input"
              value={text}
              onChangeText={(t) => setText(t.replace(/[^0-9.,]/g, ""))}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder={unit === "MHz" ? "z. B. 14.300" : "z. B. 14300"}
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.input, { color: colors.onSurface }]}
            />
            <View style={[styles.unitToggle, { borderColor: colors.border }]}>
              {(["kHz", "MHz"] as const).map((u) => {
                const active = unit === u;
                return (
                  <Pressable
                    key={u}
                    testID={`freq-unit-${u}`}
                    onPress={() => setUnit(u)}
                    style={[styles.unitBtn, active && { backgroundColor: colors.brandPrimary }]}
                  >
                    <Text style={[styles.unitText, { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>{u}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Text testID="freq-detected" style={[styles.detected, { color: colors.onSurfaceMuted }]}>
            {detected ? `Erkannt: ${detected} kHz` : "Sendefrequenz eingeben"}
          </Text>
        </View>

        {/* Result */}
        {khz == null ? null : match ? (
          <View testID="freq-result-in" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
            <View style={styles.resultTop}>
              <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
              <Text style={[styles.resultBand, { color: colors.onSurface }]}>
                {match.band.name} · {segmentRange(match.segment, match.band.unit)}
              </Text>
            </View>

            <Row label="Betriebsart" value={match.segment.mode} colors={colors} />
            {match.segment.recommended ? <Row label="Rufwelle" value={match.segment.recommended} colors={colors} /> : null}
            {match.segment.bwHz != null ? <Row label="Max. Bandbreite" value={formatBandwidth(match.segment.bwHz)} colors={colors} /> : null}
            {powerRows(match.segment.power).map((r) => (
              <Row key={r.label} label={r.label} value={r.value} colors={colors} />
            ))}

            {emcomm ? (
              <View testID="emcomm-hint" style={[styles.emcomm, { backgroundColor: colors.brandTertiary, borderColor: colors.brand }]}>
                <MaterialCommunityIcons name="alert-decagram" size={20} color={colors.onBrandTertiary} />
                <View style={styles.flex}>
                  <Text style={[styles.emcommTitle, { color: colors.onBrandTertiary }]}>IARU-Notfunk-Vorzugsfrequenz</Text>
                  <Text style={[styles.emcommText, { color: colors.onBrandTertiary }]}>{EMCOMM_HINT}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View testID="freq-result-out" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.resultTop}>
              <MaterialCommunityIcons name="close-circle-outline" size={22} color={colors.warning} />
              <Text style={[styles.resultBand, { color: colors.onSurface }]}>
                Diese Frequenz liegt außerhalb der Amateurfunk-Zuweisung.
              </Text>
            </View>
            <View style={[styles.legalBox, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
              <MaterialCommunityIcons name="scale-balance" size={18} color={colors.warning} />
              <Text style={[styles.legalText, { color: colors.onSurface }]}>{AFUV_OUTSIDE_HINT}</Text>
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  card: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.md },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, minWidth: 0, height: 48, fontSize: fontSize.xxl, fontWeight: "700", fontFamily: monoFont, paddingVertical: 0 },
  unitToggle: { flexDirection: "row", borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  unitBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, minWidth: 42, alignItems: "center" },
  unitText: { fontSize: fontSize.base, fontWeight: "800" },
  detected: { fontSize: fontSize.base, fontWeight: "700", fontFamily: monoFont },

  resultCard: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.sm },
  resultTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  resultBand: { flex: 1, fontSize: fontSize.lg, fontWeight: "800" },

  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingVertical: 3 },
  rowLabel: { width: 120, fontSize: fontSize.sm, fontWeight: "600" },
  rowValue: { flex: 1, fontSize: fontSize.base, fontWeight: "700" },

  emcomm: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.sm },
  emcommTitle: { fontSize: fontSize.base, fontWeight: "800", marginBottom: 2 },
  emcommText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: "600" },

  legalBox: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.sm },
  legalText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18, fontWeight: "600" },
});
