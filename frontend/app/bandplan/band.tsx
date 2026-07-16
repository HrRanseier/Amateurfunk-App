import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { getBand, SOURCE_NOTE } from "@/src/bandplan/data";
import { formatBandwidth, powerRows, segmentRange } from "@/src/bandplan/frequency";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { ScreenBg } from "@/src/components/ScreenBg";
import { centered, overlayChip } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

export default function BandDetailScreen() {
  const { colors, darkbg } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const band = getBand(id ?? "");

  const back = () => (router.canGoBack() ? router.back() : router.replace("/bandplan"));

  if (!band) {
    return (
      <View style={styles.root}>
      <ScreenBg bg={4} />
        <ScreenHeader title="Bandplan" onBack={back} />
        <View style={styles.empty}>
          <Text style={{ color: colors.onSurfaceMuted }}>Band nicht gefunden.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenBg bg={4} />
      <ScreenHeader title={`Bandplan · ${band.short}`} onBack={back} />
      <ScrollView contentContainerStyle={[styles.content, centered]} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong }]}>
          <Text style={[styles.bandName, { color: colors.onSurface }]}>{band.name}</Text>
          <Text style={[styles.bandRange, { color: colors.brand }]}>{band.range}</Text>
        </View>

        {band.segments.map((seg, i) => {
          const rows = powerRows(seg.power);
          return (
            <View
              key={`${seg.from}-${seg.to}-${i}`}
              testID={`segment-${band.id}-${i}`}
              style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.range, { color: colors.brand }]}>{segmentRange(seg, band.unit)}</Text>
                {seg.alloc ? (
                  <View style={[styles.allocBadge, { backgroundColor: colors.surfaceTertiary }]}>
                    <Text style={[styles.allocText, { color: colors.onSurfaceSecondary }]}>{seg.alloc}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="radio" size={16} color={colors.onSurfaceMuted} />
                <Text style={[styles.metaLabel, { color: colors.onSurfaceMuted }]}>Betriebsart</Text>
                <Text style={[styles.metaValue, { color: colors.onSurface }]}>{seg.mode}</Text>
              </View>

              {seg.recommended ? (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="star-outline" size={16} color={colors.onSurfaceMuted} />
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceMuted }]}>Rufwelle</Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>{seg.recommended}</Text>
                </View>
              ) : null}

              {seg.bwHz != null ? (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="arrow-expand-horizontal" size={16} color={colors.onSurfaceMuted} />
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceMuted }]}>Max. Bandbreite</Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>{formatBandwidth(seg.bwHz)}</Text>
                </View>
              ) : null}

              {rows.length > 0 ? (
                <View style={styles.powerWrap}>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="flash-outline" size={16} color={colors.onSurfaceMuted} />
                    <Text style={[styles.metaLabel, { color: colors.onSurfaceMuted }]}>Max. Leistung</Text>
                    <View style={styles.powerVals}>
                      {rows.map((r) => (
                        <Text key={r.label} style={[styles.powerVal, { color: colors.onSurface }]}>
                          <Text style={{ color: colors.onSurfaceMuted }}>{r.label}: </Text>
                          {r.value}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              ) : null}

              {seg.note ? (
                <Text style={[styles.note, { color: colors.onSurfaceMuted }]}>{seg.note}</Text>
              ) : null}
            </View>
          );
        })}

        <Text style={[styles.source, overlayChip(darkbg), { color: colors.onSurfaceMuted }]}>{SOURCE_NOTE}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg },
  bandName: { fontSize: fontSize.xxl, fontWeight: "800" },
  bandRange: { fontSize: fontSize.lg, fontWeight: "700", fontFamily: monoFont, marginTop: 2 },

  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  range: { flex: 1, fontSize: fontSize.lg, fontWeight: "800", fontFamily: monoFont },
  allocBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  allocText: { fontSize: fontSize.sm, fontWeight: "700" },

  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  metaLabel: { width: 108, fontSize: fontSize.sm, fontWeight: "600", paddingTop: 1 },
  metaValue: { flex: 1, fontSize: fontSize.base, fontWeight: "700" },

  powerWrap: {},
  powerVals: { flex: 1, gap: 2 },
  powerVal: { fontSize: fontSize.base, fontWeight: "700" },

  note: { fontSize: fontSize.sm, fontStyle: "italic", marginTop: spacing.xs },
  source: { fontSize: fontSize.sm, marginTop: spacing.md, lineHeight: 18 },
});
