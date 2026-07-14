import { Platform } from "react-native";

// Spacing & radius scales taken directly from design_guidelines.json.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 40,
} as const;

// Monospace family for aligning morse strings (.-.). System fonts only.
export const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
}) as string;
