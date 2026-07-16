import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { MAIN_DISCLAIMER } from "@/src/bandplan/data";
import { UniversalFreqCheck } from "@/src/bandplan/UniversalFreqCheck";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { ScreenBg } from "@/src/components/ScreenBg";
import { centered, overlayChip } from "@/src/theme/layout";
import { useTheme } from "@/src/theme/useTheme";

export default function BandplanScreen() {
  const { colors, darkbg } = useTheme();
  const router = useRouter();

  const go = (path: string) => {
    Haptics.selectionAsync();
    router.push(path as never);
  };

  return (
    <View style={styles.root}>
      <ScreenBg bg={4} />
      <ScreenHeader
        title="Bandplan"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, centered]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        {/* Universelles Frequenz prüfen — Amateurfunk + CB (inkl. Export A–J) */}
        <UniversalFreqCheck />

        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>BEREICHE</Text>

        {/* Amateurfunk — oben, volle Breite */}
        <Pressable
          testID="bandplan-amateur-button"
          onPress={() => go("/bandplan/amateur")}
          style={({ pressed }) => [
            styles.amateurBtn,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderStrong, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.amateurIcon, { backgroundColor: colors.brandTertiary }]}>
            <MaterialCommunityIcons name="radio-tower" size={30} color={colors.onBrandTertiary} />
          </View>
          <View style={styles.amateurInfo}>
            <Text style={[styles.amateurTitle, { color: colors.onSurface }]}>Amateurfunk</Text>
            <Text style={[styles.amateurSub, { color: colors.onSurfaceMuted }]}>KW-Bänder & Segmente</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* CB-Funk & Flugfunk — darunter */}
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

        <Text style={[styles.disclaimer, overlayChip(darkbg), { color: colors.onSurfaceMuted }]}>{MAIN_DISCLAIMER}</Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },

  sectionLabel: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.xs },

  amateurBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.lg,
  },
  amateurIcon: { width: 54, height: 54, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  amateurInfo: { flex: 1 },
  amateurTitle: { fontSize: fontSize.xl, fontWeight: "800" },
  amateurSub: { fontSize: fontSize.sm, fontWeight: "600", marginTop: 2 },

  subRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  subBtn: { flex: 1, borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, alignItems: "center", gap: 2 },
  subEmoji: { fontSize: 30, marginBottom: spacing.xs },
  subText: { fontSize: fontSize.lg, fontWeight: "800" },
  subSub: { fontSize: fontSize.sm, fontWeight: "600" },

  disclaimer: { fontSize: fontSize.sm, lineHeight: 18, marginTop: spacing.xl },
});
