import { ImageSourcePropType } from "react-native";

// Dark background images used when design mode === "darkbg".
// Mapping (per requirement):
//   1 -> Hub + Settings        5 -> Q-Codes
//   2 -> Rufzeichen            6 -> Morsecode
//   3 -> Repeater-Finder       7 -> Antennenrechner
//   4 -> Bandplan main area    8 -> CB-Funk + Flugfunk sub-areas
export const BACKGROUNDS: Record<number, ImageSourcePropType> = {
  1: require("../../assets/backgrounds/1.png"),
  2: require("../../assets/backgrounds/2.png"),
  3: require("../../assets/backgrounds/3.png"),
  4: require("../../assets/backgrounds/4.png"),
  5: require("../../assets/backgrounds/5.png"),
  6: require("../../assets/backgrounds/6.png"),
  7: require("../../assets/backgrounds/7.png"),
  8: require("../../assets/backgrounds/8.png"),
};
