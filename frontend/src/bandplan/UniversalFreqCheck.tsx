import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AFUV_OUTSIDE_HINT, EMCOMM_HINT } from "@/src/bandplan/data";
import {
  CbIdentity,
  CB_BAND_A_OK,
  CB_BAND_BJ_WARN,
  formatMHz,
  hasCb,
  identifyCb,
  TRIPLE_FIVE_LABEL,
} from "@/src/bandplan/cbData";
import {
  findHamSegment,
  formatBandwidth,
  isEmcomm,
  licenseClasses,
  parseFrequencyKHz,
  powerRows,
  segmentRange,
  Unit,
} from "@/src/bandplan/frequency";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Colors = ReturnType<typeof useTheme>["colors"];

export function UniversalFreqCheck() {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [unit, setUnit] = useState<Unit>("MHz");

  const khz = useMemo(() => parseFrequencyKHz(text, unit), [text, unit]);
  const ham = useMemo(() => (khz != null ? findHamSegment(khz) : null), [khz]);
  const emcomm = useMemo(() => (khz != null ? isEmcomm(khz) : false), [khz]);
  const cb = useMemo<CbIdentity | null>(() => (khz != null ? identifyCb(khz / 1000) : null), [khz]);

  const detected = khz != null ? String(khz).replace(".", ",") : null;
  const showCb = cb != null && hasCb(cb);
  const nothing = khz != null && !ham && !showCb;

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
      <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Frequenz prüfen</Text>
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
              <Pressable key={u} testID={`freq-unit-${u}`} onPress={() => setUnit(u)} style={[styles.unitBtn, active && { backgroundColor: colors.brandPrimary }]}>
                <Text style={[styles.unitText, { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>{u}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text testID="freq-detected" style={[styles.detected, { color: colors.onSurfaceMuted }]}>
        {detected ? `Erkannt: ${detected} kHz` : "Frequenz eingeben"}
      </Text>

      {ham && (
        <View testID="freq-result-ham" style={[styles.section, { borderColor: colors.border }]}>
          <SectionHead icon="radio-tower" label="AMATEURFUNK" colors={colors} />
          <Text style={[styles.resultTitle, { color: colors.onSurface }]}>
            {ham.band.name} · {segmentRange(ham.segment, ham.band.unit)}
          </Text>
          <Row label="Sendeart" value={ham.segment.mode} colors={colors} />
          {ham.segment.recommended ? <Row label="Rufwelle" value={ham.segment.recommended} colors={colors} /> : null}
          {ham.segment.bwHz != null ? <Row label="Bandbreite" value={formatBandwidth(ham.segment.bwHz)} colors={colors} /> : null}
          {powerRows(ham.segment.power).map((r) => (
            <Row key={r.label} label={r.label} value={r.value} colors={colors} />
          ))}
          {licenseClasses(ham.segment.power) ? <Row label="Lizenz" value={licenseClasses(ham.segment.power)!} colors={colors} /> : null}
          {ham.segment.note ? <Row label="Sonderangabe" value={ham.segment.note} colors={colors} /> : null}
          {emcomm && (
            <View testID="emcomm-hint" style={[styles.emcomm, { backgroundColor: colors.brandTertiary, borderColor: colors.brand }]}>
              <MaterialCommunityIcons name="alert-decagram" size={18} color={colors.onBrandTertiary} />
              <View style={styles.flex}>
                <Text style={[styles.emcommTitle, { color: colors.onBrandTertiary }]}>IARU-Notfunk-Vorzugsfrequenz</Text>
                <Text style={[styles.emcommText, { color: colors.onBrandTertiary }]}>{EMCOMM_HINT}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {showCb && cb && (
        <View testID="freq-result-cb" style={[styles.section, { borderColor: colors.border }]}>
          <SectionHead icon="radio-handheld" label="CB-FUNK / 11 M" colors={colors} />
          {cb.tripleFive && (
            <View style={[styles.tripleBox, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
              <MaterialCommunityIcons name="star-four-points" size={18} color={colors.warning} />
              <Text style={[styles.tripleText, { color: colors.onSurface }]}>{TRIPLE_FIVE_LABEL}</Text>
            </View>
          )}
          <Text style={[styles.resultTitle, { color: colors.onSurface }]}>
            {cb.exportRef
              ? `Kanal ${cb.exportRef.ch} · Band ${cb.exportRef.band}`
              : cb.german
              ? `Kanal ${cb.german.ch}`
              : "CB-Bereich"}
          </Text>
          {cb.legal && cb.german ? (
            <>
              <Row label="Frequenz" value={`${formatMHz(cb.german.freqMHz)} MHz`} colors={colors} />
              {cb.power ? <Row label="Zulässig" value={cb.power} colors={colors} /> : null}
              {cb.exportRef && cb.german.ch !== cb.exportRef.ch ? (
                <Row label="DE-Zuteilung" value={`Kanal ${cb.german.ch}`} colors={colors} />
              ) : null}
              {cb.german.note ? <Row label="Hinweis" value={cb.german.note} colors={colors} /> : null}
              <View style={[styles.legalBox, { backgroundColor: colors.brandTertiary, borderColor: colors.brand }]}>
                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.onBrandTertiary} />
                <Text style={[styles.legalText, { color: colors.onBrandTertiary }]}>{CB_BAND_A_OK}</Text>
              </View>
            </>
          ) : (
            <>
              {cb.exportRef ? <Row label="Frequenz" value={`${formatMHz(cb.exportRef.freqMHz)} MHz`} colors={colors} /> : null}
              <View style={[styles.legalBox, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
                <MaterialCommunityIcons name="alert" size={16} color={colors.warning} />
                <Text style={[styles.legalText, { color: colors.onSurface }]}>{CB_BAND_BJ_WARN}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {khz != null && !ham && !(showCb && cb.legal) && (
        <View testID="freq-afuv" style={[styles.legalBox, { backgroundColor: colors.surface, borderColor: colors.warning, marginTop: spacing.sm }]}>
          <MaterialCommunityIcons name="scale-balance" size={16} color={colors.warning} />
          <View style={styles.flex}>
            {nothing ? (
              <Text style={[styles.afuvHead, { color: colors.onSurface }]}>Diese Frequenz liegt außerhalb der Amateurfunk-Zuweisung.</Text>
            ) : null}
            <Text style={[styles.legalText, { color: colors.onSurface }]}>{AFUV_OUTSIDE_HINT}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function SectionHead({ icon, label, colors }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string; colors: Colors }) {
  return (
    <View style={styles.sectionHead}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.brand} />
      <Text style={[styles.sectionLabel, { color: colors.brand }]}>{label}</Text>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontSize: fontSize.lg, fontWeight: "800" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, minWidth: 0, height: 48, fontSize: fontSize.xxl, fontWeight: "700", fontFamily: monoFont, paddingVertical: 0 },
  unitToggle: { flexDirection: "row", borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  unitBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, minWidth: 42, alignItems: "center" },
  unitText: { fontSize: fontSize.base, fontWeight: "800" },
  detected: { fontSize: fontSize.base, fontWeight: "700", fontFamily: monoFont },

  section: { borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.xs, gap: 4 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  sectionLabel: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1 },
  resultTitle: { fontSize: fontSize.lg, fontWeight: "800", marginBottom: 2 },

  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingVertical: 2 },
  rowLabel: { width: 104, fontSize: fontSize.sm, fontWeight: "600" },
  rowValue: { flex: 1, fontSize: fontSize.base, fontWeight: "700" },

  emcomm: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.xs },
  emcommTitle: { fontSize: fontSize.base, fontWeight: "800", marginBottom: 2 },
  emcommText: { fontSize: fontSize.sm, lineHeight: 18, fontWeight: "600" },

  tripleBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.xs },
  tripleText: { flex: 1, fontSize: fontSize.base, fontWeight: "800" },

  legalBox: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.xs },
  legalText: { flex: 1, fontSize: fontSize.sm, lineHeight: 18, fontWeight: "600" },
  afuvHead: { fontSize: fontSize.base, fontWeight: "800", marginBottom: 2 },
});
