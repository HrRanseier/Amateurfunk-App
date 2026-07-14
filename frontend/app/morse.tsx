import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { DecodeTab } from "@/src/morse/DecodeTab";
import { EncodeTab } from "@/src/morse/EncodeTab";
import { fontSize, radius, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Tab = "encode" | "decode";

export default function MorseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("encode");

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader title="Morsecode" onBack={() => router.back()} />

      <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        {(["encode", "decode"] as const).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              testID={`morse-tab-${key}`}
              onPress={() => {
                Haptics.selectionAsync();
                setTab(key);
              }}
              style={[styles.segBtn, active && { backgroundColor: colors.brandPrimary }]}
            >
              <Text
                style={[styles.segText, { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted }]}
              >
                {key === "encode" ? "Text \u2192 Morse" : "Morse \u2192 Text"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.content}>{tab === "encode" ? <EncodeTab /> : <DecodeTab />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  segment: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segText: { fontSize: fontSize.base, fontWeight: "700" },
  content: { flex: 1 },
});
