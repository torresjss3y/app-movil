import "@/global.css";
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#12312F",
    textSecondary: "#4D6B68",
    textTertiary: "#78908D",
    textInverse: "#FFFFFF",
    background: "#F4F9F8",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#DDF3EF",
    backgroundMuted: "#EAF3F1",
    card: "#FFFFFF",
    primary: "#0F766E",
    primaryStrong: "#115E59",
    accent: "#14B8A6",
    success: "#0F766E",
    successBackground: "#DDF3EF",
    warning: "#B45309",
    warningBackground: "#FEF3C7",
    danger: "#BE123C",
    dangerBackground: "#FFE4E6",
    border: "#C9DEDA",
    divider: "#DCEBE8",
    input: "#FFFFFF",
    tabInactive: "#4D6B68",
    switchTrack: "#B8D0CC",
  },

  dark: {
    // Texto / Tipografía
    text: "#E7F5F2",
    textSecondary: "#A6C2BD",
    textTertiary: "#78908D",
    textInverse: "#08201E",

    // Fondos y Contenedores
    background: "#08201E",
    backgroundElement: "#12312F",
    backgroundSelected: "#194C47",
    backgroundMuted: "#0D2926",
    card: "#12312F",

    // Colores Primarios y Acentos
    primary: "#2DD4BF",
    primaryStrong: "#5EEAD4",
    accent: "#14B8A6",

    // Estados de Feedback
    success: "#2DD4BF",
    successBackground: "#194C47",
    warning: "#FBBF24",
    warningBackground: "#633B08",
    danger: "#FB7185",
    dangerBackground: "#64152A",

    // Bordes y Divisores
    border: "#285A55",
    divider: "#194C47",
    input: "#12312F",
    tabInactive: "#8BA9A4",
    switchTrack: "#285A55",
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

export const MaxContentWidth = 800;
