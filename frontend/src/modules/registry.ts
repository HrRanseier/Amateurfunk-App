import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

// Single source of truth for the hub grid. Add a new object here (with a matching
// screen file under /app) to introduce a new tool — no structural changes needed.
export type ToolModule = {
  id: string;
  title: string;
  icon: IconName;
  route?: string;
  enabled: boolean;
  subtitle: string;
};

export const modules: ToolModule[] = [
  {
    id: "callsign",
    title: "Rufzeichen",
    icon: "antenna",
    route: "/callsign",
    enabled: true,
    subtitle: "Callbook-Suche",
  },
  {
    id: "repeater",
    title: "Repeater",
    icon: "access-point-network",
    route: "/repeater",
    enabled: true,
    subtitle: "DACH · Umkreis",
  },
  {
    id: "bandplan",
    title: "Bandplan",
    icon: "chart-bar",
    route: "/bandplan",
    enabled: true,
    subtitle: "KW · CB · Flugfunk",
  },
  {
    id: "qcodes",
    title: "Q-Codes",
    icon: "alphabetical",
    route: "/qcodes",
    enabled: true,
    subtitle: "Codes & K\u00FCrzel",
  },
  {
    id: "morse",
    title: "Morsecode",
    icon: "keyboard-outline",
    route: "/morse",
    enabled: true,
    subtitle: "Text \u21C4 Morse",
  },
  {
    id: "antenna",
    title: "Ant-Rechner",
    icon: "calculator-variant",
    route: "/antenna",
    enabled: true,
    subtitle: "Länge \u21C4 Bänder",
  },
];
