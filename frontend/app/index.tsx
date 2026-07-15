import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/src/components/Toast";
import { modules, ToolModule } from "@/src/modules/registry";
import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function HubScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const tileSize = (width - spacing.lg * 2 - spacing.md) / 2;

  const onPressTile = (mod: ToolModule) => {
    Haptics.selectionAsync();
    if (mod.enabled && mod.route) {
      router.push(mod.route as never);
    } else {
      toast("Bald verf\u00FCgbar");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={[styles.logoBadge, { backgroundColor: colors.brandPrimary }]}>
          <MaterialCommunityIcons name="radio-tower" size={24} color={colors.onBrandPrimary} />
        </View>
        <View style={styles.headerText}>
          <Text testID="app-title" style={[styles.title, { color: colors.onSurface }]}>
            Funk Toolbox
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
            by DJ 1 IR
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {modules.map((mod) => {
          const active = mod.enabled;
          return (
            <Pressable
              key={mod.id}
              testID={`tool-tile-${mod.id}`}
              onPress={() => onPressTile(mod)}
              style={({ pressed }) => [
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  backgroundColor: active ? colors.surfaceSecondary : colors.surfaceTertiary,
                  borderColor: active ? colors.borderStrong : colors.border,
                  borderWidth: active ? 2 : 1,
                  opacity: active ? (pressed ? 0.85 : 1) : 0.5,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: active ? colors.brandTertiary : "transparent" },
                ]}
              >
                <MaterialCommunityIcons
                  name={mod.icon}
                  size={34}
                  color={active ? colors.brandPrimary : colors.onSurfaceMuted}
                />
              </View>
              <View>
                <Text style={[styles.tileTitle, { color: colors.onSurface }]}>{mod.title}</Text>
                <Text
                  style={[
                    styles.tileSubtitle,
                    { color: active ? colors.brand : colors.onSurfaceMuted },
                  ]}
                >
                  {mod.subtitle}
                </Text>
              </View>
              {!active && (
                <View
                  style={[
                    styles.lockBadge,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <MaterialCommunityIcons name="lock-outline" size={13} color={colors.onSurfaceMuted} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: fontSize.xxl, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { fontSize: fontSize.base, marginTop: 2 },
  grid: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  tile: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { fontSize: fontSize.lg, fontWeight: "700" },
  tileSubtitle: { fontSize: fontSize.sm, marginTop: 3, fontWeight: "600" },
  lockBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
