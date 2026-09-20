import { DarkTheme, DefaultTheme, ThemeProvider as RouterThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppTabs } from "@/components/app-tabs";
import { ThemeProvider, useThemeMode } from "@/contexts/theme-context";
import { initDB } from "@/database/db";
import { limpiarLotesHuerfanos, verificarContenidoDB, verificarEstructuraDB } from "@/database/productosService";

// Prevenimos el auto-hide de forma segura
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignorar errores si ya estaba prevenido */
});

export default function TabLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Inicializa la BD SQLite
        initDB();
        limpiarLotesHuerfanos();
        verificarEstructuraDB();
        verificarContenidoDB();
      } catch (e) {
        console.warn("Error al inicializar:", e);
      } finally {
        // 2. Marcamos como listo una vez montado
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  // Evitamos renderizar la navegación hasta que el layout esté 100% montado
  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationTheme />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function NavigationTheme() {
  const { resolvedTheme } = useThemeMode();

  return (
    <RouterThemeProvider value={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar hidden={false} style={resolvedTheme === "dark" ? "light" : "dark"} />
      <AnimatedSplashOverlay />
      <AppTabs />
    </RouterThemeProvider>
  );
}
