import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSize, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

// Shared module header with back arrow. In "darkbg" mode it drops the solid bar
// for a soft top-down dark gradient (the images are brightest exactly here),
// keeping the back arrow + title readable in white.
export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const { colors, darkbg } = useTheme();
  const insets = useSafeAreaInsets();
  const fg = darkbg ? "#FFFFFF" : colors.onSurface;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.sm },
        darkbg
          ? styles.transparent
          : { backgroundColor: colors.surface, borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      {darkbg && (
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {onBack ? (
        <Pressable testID="header-back-button" onPress={onBack} hitSlop={12} style={styles.side}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={fg} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text testID="header-title" style={[styles.title, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
  },
  transparent: { backgroundColor: "transparent" },
  side: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.xl,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
