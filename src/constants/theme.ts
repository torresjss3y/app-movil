import "@/global.css";
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1A1F2E",
    textSecondary: "#55607A",
    textTertiary: "#8892A6",
    textInverse: "#FFFFFF",
    background: "#F7F8FA",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#DCFCE7",
    backgroundMuted: "#F1F3F7",
    card: "#FFFFFF",
    // Verde unificado (mismo tono que la lista de ventas)
    primary: "#059669",
    primaryStrong: "#047857",
    accent: "#10B981",
    success: "#059669",
    successBackground: "#ECFDF5",
    // Color de datos (métricas): azul/índigo, distinto del verde de acciones
    data: "#2563EB",
    dataAlt: "#7C3AED",
    warning: "#B45309",
    warningBackground: "#FEF3C7",
    danger: "#BE123C",
    dangerBackground: "#FFE4E6",
    border: "#E4E7EC",
    divider: "#EEF0F4",
    input: "#FFFFFF",
    tabInactive: "#737B8C",
    switchTrack: "#CBD1DC",
  },

  dark: {
    text: "#EEF2F7",
    textSecondary: "#A0ACC2",
    textTertiary: "#6E7A8F",
    textInverse: "#0F1420",
    background: "#0C1117",
    backgroundElement: "#151B24",
    backgroundSelected: "#133024",
    backgroundMuted: "#10161E",
    card: "#151B24",
    // Verde unificado (mismo tono que la lista de ventas, aclarado para dark)
    primary: "#34D399",
    primaryStrong: "#6EE7B7",
    accent: "#10B981",
    success: "#34D399",
    successBackground: "#0C2F24",
    // Color de datos (métricas): azul/índigo, distinto del verde de acciones
    data: "#60A5FA",
    dataAlt: "#A78BFA",
    warning: "#FBBF24",
    warningBackground: "#3A2A0A",
    danger: "#FB7185",
    dangerBackground: "#3A1419",
    border: "#243041",
    divider: "#1B2532",
    input: "#151B24",
    tabInactive: "#7E8A9E",
    switchTrack: "#374254",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

// Altura mínima compartida por las filas de listado (Ventas, Inventario, Movimientos)
// para que todos los contenedores tengan el mismo tamaño y se vean consistentes.
export const ListItemHeight = 68;

export const MaxContentWidth = 800;
