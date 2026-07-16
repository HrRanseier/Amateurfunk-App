import { ViewStyle } from "react-native";

// Tablet responsiveness: cap the width of text/form areas and centre them on
// wide screens instead of stretching to full width.
export const MAX_CONTENT_WIDTH = 600;
export const MAX_GRID_WIDTH = 760;

export const centered: ViewStyle = {
  width: "100%",
  maxWidth: MAX_CONTENT_WIDTH,
  alignSelf: "center",
};

// Semi-transparent dark chip behind free-standing hint/source/disclaimer texts
// so they stay readable over the bright circuit symbols of the backgrounds.
export function overlayChip(darkbg: boolean): ViewStyle | null {
  return darkbg
    ? {
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        overflow: "hidden",
      }
    : null;
}
