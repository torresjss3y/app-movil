import { ColorSchemeName } from "react-native";

/**
 * Función auxiliar para leer de forma segura el tema en la web sin romper SSR
 */
function getWebColorScheme(): ColorSchemeName {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Hook de detección de tema para entorno Web (sin setState en useEffect).
 */
export function useColorScheme(): ColorSchemeName {
  return getWebColorScheme();
}
