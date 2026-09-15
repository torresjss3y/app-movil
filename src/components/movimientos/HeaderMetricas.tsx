import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

interface Props {
  gananciaHoy: number;
  gananciaTotal: number;
}

export function HeaderMetricas({ gananciaHoy, gananciaTotal }: Props) {
  const theme = useTheme() as typeof Colors.light;

  return (
    <View style={styles.metricsRow}>
      <ThemedView style={[styles.card, { borderColor: theme.border }]}>
        <ThemedText type="small" style={styles.metricLabel}>
          Ganancias de Hoy
        </ThemedText>
        <ThemedText
          type="smallBold"
          style={[styles.successValue, { color: theme.success }]}
        >
          S/ {gananciaHoy.toFixed(2)}
        </ThemedText>
      </ThemedView>

      <ThemedView style={[styles.card, { borderColor: theme.border }]}>
        <ThemedText type="small" style={styles.metricLabel}>
          Ganancia Total
        </ThemedText>
        <ThemedText
          type="smallBold"
          style={[styles.successValue, { color: theme.success }]}
        >
          S/ {gananciaTotal.toFixed(2)}
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
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    gap: Spacing.one,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    opacity: 0.7,
  },
  successValue: {
    color: "#0E7490",
  },
});
