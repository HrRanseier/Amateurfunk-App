import { useColorScheme } from "react-native";

import { ThemeColors, darkColors, lightColors } from "./colors";

export type Theme = {
  isDark: boolean;
  scheme: "light" | "dark";
  colors: ThemeColors;
};

// Reactive to the device system theme (Light/Dark). No manual toggle — the app
// follows the OS setting automatically via useColorScheme.
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return {
    isDark,
    scheme: isDark ? "dark" : "light",
    colors: isDark ? darkColors : lightColors,
  };
}
