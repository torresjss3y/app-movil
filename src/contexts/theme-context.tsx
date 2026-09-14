import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

export type ThemeName = "light" | "dark";
type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  themeMode: ThemeMode; // preferencia del usuario
  resolvedTheme: ThemeName; // tema efectivo
  setThemeMode: (mode: ThemeMode) => void;
  toggleDarkMode: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "app-theme-mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme: ThemeName =
    useRNColorScheme() === "dark" ? "dark" : "light";
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  // Cargar preferencia guardada
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setThemeModeState(saved);
        }
      } catch {
        // Mantiene el tema del sistema si el almacenamiento no está disponible.
      }
    };

    loadThemeMode();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  const resolvedTheme = themeMode === "system" ? systemScheme : themeMode;

  const toggleDarkMode = (value: boolean) => {
    setThemeMode(value ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, resolvedTheme, setThemeMode, toggleDarkMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode debe usarse dentro de ThemeProvider");
  return ctx;
}
