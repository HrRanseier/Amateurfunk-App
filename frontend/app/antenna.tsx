import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import {
  computeLength,
  DEFAULT_VF,
  FEED_LABEL,
  FeedPoint,
  feedConfig,
  Lambda,
  LAMBDA_LABEL,
  matchingDevice,
  OneWhole,
  RESULT_HINT,
} from "@/src/antenna/antenna";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

const LAMBDAS: Lambda[] = ["1/4", "1/2", "5/8", "1/1"];

export default function AntennaScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [freqText, setFreqText] = useState("");
  const [lambda, setLambda] = useState<Lambda | null>(null);
  const [oneWhole, setOneWhole] = useState<OneWhole | null>(null);
  const [feed, setFeed] = useState<FeedPoint | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [vfText, setVfText] = useState(String(DEFAULT_VF));

  const freq = useMemo(() => {
    const v = parseFloat(freqText.replace(",", "."));
    return isFinite(v) && v > 0 ? v : null;
  }, [freqText]);

  const isLoop = lambda === "1/1" && oneWhole === "loop";

  const vf = useMemo(() => {
    const v = parseFloat(vfText.replace(",", "."));
    return isFinite(v) && v > 0 ? v : DEFAULT_VF;
  }, [vfText]);

  const cfg = useMemo(() => {
    if (!lambda) return null;
    if (lambda === "1/1") return oneWhole ? feedConfig(lambda, oneWhole) : null;
    return feedConfig(lambda, null);
  }, [lambda, oneWhole]);

  const onlyDigits = (t: string) => t.replace(/[^0-9.,]/g, "");

  const selectLambda = (l: Lambda) => {
    Haptics.selectionAsync();
    setLambda(l);
    if (l === "1/1") {
      setOneWhole(null);
      setFeed(null);
    } else {
      const c = feedConfig(l, null);
      setOneWhole(null);
      setFeed(c.locked ? c.options[0] : null);
    }
  };

  const selectOneWhole = (o: OneWhole) => {
    Haptics.selectionAsync();
    setOneWhole(o);
    const c = feedConfig("1/1", o);
    setFeed(c.locked ? c.options[0] : null);
  };

  const changeVf = (delta: number) => {
    if (isLoop) return;
    Haptics.selectionAsync();
    const next = Math.min(1, Math.max(0.5, Math.round((vf + delta) * 100) / 100));
    setVfText(next.toFixed(2));
  };

  // Determine current state so the result card can always show clear guidance.
  let status: string | null = null;
  if (freq == null) status = "Sendefrequenz eingeben";
  else if (lambda == null) status = "Lambda-Anteil wählen";
  else if (lambda === "1/1" && oneWhole == null) status = "Bauform wählen";
  else if (feed == null) status = "Speisepunkt wählen";

  const length = status == null && freq && lambda ? computeLength(freq, lambda, oneWhole, vf) : null;
  const device = status == null && feed && lambda ? matchingDevice(feed, lambda) : null;

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

  const FeedRow = (opt: FeedPoint, locked: boolean) => {
    const selected = feed === opt;
    return (
      <Pressable
        key={opt}
        testID={`feed-option-${opt}`}
        disabled={locked}
        onPress={() => {
          Haptics.selectionAsync();
          setFeed(opt);
        }}
        style={[
          styles.optRow,
          {
            backgroundColor: selected ? colors.brandTertiary : colors.surface,
            borderColor: selected ? colors.borderStrong : colors.border,
            opacity: locked && !selected ? 0.6 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={locked ? "lock-outline" : selected ? "radiobox-marked" : "radiobox-blank"}
          size={22}
          color={selected ? colors.brand : colors.onSurfaceMuted}
        />
        <Text style={[styles.optText, { color: colors.onSurface }]}>{FEED_LABEL[opt]}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title="Antennenrechner"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        {/* Result — always visible at the top, updates live */}
        <View style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
          {length == null || device == null ? (
            <View style={styles.statusWrap}>
              <MaterialCommunityIcons name="ruler" size={26} color={colors.onSurfaceMuted} />
              <Text testID="antenna-result-status" style={[styles.statusText, { color: colors.onSurfaceMuted }]}>
                {status ?? "Eingaben vervollständigen"}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultLabel, { color: colors.onSurfaceMuted }]}>DRAHTLÄNGE</Text>
              <Text testID="antenna-result-length" style={[styles.resultLength, { color: colors.brand }]}>
                {length.toFixed(2).replace(".", ",")} m
              </Text>
              <View style={[styles.deviceBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.deviceTitle, { color: colors.onSurfaceMuted }]}>EMPFOHLENES ANPASSGERÄT</Text>
                <Text testID="antenna-result-device" style={[styles.deviceText, { color: colors.onSurface }]}>
                  {device}
                </Text>
              </View>
              <Text style={[styles.disclaimer, { color: colors.onSurfaceMuted }]}>{RESULT_HINT}</Text>
            </>
          )}
        </View>

        {/* Step 1 — Frequency */}
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {StepHeader("1", "Sendefrequenz")}
          <View style={styles.freqRow}>
            <TextInput
              testID="antenna-freq-input"
              value={freqText}
              onChangeText={(t) => setFreqText(onlyDigits(t))}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="z. B. 14.200"
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.freqInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
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
                {Chip("Gestreckter Draht", oneWhole === "stretched", () => selectOneWhole("stretched"), "onewhole-stretched")}
                {Chip("Vollwellen-Loop", oneWhole === "loop", () => selectOneWhole("loop"), "onewhole-loop")}
              </View>
            </>
          )}
        </View>

        {/* Step 3 — Feed point */}
        {cfg && (
          <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            {StepHeader("3", "Speisepunkt")}
            {cfg.locked && (
              <Text style={[styles.lockedHint, { color: colors.onSurfaceMuted }]}>
                Für diese Bauart fest vorgegeben.
              </Text>
            )}
            <View style={styles.optList}>{cfg.options.map((opt) => FeedRow(opt, cfg.locked))}</View>
          </View>
        )}

        {/* Advanced — shortening factor with stepper */}
        {lambda && (
          <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Pressable testID="antenna-advanced-toggle" onPress={() => setAdvancedOpen((v) => !v)} style={styles.advHeader}>
              <Text style={[styles.advTitle, { color: colors.onSurface }]}>Erweitert</Text>
              <MaterialCommunityIcons name={advancedOpen ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
            </Pressable>
            {advancedOpen && (
              <View style={styles.advBody}>
                <Text style={[styles.advLabel, { color: colors.onSurface }]}>Verkürzungsfaktor</Text>
                <View style={styles.stepper}>
                  <Pressable
                    testID="vf-minus"
                    onPress={() => changeVf(-0.01)}
                    disabled={isLoop}
                    style={[styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: isLoop ? 0.5 : 1 }]}
                  >
                    <MaterialCommunityIcons name="minus" size={22} color={colors.brand} />
                  </Pressable>
                  <TextInput
                    testID="antenna-vf-input"
                    value={vfText}
                    onChangeText={(t) => setVfText(t.replace(/[^0-9.,]/g, ""))}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    editable={!isLoop}
                    selectTextOnFocus
                    style={[
                      styles.vfInput,
                      { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface, opacity: isLoop ? 0.5 : 1 },
                    ]}
                  />
                  <Pressable
                    testID="vf-plus"
                    onPress={() => changeVf(0.01)}
                    disabled={isLoop}
                    style={[styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: isLoop ? 0.5 : 1 }]}
                  >
                    <MaterialCommunityIcons name="plus" size={22} color={colors.brand} />
                  </Pressable>
                </View>
                {isLoop && (
                  <Text style={[styles.advNote, { color: colors.onSurfaceMuted }]}>
                    Bei Vollwellen-Loop nicht angewendet (feste Formel 306,3 / f).
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  resultCard: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.xs },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  statusText: { flex: 1, fontSize: fontSize.base, fontWeight: "600" },
  resultLabel: { fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1 },
  resultLength: { fontSize: fontSize.huge, fontWeight: "800", fontFamily: monoFont },
  deviceBox: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.xs, marginTop: spacing.xs },
  deviceTitle: { fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 0.5 },
  deviceText: { fontSize: fontSize.base, fontWeight: "600", lineHeight: 20 },
  disclaimer: { fontSize: fontSize.sm, lineHeight: 18, marginTop: spacing.xs },

  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: fontSize.sm, fontWeight: "800" },
  stepTitle: { fontSize: fontSize.lg, fontWeight: "700" },

  freqRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  freqInput: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xl,
    fontFamily: monoFont,
  },
  unit: { fontSize: fontSize.lg, fontWeight: "800" },

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

  lockedHint: { fontSize: fontSize.sm },
  optList: { gap: spacing.sm },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  optText: { flex: 1, fontSize: fontSize.base, fontWeight: "600" },

  advHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  advTitle: { fontSize: fontSize.base, fontWeight: "700" },
  advBody: { gap: spacing.sm },
  advLabel: { fontSize: fontSize.base, fontWeight: "600" },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
