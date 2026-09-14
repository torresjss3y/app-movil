import "@/global.css";
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#132238",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",
    textInverse: "#FFFFFF",
    background: "#F6F7FB",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#DBEAFE",
    backgroundMuted: "#F1F5F9",
    card: "#FFFFFF",
    primary: "#2563EB",
    primaryStrong: "#1D4ED8",
    accent: "#2563EB",
    success: "#0E7490",
    successBackground: "#CCFBF1",
    warning: "#D97706",
    warningBackground: "#FEF3C7",
    danger: "#DC2626",
    dangerBackground: "#FEE2E2",
    border: "#D9E0EA",
    divider: "#E7EBF2",
    input: "#FFFFFF",
    tabInactive: "#64748B",
    switchTrack: "#CBD5E1",
  },

  dark: {
    text: "#F8FAFC",
    textSecondary: "#9CA3AF",
    textTertiary: "#64748B",
    textInverse: "#111827",
    background: "#111827",
    backgroundElement: "#1F2937",
    backgroundSelected: "#374151",
    backgroundMuted: "#273244",
    card: "#1F2937",
    primary: "#F59E0B",
    primaryStrong: "#D97706",
    accent: "#F59E0B", 
    success: "#60A5FA",
    successBackground: "#172554",
    warning: "#F59E0B",
    warningBackground: "#78350F",
    danger: "#FB7185",
    dangerBackground: "#4C0519",
    border: "#374151",
    divider: "#273244",
    input: "#172033",
    tabInactive: "#9CA3AF",
    switchTrack: "#4B5563",
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
