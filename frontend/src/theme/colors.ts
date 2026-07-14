// Color tokens derived from the design guidelines. Exact hex values from the
// problem statement are preserved for both light and dark system themes.

export type ThemeColors = {
  surface: string;
  onSurface: string;
  onSurfaceMuted: string;
  surfaceSecondary: string;
  onSurfaceSecondary: string;
  surfaceTertiary: string;
  onSurfaceTertiary: string;
  brand: string;
  brandPrimary: string;
  onBrandPrimary: string;
  brandTertiary: string;
  onBrandTertiary: string;
  success: string;
  warning: string;
  error: string;
  onError: string;
  border: string;
  borderStrong: string;
  divider: string;
};

export const lightColors: ThemeColors = {
  surface: "#F5F5F5",
  onSurface: "#1A1A1A",
  onSurfaceMuted: "#666666",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#333333",
  surfaceTertiary: "#E8E8E8",
  onSurfaceTertiary: "#2E7D32",
  brand: "#2E7D32",
  brandPrimary: "#2E7D32",
  onBrandPrimary: "#FFFFFF",
  brandTertiary: "#C8E6C9",
  onBrandTertiary: "#1B5E20",
  success: "#388E3C",
  warning: "#F57C00",
  error: "#D32F2F",
  onError: "#FFFFFF",
  border: "#DCDCDC",
  borderStrong: "#2E7D32",
  divider: "#E0E0E0",
};

export const darkColors: ThemeColors = {
  surface: "#121212",
  onSurface: "#F0F0F0",
  onSurfaceMuted: "#9E9E9E",
  surfaceSecondary: "#1E1E1E",
  onSurfaceSecondary: "#E0E0E0",
  surfaceTertiary: "#2C2C2C",
  onSurfaceTertiary: "#4CAF50",
  brand: "#4CAF50",
  brandPrimary: "#4CAF50",
  onBrandPrimary: "#000000",
  brandTertiary: "#1B5E20",
  onBrandTertiary: "#A5D6A7",
  success: "#4CAF50",
  warning: "#FFA000",
  error: "#F44336",
  onError: "#000000",
  border: "#2C2C2C",
  borderStrong: "#4CAF50",
  divider: "#2C2C2C",
};
