import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSize, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

// Shared module header with back arrow. Reused by every tool so new modules
// slot in seamlessly with a consistent navigation structure.
export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: colors.surface,
          borderBottomColor: colors.divider,
        },
      ]}
    >
      {onBack ? (
        <Pressable testID="header-back-button" onPress={onBack} hitSlop={12} style={styles.side}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text testID="header-title" style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
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
