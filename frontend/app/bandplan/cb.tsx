import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import {
  CB_BAND_A_OK,
  CB_BAND_BJ_WARN,
  CB_BAND_LETTERS,
  CB_CHANNELS,
  CB_NO_CHANNEL,
  CB_OUTSIDE,
  CbBandLetter,
  cbBandFreq,
  checkCbFrequency,
  formatMHz,
} from "@/src/bandplan/cbData";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Tab = "channels" | "check" | "lookup";

export default function CbScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("channels");

  // check
  const [freqText, setFreqText] = useState("");
  const mhz = useMemo(() => {
    const v = parseFloat(freqText.replace(",", "."));
    return isFinite(v) && v > 0 ? v : null;
  }, [freqText]);
  const checkResult = useMemo(() => (mhz != null ? checkCbFrequency(mhz) : null), [mhz]);

  // lookup
  const [chText, setChText] = useState("");
  const [band, setBand] = useState<CbBandLetter | null>(null);
  const chNum = useMemo(() => {
    const n = parseInt(chText, 10);
    return Number.isInteger(n) && n >= 1 && n <= 40 ? n : null;
  }, [chText]);
  const lookupFreq = useMemo(() => (chNum != null && band ? cbBandFreq(band, chNum) : null), [chNum, band]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/bandplan"));

  const TABS: { id: Tab; label: string }[] = [
    { id: "channels", label: "Kanäle" },
    { id: "check", label: "Freq. prüfen" },
    { id: "lookup", label: "Kanal → MHz" },
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
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        {tab === "channels" && (
          <View testID="cb-channel-list" style={styles.list}>
            {CB_CHANNELS.map((c) => (
              <View
                key={c.ch}
                testID={`cb-channel-${c.ch}`}
                style={[styles.chRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <View style={[styles.chBadge, { backgroundColor: colors.brandTertiary }]}>
                  <Text style={[styles.chBadgeText, { color: colors.onBrandTertiary }]}>{c.ch}</Text>
                </View>
                <View style={styles.chInfo}>
                  <Text style={[styles.chFreq, { color: colors.onSurface }]}>{formatMHz(c.freqMHz)} MHz</Text>
                  {c.note ? <Text style={[styles.chNote, { color: colors.onSurfaceMuted }]}>{c.note}</Text> : null}
                </View>
              </View>
            ))}
          </View>
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
            <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceMuted }]}>Kanalnummer (1–40)</Text>
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
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceMuted, marginTop: spacing.sm }]}>Band</Text>
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
            </View>

            {chNum == null && chText.length > 0 && (
              <Text style={[styles.hintText, { color: colors.warning }]}>Bitte eine Kanalnummer zwischen 1 und 40 eingeben.</Text>
            )}

            {lookupFreq != null && band && (
              <View testID="cb-lookup-result" style={[styles.resultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
                <Text style={[styles.resultLabel, { color: colors.onSurfaceMuted }]}>BAND {band} · KANAL {chNum}</Text>
                <Text style={[styles.resultBig, { color: colors.brand }]}>{formatMHz(lookupFreq)} MHz</Text>
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

  list: { gap: spacing.sm },
  chRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm },
  chBadge: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  chBadgeText: { fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },
  chInfo: { flex: 1 },
  chFreq: { fontSize: fontSize.lg, fontWeight: "700", fontFamily: monoFont },
  chNote: { fontSize: fontSize.sm, fontWeight: "600", marginTop: 2, lineHeight: 17 },

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
});
