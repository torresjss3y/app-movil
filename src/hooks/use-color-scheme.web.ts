import { ColorSchemeName } from "react-native";

function getWebColorScheme(): ColorSchemeName {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useColorScheme(): ColorSchemeName {
  return getWebColorScheme();
}
