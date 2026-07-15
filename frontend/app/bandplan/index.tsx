import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BANDS, MAIN_DISCLAIMER } from "@/src/bandplan/data";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, monoFont, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function BandplanScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const go = (path: string) => {
    Haptics.selectionAsync();
    router.push(path as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title="Bandplan"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>KURZWELLEN-BÄNDER</Text>

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

        {/* Sub-areas */}
        <View style={styles.subRow}>
          <Pressable
            testID="bandplan-cb-button"
            onPress={() => go("/bandplan/cb")}
            style={({ pressed }) => [
              styles.subBtn,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.subEmoji}>📻</Text>
            <Text style={[styles.subText, { color: colors.onSurface }]}>CB-Funk</Text>
            <Text style={[styles.subSub, { color: colors.onSurfaceMuted }]}>11m-Band</Text>
          </Pressable>
          <Pressable
            testID="bandplan-flugfunk-button"
            onPress={() => go("/bandplan/flugfunk")}
            style={({ pressed }) => [
              styles.subBtn,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.subEmoji}>✈️</Text>
            <Text style={[styles.subText, { color: colors.onSurface }]}>Flugfunk</Text>
            <Text style={[styles.subSub, { color: colors.onSurfaceMuted }]}>Flughafen-Frequenzen</Text>
          </Pressable>
        </View>

        <Text style={[styles.disclaimer, { color: colors.onSurfaceMuted }]}>{MAIN_DISCLAIMER}</Text>
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

  subRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  subBtn: { flex: 1, borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, alignItems: "center", gap: 2 },
  subEmoji: { fontSize: 30, marginBottom: spacing.xs },
  subText: { fontSize: fontSize.lg, fontWeight: "800" },
  subSub: { fontSize: fontSize.sm, fontWeight: "600" },

  disclaimer: { fontSize: fontSize.sm, lineHeight: 18, marginTop: spacing.xl },
});
