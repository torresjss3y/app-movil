import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleProp, StyleSheet, Switch, TouchableOpacity, View, ViewStyle } from "react-native";
import Dialog from "react-native-dialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useThemeMode } from "@/contexts/theme-context";
import { exportarRespaldo, importarRespaldo } from "@/database/backupService";
import { useTheme } from "@/hooks/use-theme";

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: 0,
  };
  const theme = useTheme();
  const { resolvedTheme, toggleDarkMode } = useThemeMode();

  // Estado de la sección de datos
  const [respaldando, setRespaldando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [confirmarRestaurarVisible, setConfirmarRestaurarVisible] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; titulo: string; mensaje: string; tipo: "ok" | "error" }>({
    visible: false,
    titulo: "",
    mensaje: "",
    tipo: "ok",
  });

  const avisar = (titulo: string, mensaje: string, tipo: "ok" | "error" = "ok") => setDialog({ visible: true, titulo, mensaje, tipo });

  const handleRespaldar = async () => {
    try {
      setRespaldando(true);
      const resultado = await exportarRespaldo();
      avisar(resultado.ok ? "Respaldo creado" : "Error", resultado.mensaje, resultado.ok ? "ok" : "error");
    } finally {
      setRespaldando(false);
    }
  };

  const handleRestaurar = async () => {
    setConfirmarRestaurarVisible(false);
    try {
      setRestaurando(true);
      const resultado = await importarRespaldo();
      if (resultado.ok) {
        avisar("Restauración completada", resultado.mensaje, "ok");
      } else if (resultado.mensaje !== "Importación cancelada.") {
        avisar("Error", resultado.mensaje, "error");
      }
    } finally {
      setRestaurando(false);
    }
  };

  const contentPlatformStyle: StyleProp<ViewStyle> = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    ios: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]} contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerContainer}>
          <ThemedText type="subtitle">Ajustes</ThemedText>
          <ThemedText style={styles.subtitleText} themeColor="textSecondary">
            Configura las preferencias de la aplicación
          </ThemedText>
        </ThemedView>

        <View style={styles.sectionsWrapper}>
          <ThemedView style={[styles.settingCard, { borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <ThemedText type="smallBold">Modo Oscuro</ThemedText>
              <ThemedText type="small" style={styles.settingDescription}>
                Cambia el tema de la interfaz entre claro y oscuro
              </ThemedText>
            </View>
            <Switch
              trackColor={{
                false: theme.switchTrack,
                true: theme.primaryStrong,
              }}
              thumbColor={theme.backgroundElement}
              ios_backgroundColor={theme.switchTrack}
              onValueChange={toggleDarkMode}
              value={resolvedTheme === "dark"}
            />
          </ThemedView>

          {/* --- Sección: Datos --- */}
          <ThemedView style={[styles.settingCard, styles.dataCard, { borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <ThemedText type="smallBold">Respaldo de datos</ThemedText>
              <ThemedText type="small" style={styles.settingDescription}>
                Exporta o restaura toda tu base de datos (productos, movimientos y ventas).
              </ThemedText>
            </View>

            <View style={styles.dataButtonsRow}>
              <TouchableOpacity
                style={[styles.dataButton, { borderColor: theme.border, opacity: respaldando ? 0.6 : 1 }]}
                onPress={handleRespaldar}
                disabled={respaldando || restaurando}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Exportar "
              >
                {respaldando ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="cloud-upload-outline" size={18} color={theme.primary} />}
                <ThemedText type="smallBold" style={{ color: theme.primary, marginLeft: 6 }}>
                  {respaldando ? "Generando..." : "Exportar "}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dataButton, { borderColor: theme.border, opacity: restaurando ? 0.6 : 1 }]}
                onPress={() => setConfirmarRestaurarVisible(true)}
                disabled={respaldando || restaurando}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Restaurar respaldo de la base de datos"
              >
                {restaurando ? <ActivityIndicator size="small" color={theme.warning} /> : <Ionicons name="cloud-download-outline" size={18} color={theme.warning} />}
                <ThemedText type="smallBold" style={{ color: theme.warning, marginLeft: 6 }}>
                  {restaurando ? "Restaurando..." : "Restaurar "}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>

        {Platform.OS === "web" && <WebBadge />}
      </ThemedView>

      {/* Confirmación de restauración */}
      <Dialog.Container visible={confirmarRestaurarVisible} onBackdropPress={() => setConfirmarRestaurarVisible(false)} contentStyle={{ backgroundColor: theme.card, borderRadius: 16 }}>
        <Dialog.Title style={{ color: theme.text }}>Restaurar respaldo</Dialog.Title>
        <Dialog.Description style={{ color: theme.textSecondary }}>Se reemplazarán TODOS los datos actuales por los del respaldo elegido. Esta acción no se puede deshacer. Recomendamos exportar un respaldo antes de continuar.</Dialog.Description>
        <Dialog.Button label="Cancelar" color={theme.textSecondary} onPress={() => setConfirmarRestaurarVisible(false)} />
        <Dialog.Button label="Elegir archivo" color={theme.warning} onPress={handleRestaurar} />
      </Dialog.Container>

      {/* Aviso de resultado */}
      <Dialog.Container visible={dialog.visible} onBackdropPress={() => setDialog((d) => ({ ...d, visible: false }))} contentStyle={{ backgroundColor: theme.card, borderRadius: 16 }}>
        <Dialog.Title style={{ color: theme.text }}>{dialog.titulo}</Dialog.Title>
        <Dialog.Description style={{ color: theme.textSecondary }}>{dialog.mensaje}</Dialog.Description>
        <Dialog.Button label="OK" color={dialog.tipo === "error" ? theme.danger : theme.primary} onPress={() => setDialog((d) => ({ ...d, visible: false }))} />
      </Dialog.Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  headerContainer: {
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  subtitleText: {
    opacity: 0.7,
  },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  settingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  dataCard: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: Spacing.three,
  },
  dataButtonsRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  dataButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.two,
    gap: 2,
  },
  settingDescription: {
    opacity: 0.6,
  },
});
