import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BANDS, SOURCE_NOTE } from "@/src/bandplan/data";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { ScreenBg } from "@/src/components/ScreenBg";
import { centered, overlayChip } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

export default function AmateurScreen() {
  const { colors, darkbg } = useTheme();
  const router = useRouter();

  const go = (path: string) => {
    Haptics.selectionAsync();
    router.push(path as never);
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace("/bandplan"));

  return (
    <View style={styles.root}>
      <ScreenBg bg={4} />
      <ScreenHeader title="Bandplan · Amateurfunk" onBack={back} />

      <ScrollView contentContainerStyle={[styles.content, centered]} showsVerticalScrollIndicator={false}>
        {/* Frequenz prüfen — prominent */}
        <Pressable
          testID="bandplan-check-button"
          onPress={() => go("/bandplan/check")}
          style={({ pressed }) => [
            styles.checkBtn,
            { backgroundColor: colors.brandPrimary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="magnify-scan" size={24} color={colors.onBrandPrimary} />
          <View style={styles.checkTextWrap}>
            <Text style={[styles.checkTitle, { color: colors.onBrandPrimary }]}>Frequenz prüfen</Text>
            <Text style={[styles.checkSub, { color: colors.onBrandPrimary }]}>Amateurfunk-Zuweisung abgleichen</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onBrandPrimary} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>BÄNDER</Text>

        {BANDS.map((band) => (
          <Pressable
            key={band.id}
            testID={`band-row-${band.id}`}
            onPress={() => go(`/bandplan/band?id=${band.id}`)}
            style={({ pressed }) => [
              styles.bandRow,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.bandBadge, { backgroundColor: colors.brandTertiary }]}>
              <Text style={[styles.bandBadgeText, { color: colors.onBrandTertiary }]}>{band.short}</Text>
            </View>
            <View style={styles.bandInfo}>
              <Text style={[styles.bandName, { color: colors.onSurface }]}>{band.name}</Text>
              <Text style={[styles.bandRange, { color: colors.onSurfaceMuted }]}>{band.range}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
          </Pressable>
        ))}

        <Text style={[styles.disclaimer, overlayChip(darkbg), { color: colors.onSurfaceMuted }]}>{SOURCE_NOTE}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },

  checkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  checkTextWrap: { flex: 1 },
  checkTitle: { fontSize: fontSize.lg, fontWeight: "800" },
  checkSub: { fontSize: fontSize.sm, fontWeight: "600", marginTop: 2, opacity: 0.9 },

  sectionLabel: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.xs },

  bandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  bandBadge: { minWidth: 62, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  bandBadgeText: { fontSize: fontSize.base, fontWeight: "800", fontFamily: monoFont },
  bandInfo: { flex: 1 },
  bandName: { fontSize: fontSize.lg, fontWeight: "700" },
  bandRange: { fontSize: fontSize.sm, fontWeight: "600", marginTop: 2, fontFamily: monoFont },

  disclaimer: { fontSize: fontSize.sm, lineHeight: 18, marginTop: spacing.xl },
});
