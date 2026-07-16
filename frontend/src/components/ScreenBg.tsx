import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { BACKGROUNDS } from "@/src/theme/backgrounds";
import { useTheme } from "@/src/theme/useTheme";

// Absolute-fill background layer placed as the first child of a screen root.
// In "darkbg" mode it renders the module's dark image (cover). In "minimal"
// mode it renders a plain surface-coloured fill, so the layout is unchanged.
export function ScreenBg({ bg }: { bg: number }) {
  const { colors, darkbg } = useTheme();
  if (darkbg) {
    return (
      <Image
        source={BACKGROUNDS[bg]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        pointerEvents="none"
      />
    );
  }
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />;
}
