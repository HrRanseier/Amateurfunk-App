import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function AboutScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const version = Constants.expoConfig?.version ?? "—";
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title="Über die App" onBack={back} />

      <View style={styles.content}>
        {/* Identity */}
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

        {/* Developer */}
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="account-circle-outline" size={22} color={colors.brand} />
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>Entwickelt von</Text>
              <Text style={[styles.rowValue, { color: colors.onSurface }]}>DJ1IR, Ingo Rummel</Text>
            </View>
          </View>
        </View>

        {/* Contact placeholder */}
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.brand }]}>KONTAKT</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons name="email-outline" size={22} color={colors.onSurfaceMuted} />
            <Text style={[styles.placeholder, { color: colors.onSurfaceMuted }]}>noch zu ergänzen</Text>
          </View>
        </View>

        <Text style={[styles.footer, { color: colors.onSurfaceMuted }]}>
          Offline-Werkzeugkasten für Funkamateure.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },

  identity: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
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
  section: { fontSize: fontSize.sm, fontWeight: "800", letterSpacing: 1, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowText: { flex: 1 },
  rowLabel: { fontSize: fontSize.sm, fontWeight: "600" },
  rowValue: { fontSize: fontSize.lg, fontWeight: "800", marginTop: 2 },
  placeholder: { fontSize: fontSize.base, fontWeight: "600", fontStyle: "italic" },

  footer: { fontSize: fontSize.sm, fontWeight: "600", textAlign: "center", marginTop: spacing.md },
});
