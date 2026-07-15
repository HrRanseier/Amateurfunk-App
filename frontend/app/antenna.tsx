import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import {
  BANDS_HINT,
  computeLength,
  DEFAULT_VF,
  harmonicLabel,
  Lambda,
  LAMBDA_LABEL,
  LENGTH_HINT,
  OneWhole,
  resonantBands,
} from "@/src/antenna/antenna";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

const LAMBDAS: Lambda[] = ["1/4", "1/2", "5/8", "1/1"];
type Mode = "forward" | "reverse";

export default function AntennaScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("forward");
  const [freqText, setFreqText] = useState("");
  const [lengthText, setLengthText] = useState("");
  const [lambda, setLambda] = useState<Lambda | null>(null);
  const [oneWhole, setOneWhole] = useState<OneWhole | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [vfText, setVfText] = useState(String(DEFAULT_VF));

  const sanitize = (t: string) => t.replace(/[^0-9.,]/g, "");

  const freq = useMemo(() => {
    const v = parseFloat(freqText.replace(",", "."));
    return isFinite(v) && v > 0 ? v : null;
  }, [freqText]);

  const lengthVal = useMemo(() => {
    const v = parseFloat(lengthText.replace(",", "."));
    return isFinite(v) && v > 0 ? v : null;
  }, [lengthText]);

  const isLoop = lambda === "1/1" && oneWhole === "loop";

  const vf = useMemo(() => {
    const v = parseFloat(vfText.replace(",", "."));
    return isFinite(v) && v > 0 ? v : DEFAULT_VF;
  }, [vfText]);

  const selectLambda = (l: Lambda) => {
    Haptics.selectionAsync();
    setLambda(l);
    if (l !== "1/1") setOneWhole(null);
  };

  const changeVf = (delta: number) => {
    if (isLoop && mode === "forward") return;
    Haptics.selectionAsync();
    const next = Math.min(1, Math.max(0.5, Math.round((vf + delta) * 100) / 100));
    setVfText(next.toFixed(2));
  };

  // Forward status/result
  let fwdStatus: string | null = null;
  if (freq == null) fwdStatus = "Sendefrequenz eingeben";
  else if (lambda == null) fwdStatus = "Lambda-Anteil wählen";
  else if (lambda === "1/1" && oneWhole == null) fwdStatus = "Bauform wählen";
  const length = fwdStatus == null && freq && lambda ? computeLength(freq, lambda, oneWhole, vf) : null;

  // Reverse result
  const bands = useMemo(() => (lengthVal ? resonantBands(lengthVal, vf) : []), [lengthVal, vf]);

  const vfDisabled = mode === "forward" && isLoop;

  const StepHeader = (num: string, title: string) => (
    <View style={styles.stepHeader}>
      <View style={[styles.stepNum, { backgroundColor: colors.brandPrimary }]}>
        <Text style={[styles.stepNumText, { color: colors.onBrandPrimary }]}>{num}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.onSurface }]}>{title}</Text>
    </View>
  );

  const Chip = (label: string, active: boolean, onPress: () => void, testID: string) => (
    <Pressable
      key={testID}
      testID={testID}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.brandPrimary : colors.surface,
          borderColor: active ? colors.brandPrimary : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>{label}</Text>
    </Pressable>
  );

  const renderAdvanced = () => (
    <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Pressable testID="antenna-advanced-toggle" onPress={() => setAdvancedOpen((v) => !v)} style={styles.advHeader}>
        <Text style={[styles.advTitle, { color: colors.onSurface }]}>Erweitert · Verkürzungsfaktor</Text>
        <MaterialCommunityIcons name={advancedOpen ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
      </Pressable>
      {advancedOpen && (
        <View style={styles.advBody}>
          <View style={styles.stepper}>
            <Pressable
              testID="vf-minus"
              onPress={() => changeVf(-0.01)}
              disabled={vfDisabled}
              style={[styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: vfDisabled ? 0.5 : 1 }]}
            >
              <MaterialCommunityIcons name="minus" size={22} color={colors.brand} />
            </Pressable>
            <TextInput
              testID="antenna-vf-input"
              value={vfText}
              onChangeText={(t) => setVfText(sanitize(t))}
              keyboardType="decimal-pad"
              inputMode="decimal"
              editable={!vfDisabled}
              selectTextOnFocus
              style={[
                styles.vfInput,
                { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface, opacity: vfDisabled ? 0.5 : 1 },
              ]}
            />
            <Pressable
              testID="vf-plus"
              onPress={() => changeVf(0.01)}
              disabled={vfDisabled}
              style={[styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: vfDisabled ? 0.5 : 1 }]}
            >
              <MaterialCommunityIcons name="plus" size={22} color={colors.brand} />
            </Pressable>
          </View>
          {vfDisabled && (
            <Text style={[styles.advNote, { color: colors.onSurfaceMuted }]}>
              Bei Vollwellen-Loop nicht angewendet (feste Formel 306,3 / f).
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title="Antennenrechner"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />

      <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        {(["forward", "reverse"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              testID={`antenna-mode-${m}`}
              onPress={() => {
                Haptics.selectionAsync();
                setMode(m);
              }}
              style={[styles.segBtn, active && { backgroundColor: colors.brandPrimary }]}
            >
              <Text style={[styles.segText, { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>
                {m === "forward" ? "Frequenz → Länge" : "Länge → Bänder"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        {mode === "forward" ? (
          <>
            {/* Result — always visible at top */}
            <View style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
              {length == null ? (
                <View style={styles.statusWrap}>
                  <MaterialCommunityIcons name="ruler" size={26} color={colors.onSurfaceMuted} />
                  <Text testID="antenna-result-status" style={[styles.statusText, { color: colors.onSurfaceMuted }]}>
                    {fwdStatus}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.resultLabel, { color: colors.onSurfaceMuted }]}>DRAHTLÄNGE</Text>
                  <Text testID="antenna-result-length" style={[styles.resultBig, { color: colors.brand }]}>
                    {length.toFixed(2).replace(".", ",")} m
                  </Text>
                  <Text style={[styles.disclaimer, { color: colors.onSurfaceMuted }]}>{LENGTH_HINT}</Text>
                </>
              )}
            </View>

            {/* Step 1 — Frequency */}
            <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {StepHeader("1", "Sendefrequenz")}
              <View style={styles.inputRow}>
                <TextInput
                  testID="antenna-freq-input"
                  value={freqText}
                  onChangeText={(t) => setFreqText(sanitize(t))}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  placeholder="z. B. 14.200"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.bigInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
                <Text style={[styles.unit, { color: colors.brand }]}>MHz</Text>
              </View>
            </View>

            {/* Step 2 — Lambda */}
            <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {StepHeader("2", "Lambda-Anteil")}
              <View style={styles.chipRow}>
                {LAMBDAS.map((l) =>
                  Chip(LAMBDA_LABEL[l], lambda === l, () => selectLambda(l), `lambda-chip-${l.replace("/", "-")}`),
                )}
              </View>
              {lambda === "1/1" && (
                <>
                  <Text style={[styles.subLabel, { color: colors.onSurfaceMuted }]}>Bauform</Text>
                  <View style={styles.chipRow}>
                    {Chip("Gestreckter Draht", oneWhole === "stretched", () => { Haptics.selectionAsync(); setOneWhole("stretched"); }, "onewhole-stretched")}
                    {Chip("Vollwellen-Loop", oneWhole === "loop", () => { Haptics.selectionAsync(); setOneWhole("loop"); }, "onewhole-loop")}
                  </View>
                </>
              )}
            </View>

            {lambda && renderAdvanced()}
          </>
        ) : (
          <>
            {/* Reverse result — bands */}
            <View style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
              {lengthVal == null ? (
                <View style={styles.statusWrap}>
                  <MaterialCommunityIcons name="radio-tower" size={26} color={colors.onSurfaceMuted} />
                  <Text testID="antenna-reverse-status" style={[styles.statusText, { color: colors.onSurfaceMuted }]}>
                    Drahtlänge eingeben
                  </Text>
                </View>
              ) : bands.length === 0 ? (
                <View style={styles.statusWrap}>
                  <MaterialCommunityIcons name="information-outline" size={26} color={colors.onSurfaceMuted} />
                  <Text testID="antenna-reverse-status" style={[styles.statusText, { color: colors.onSurfaceMuted }]}>
                    Keine Resonanz in einem Amateurfunkband
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.resultLabel, { color: colors.onSurfaceMuted }]}>RESONANTE BÄNDER</Text>
                  <View testID="antenna-bands-list" style={styles.bandsList}>
                    {bands.map((h, i) => (
                      <View
                        key={`${h.band}-${h.harmonic}`}
                        testID={`band-hit-${i}`}
                        style={[styles.bandRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <Text style={[styles.bandName, { color: colors.brand }]}>{h.band}</Text>
                        <View style={styles.bandMeta}>
                          <Text style={[styles.bandFreq, { color: colors.onSurface }]}>
                            {h.freqMHz.toFixed(3).replace(".", ",")} MHz
                          </Text>
                          <Text style={[styles.bandHarm, { color: colors.onSurfaceMuted }]}>{harmonicLabel(h.harmonic)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.disclaimer, { color: colors.onSurfaceMuted }]}>{BANDS_HINT}</Text>
                </>
              )}
            </View>

            {/* Length input */}
            <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {StepHeader("1", "Drahtlänge")}
              <View style={styles.inputRow}>
                <TextInput
                  testID="antenna-length-input"
                  value={lengthText}
                  onChangeText={(t) => setLengthText(sanitize(t))}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  placeholder="z. B. 20.10"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.bigInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
                <Text style={[styles.unit, { color: colors.brand }]}>m</Text>
              </View>
            </View>

            {renderAdvanced()}
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  segment: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  segText: { fontSize: fontSize.base, fontWeight: "700" },

  resultCard: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.xs },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  statusText: { flex: 1, fontSize: fontSize.base, fontWeight: "600" },
  resultLabel: { fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1 },
  resultBig: { fontSize: fontSize.huge, fontWeight: "800", fontFamily: monoFont },
  disclaimer: { fontSize: fontSize.sm, lineHeight: 18, marginTop: spacing.xs },

  bandsList: { gap: spacing.sm, marginTop: spacing.xs },
  bandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bandName: { fontSize: fontSize.xl, fontWeight: "800", fontFamily: monoFont },
  bandMeta: { alignItems: "flex-end" },
  bandFreq: { fontSize: fontSize.base, fontWeight: "700", fontFamily: monoFont },
  bandHarm: { fontSize: fontSize.sm, marginTop: 2 },

  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: fontSize.sm, fontWeight: "800" },
  stepTitle: { fontSize: fontSize.lg, fontWeight: "700" },

  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  bigInput: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xl,
    fontFamily: monoFont,
  },
  unit: { fontSize: fontSize.lg, fontWeight: "800", width: 44 },

  chipRow: { flexDirection: "row", gap: spacing.sm },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: "700", textAlign: "center" },
  subLabel: { fontSize: fontSize.sm, fontWeight: "600" },

  advHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  advTitle: { fontSize: fontSize.base, fontWeight: "700" },
  advBody: { gap: spacing.sm },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: { width: 52, height: 52, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  vfInput: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xl,
    fontFamily: monoFont,
    textAlign: "center",
  },
  advNote: { fontSize: fontSize.sm, lineHeight: 18 },
});
