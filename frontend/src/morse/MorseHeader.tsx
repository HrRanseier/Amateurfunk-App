import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Props = {
  title: string;
  listening: boolean;
  onBack: () => void;
  onToggleMic: () => void;
  onOpenSettings: () => void;
};

// Fixed chat-style header: back + title + microphone (start/stop receive, green
// pulsing when active) + settings gear.
export function MorseHeader({ title, listening, onBack, onToggleMic, onOpenSettings }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (listening) {
      pulse.setValue(0);
      loop = Animated.loop(
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      );
      loop.start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
    return () => loop?.stop();
  }, [listening, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

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
      <Pressable testID="header-back-button" onPress={onBack} hitSlop={12} style={styles.iconBtn}>
        <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
      </Pressable>

      <Text testID="header-title" numberOfLines={1} style={[styles.title, { color: colors.onSurface }]}>
        {title}
      </Text>

      <View style={styles.actions}>
        <View style={styles.micWrap}>
          {listening && (
            <Animated.View
              style={[
                styles.ring,
                { backgroundColor: colors.brandPrimary, transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
          )}
          <Pressable
            testID="header-mic-button"
            onPress={onToggleMic}
            style={[
              styles.micBtn,
              {
                backgroundColor: listening ? colors.brandPrimary : colors.surfaceTertiary,
                borderColor: listening ? colors.brandPrimary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={listening ? "microphone" : "microphone-outline"}
              size={22}
              color={listening ? colors.onBrandPrimary : colors.onSurfaceMuted}
            />
          </Pressable>
        </View>

        <Pressable testID="header-settings-button" onPress={onOpenSettings} hitSlop={8} style={styles.iconBtn}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>
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
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: "700", letterSpacing: 0.3, marginHorizontal: spacing.xs },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  micWrap: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 40, height: 40, borderRadius: radius.pill },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
