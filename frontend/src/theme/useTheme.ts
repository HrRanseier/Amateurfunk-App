import { useContext } from "react";
import { useColorScheme } from "react-native";

import { ThemeColors, darkColors, lightColors } from "./colors";
import { DesignContext, DesignMode } from "./design";

export type Theme = {
  isDark: boolean;
  scheme: "light" | "dark";
  colors: ThemeColors;
  mode: DesignMode;
  darkbg: boolean;
};

// Follows the device system theme (Light/Dark) in "minimal" mode. In "darkbg"
// mode the dark palette is forced (white text / dark cards) so everything stays
// readable on top of the fixed dark background images.
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const { mode } = useContext(DesignContext);
  const darkbg = mode === "darkbg";
  const isDark = darkbg ? true : scheme === "dark";
  return {
    isDark,
    scheme: isDark ? "dark" : "light",
    colors: isDark ? darkColors : lightColors,
    mode,
    darkbg,
  };
}
