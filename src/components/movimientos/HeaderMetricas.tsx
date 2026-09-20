import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { MetricasResumen } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

interface Props {
  metricas: MetricasResumen;
}

export function HeaderMetricas({ metricas }: Props) {
  const theme = useTheme() as typeof Colors.light;

  const etiquetaProductos = metricas.totalProductos === 1 ? "1 producto" : `${metricas.totalProductos} productos`;

  const etiquetaUnidades = metricas.unidadesVendidasHoy === 1 ? "1 unidad vendida" : `${metricas.unidadesVendidasHoy} unidades vendidas`;

  return (
    <View style={styles.metricsRow}>
      {/* Tarjeta 1: Ganancia de hoy */}
      <ThemedView style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <ThemedText type="small" style={[styles.metricLabel, { color: theme.textSecondary }]}>
          Ganancia hoy
        </ThemedText>
        <ThemedText type="smallBold" style={[styles.metricValue, { color: theme.success }]}>
          S/ {metricas.gananciaHoy.toFixed(2)}
        </ThemedText>
        <ThemedText type="small" style={[styles.subLabel, { color: theme.textSecondary }]}>
          {etiquetaUnidades}
        </ThemedText>
      </ThemedView>

      {/* Tarjeta 2: Inventario */}
      <ThemedView style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <ThemedText type="small" style={[styles.metricLabel, { color: theme.textSecondary }]}>
          Inventario
        </ThemedText>
        <ThemedText type="smallBold" style={[styles.metricValue, { color: theme.primary }]}>
          S/ {metricas.valorInventarioVenta.toFixed(2)}
        </ThemedText>
        <ThemedText type="small" style={[styles.subLabel, { color: theme.textSecondary }]}>
          {etiquetaProductos}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  card: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 20,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  subLabel: {
    fontSize: 10,
    opacity: 0.75,
    marginTop: 2,
  },
});
