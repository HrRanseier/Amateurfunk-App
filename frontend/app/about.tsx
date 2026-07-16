import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenBg } from "@/src/components/ScreenBg";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { DesignMode, useDesign } from "@/src/theme/design";
import { centered } from "@/src/theme/layout";
import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

const DESIGN_OPTIONS: { id: DesignMode; icon: any; title: string; desc: string }[] = [
  { id: "minimal", icon: "theme-light-dark", title: "Minimalistisch", desc: "Automatisches Hell-/Dunkel-Design (Systemeinstellung)." },
  { id: "darkbg", icon: "image-filter-hdr", title: "Dunkler Hintergrund", desc: "Feste dunkle Hintergrundbilder, unabhängig vom System." },
];

export default function SettingsScreen() {
  const { colors, darkbg } = useTheme();
  const { mode, setMode } = useDesign();
  const router = useRouter();

  const version = Constants.expoConfig?.version ?? "—";
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const choose = (m: DesignMode) => {
    Haptics.selectionAsync();
    setMode(m);
  };

  return (
    <View style={styles.root}>
      <ScreenBg bg={1} />
      <ScreenHeader title="Einstellungen" onBack={back} />

      <ScrollView contentContainerStyle={[styles.content, centered]} showsVerticalScrollIndicator={false}>
        {/* Design */}
        <Text style={[styles.section, { color: darkbg ? "#FFFFFF" : colors.brand }]}>DESIGN</Text>
        <View style={styles.optionList}>
          {DESIGN_OPTIONS.map((opt) => {
            const active = mode === opt.id;
            return (
              <Pressable
                key={opt.id}
                testID={`design-option-${opt.id}`}
                onPress={() => choose(opt.id)}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: active ? colors.brandPrimary : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons name={opt.icon} size={26} color={active ? colors.brand : colors.onSurfaceMuted} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.onSurface }]}>{opt.title}</Text>
                  <Text style={[styles.optionDesc, { color: colors.onSurfaceMuted }]}>{opt.desc}</Text>
                </View>
                <MaterialCommunityIcons
                  name={active ? "radiobox-marked" : "radiobox-blank"}
                  size={24}
                  color={active ? colors.brand : colors.onSurfaceMuted}
                />
              </Pressable>
            );
          })}
        </View>

        {/* About */}
        <Text style={[styles.section, { color: darkbg ? "#FFFFFF" : colors.brand }]}>ÜBER DIE APP</Text>

        <View style={styles.identity}>
          <View style={[styles.logoBadge, { backgroundColor: colors.brandPrimary }]}>
            <MaterialCommunityIcons name="radio-tower" size={40} color={colors.onBrandPrimary} />
          </View>
          <Text testID="about-name" style={[styles.appName, { color: colors.onSurface }]}>
            Funk Toolbox
          </Text>
          <Text testID="about-version" style={[styles.version, { color: colors.onSurfaceMuted }]}>
            Version {version}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="account-circle-outline" size={22} color={colors.brand} />
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>Entwickelt von</Text>
              <Text style={[styles.rowValue, { color: colors.onSurface }]}>DJ1IR, Ingo Rummel</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.cardSection, { color: colors.brand }]}>KONTAKT</Text>
          <Pressable testID="about-email" onPress={() => Linking.openURL("mailto:DJ1IR@gmx.de")} style={styles.row} hitSlop={8}>
            <MaterialCommunityIcons name="email-outline" size={22} color={colors.brand} />
            <Text style={[styles.email, { color: colors.brand }]}>DJ1IR@gmx.de</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },

  section: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1, marginTop: spacing.sm },
  optionList: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: fontSize.lg, fontWeight: "800" },
  optionDesc: { fontSize: fontSize.sm, fontWeight: "600", marginTop: 2, lineHeight: 16 },

  identity: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  appName: { fontSize: fontSize.xxl, fontWeight: "800", letterSpacing: 0.5 },
  version: { fontSize: fontSize.base, fontWeight: "600" },

  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  cardSection: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowText: { flex: 1 },
  rowLabel: { fontSize: fontSize.sm, fontWeight: "600" },
  rowValue: { fontSize: fontSize.lg, fontWeight: "800", marginTop: 2 },
  email: { fontSize: fontSize.lg, fontWeight: "800", textDecorationLine: "underline" },
});
