import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import {
  CB_BAND_A_OK,
  CB_BAND_BJ_WARN,
  CB_BAND_LETTERS,
  CB_CHANNELS,
  CB_NO_CHANNEL,
  CB_OUTSIDE,
  CB_POWER_1_40,
  CB_POWER_41_80,
  CbBandLetter,
  cbBandFreq,
  checkCbFrequency,
  formatMHz,
  TRIPLE_FIVE_LABEL,
  TRIPLE_FIVE_MHZ,
} from "@/src/bandplan/cbData";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

const CB_YELLOW_LIGHT = "#FFF59D"; // Kanäle 1–40 (hellgelb)
const CB_YELLOW_DARK = "#F9A825"; // Kanäle 41–80 (dunkelgelb)

type Tab = "channels" | "check" | "lookup";

export default function CbScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("channels");

  // EU Kanäle (1–80) — Kanal antippen, um Details anzuzeigen
  const [selectedCh, setSelectedCh] = useState<number | null>(null);
  const selected = useMemo(() => CB_CHANNELS.find((c) => c.ch === selectedCh) ?? null, [selectedCh]);

  // check
  const [freqText, setFreqText] = useState("");
  const mhz = useMemo(() => {
    const v = parseFloat(freqText.replace(",", "."));
    return isFinite(v) && v > 0 ? v : null;
  }, [freqText]);
  const checkResult = useMemo(() => (mhz != null ? checkCbFrequency(mhz) : null), [mhz]);

  // Export A–J lookup
  const [chText, setChText] = useState("");
  const [band, setBand] = useState<CbBandLetter | null>(null);
  const chNum = useMemo(() => {
    const n = parseInt(chText, 10);
    return Number.isInteger(n) && n >= 1 && n <= 40 ? n : null;
  }, [chText]);
  const lookupFreq = useMemo(() => (chNum != null && band ? cbBandFreq(band, chNum) : null), [chNum, band]);
  const isTripleFive = lookupFreq != null && Math.abs(lookupFreq - TRIPLE_FIVE_MHZ) < 0.0005;

  const back = () => (router.canGoBack() ? router.back() : router.replace("/bandplan"));

  const scrollRef = useRef<ScrollView>(null);
  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const TABS: { id: Tab; label: string }[] = [
    { id: "channels", label: "EU Kanäle" },
    { id: "check", label: "Freq. prüfen" },
    { id: "lookup", label: "Export A–J" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title="Bandplan · CB-Funk" onBack={back} />

      <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              testID={`cb-tab-${t.id}`}
              onPress={() => {
                Haptics.selectionAsync();
                setTab(t.id);
              }}
              style={[styles.segBtn, active && { backgroundColor: colors.brandPrimary }]}
            >
              <Text style={[styles.segText, { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        {tab === "channels" && (
          <>
            {selected ? (
              <View testID="cb-channel-detail" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
                <Text style={[styles.resultLabel, { color: colors.onSurfaceMuted }]}>KANAL {selected.ch}</Text>
                <Text style={[styles.resultBig, { color: colors.brand }]}>{formatMHz(selected.freqMHz)} MHz</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceMuted }]}>Zulässig</Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>
                    {selected.ch <= 40 ? CB_POWER_1_40 : CB_POWER_41_80}
                  </Text>
                </View>
                {selected.note ? (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: colors.onSurfaceMuted }]}>Hinweis</Text>
                    <Text style={[styles.metaValue, { color: colors.onSurface }]}>{selected.note}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.helper, { color: colors.onSurfaceMuted }]}>
                Kanal antippen für Frequenz und Kanalinfo (deutsche/EU-Zuteilung, 80 Kanäle).
              </Text>
            )}
            <View testID="cb-channel-grid" style={styles.grid}>
              {CB_CHANNELS.map((c) => {
                const active = selectedCh === c.ch;
                const chipBg = c.ch <= 40 ? CB_YELLOW_LIGHT : CB_YELLOW_DARK;
                return (
                  <Pressable
                    key={c.ch}
                    testID={`cb-channel-${c.ch}`}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (active) {
                        setSelectedCh(null);
                      } else {
                        setSelectedCh(c.ch);
                        scrollTop();
                      }
                    }}
                    style={[
                      styles.chChip,
                      { backgroundColor: active ? colors.brandPrimary : chipBg, borderColor: active ? colors.brandPrimary : chipBg },
                    ]}
                  >
                    <Text style={[styles.chChipText, { color: active ? colors.onBrandPrimary : "#1A1A1A" }]}>{c.ch}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {tab === "check" && (
          <>
            <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
              <View style={styles.inputRow}>
                <TextInput
                  testID="cb-freq-input"
                  value={freqText}
                  onChangeText={(t) => setFreqText(t.replace(/[^0-9.,]/g, ""))}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  placeholder="z. B. 27.065"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.input, { color: colors.onSurface }]}
                />
                <Text style={[styles.unit, { color: colors.brand }]}>MHz</Text>
              </View>
              <Text style={[styles.detected, { color: colors.onSurfaceMuted }]}>
                {mhz != null ? `Erkannt: ${formatMHz(mhz)} MHz` : "CB-Frequenz eingeben"}
              </Text>
            </View>

            {checkResult && checkResult.kind === "channel" && (
              <View testID="cb-check-result" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
                <View style={styles.resultTop}>
                  <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
                  <Text style={[styles.resultTitle, { color: colors.onSurface }]}>
                    Kanal {checkResult.ch} · {formatMHz(checkResult.freqMHz)} MHz
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceMuted }]}>Zulässig</Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>{checkResult.power}</Text>
                </View>
                {checkResult.data && (
                  <View style={[styles.tagBox, { backgroundColor: colors.surfaceTertiary }]}>
                    <MaterialCommunityIcons name="database-outline" size={16} color={colors.onSurfaceSecondary} />
                    <Text style={[styles.tagText, { color: colors.onSurfaceSecondary }]}>Datenkanal</Text>
                  </View>
                )}
              </View>
            )}
            {checkResult && checkResult.kind === "outside" && (
              <View testID="cb-check-outside" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.warning }]}>
                <View style={styles.resultTop}>
                  <MaterialCommunityIcons name="alert-outline" size={22} color={colors.warning} />
                  <Text style={[styles.resultTitle, { color: colors.onSurface }]}>{CB_OUTSIDE}</Text>
                </View>
              </View>
            )}
            {checkResult && checkResult.kind === "no-channel" && (
              <View testID="cb-check-nochannel" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.resultTop}>
                  <MaterialCommunityIcons name="help-circle-outline" size={22} color={colors.onSurfaceMuted} />
                  <Text style={[styles.resultTitle, { color: colors.onSurface }]}>{CB_NO_CHANNEL}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {tab === "lookup" && (
          <>
            {lookupFreq != null && band && (
              <View testID="cb-lookup-result" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
                <Text style={[styles.resultLabel, { color: colors.onSurfaceMuted }]}>BAND {band} · KANAL {chNum}</Text>
                <Text style={[styles.resultBig, { color: colors.brand }]}>{formatMHz(lookupFreq)} MHz</Text>
                {isTripleFive && (
                  <View testID="cb-triple-five" style={[styles.tripleBox, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
                    <MaterialCommunityIcons name="star-four-points" size={18} color={colors.warning} />
                    <Text style={[styles.tripleText, { color: colors.onSurface }]}>{TRIPLE_FIVE_LABEL}</Text>
                  </View>
                )}
                {band === "A" ? (
                  <View style={[styles.legalBox, { backgroundColor: colors.brandTertiary, borderColor: colors.brand }]}>
                    <MaterialCommunityIcons name="check-decagram" size={18} color={colors.onBrandTertiary} />
                    <Text style={[styles.legalText, { color: colors.onBrandTertiary }]}>{CB_BAND_A_OK}</Text>
                  </View>
                ) : (
                  <View testID="cb-lookup-warn" style={[styles.legalBox, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
                    <MaterialCommunityIcons name="alert" size={18} color={colors.warning} />
                    <Text style={[styles.legalText, { color: colors.onSurface }]}>{CB_BAND_BJ_WARN}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceMuted }]}>Band (Export A–J)</Text>
              <View style={styles.bandChips}>
                {CB_BAND_LETTERS.map((b) => {
                  const active = band === b;
                  return (
                    <Pressable
                      key={b}
                      testID={`cb-band-${b}`}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setBand(b);
                        scrollTop();
                      }}
                      style={[
                        styles.bandChip,
                        { backgroundColor: active ? colors.brandPrimary : colors.surface, borderColor: active ? colors.brandPrimary : colors.border },
                      ]}
                    >
                      <Text style={[styles.bandChipText, { color: active ? colors.onBrandPrimary : colors.onSurface }]}>{b}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceMuted, marginTop: spacing.md }]}>Kanalnummer (1–40)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  testID="cb-lookup-channel"
                  value={chText}
                  onChangeText={(t) => setChText(t.replace(/[^0-9]/g, "").slice(0, 2))}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  placeholder="z. B. 19"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.input, { color: colors.onSurface }]}
                />
              </View>
            </View>

            {chNum == null && chText.length > 0 && (
              <Text style={[styles.hintText, { color: colors.warning }]}>Bitte eine Kanalnummer zwischen 1 und 40 eingeben.</Text>
            )}
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },

  segment: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  segText: { fontSize: fontSize.base, fontWeight: "700" },

  helper: { fontSize: fontSize.sm, fontWeight: "600", lineHeight: 18, marginBottom: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chChip: { width: 46, height: 46, borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  chChipText: { fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },

  card: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.sm },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: "700" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, minWidth: 0, height: 48, fontSize: fontSize.xxl, fontWeight: "700", fontFamily: monoFont, paddingVertical: 0 },
  unit: { fontSize: fontSize.lg, fontWeight: "800" },
  detected: { fontSize: fontSize.base, fontWeight: "700", fontFamily: monoFont },

  bandChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  bandChip: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  bandChipText: { fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },

  hintText: { fontSize: fontSize.sm, fontWeight: "600", marginTop: spacing.xs },

  resultCard: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.sm },
  resultTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  resultTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: "800" },
  resultLabel: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1 },
  resultBig: { fontSize: fontSize.huge, fontWeight: "800", fontFamily: monoFont },

  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  metaLabel: { width: 90, fontSize: fontSize.sm, fontWeight: "600" },
  metaValue: { flex: 1, fontSize: fontSize.base, fontWeight: "700" },

  tagBox: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  tagText: { fontSize: fontSize.sm, fontWeight: "800" },

  legalBox: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.xs },
  legalText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18, fontWeight: "600" },
  tripleBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.xs },
  tripleText: { flex: 1, fontSize: fontSize.base, fontWeight: "800" },
});
