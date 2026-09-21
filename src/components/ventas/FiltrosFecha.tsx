import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { RangoFecha } from "@/database/ventaService";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  rangoActual: RangoFecha;
  onCambiar: (rango: RangoFecha) => void;
}

const OPCIONES: { key: RangoFecha; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes", label: "30 días" },
  { key: "todo", label: "Todo" },
];

export function FiltrosFecha({ rangoActual, onCambiar }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.chipsRow}>
      {OPCIONES.map((opcion) => {
        const activo = rangoActual === opcion.key;
        return (
          <TouchableOpacity
            key={opcion.key}
            onPress={() => onCambiar(opcion.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar ventas por ${opcion.label}`}
            accessibilityState={{ selected: activo }}
            style={[
              styles.chip,
              {
                borderColor: activo ? theme.primary : theme.border,
                backgroundColor: activo ? theme.primary : "transparent",
              },
            ]}
          >
            <ThemedText type="small" numberOfLines={1} style={[styles.chipLabel, { color: activo ? "#FFFFFF" : theme.textSecondary, fontWeight: activo ? "700" : "500" }]}>
              {opcion.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface ResumenProps {
  totalVendido: number;
  totalGanancia: number;
  totalVentas: number;
  totalUnidades: number;
}

export function ResumenVentas({ totalVendido, totalGanancia, totalVentas, totalUnidades }: ResumenProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.resumenCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={styles.resumenRow}>
        <Fila etiqueta="Total vendido" valor={`S/ ${totalVendido.toFixed(2)}`} color={theme.data} />
        <Fila etiqueta="Ganancia est." valor={`S/ ${totalGanancia.toFixed(2)}`} color={theme.dataAlt} />
      </View>
      <View style={[styles.resumenDivider, { backgroundColor: theme.divider }]} />
      <View style={styles.resumenRow}>
        <Fila etiqueta="Ventas" valor={String(totalVentas)} color={theme.text} />
        <Fila etiqueta="Unidades" valor={String(totalUnidades)} color={theme.text} />
      </View>
    </ThemedView>
  );
}

function Fila({ etiqueta, valor, color }: { etiqueta: string; valor: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.fila}>
      <ThemedText type="small" style={[styles.filaLabel, { color: theme.textSecondary }]}>
        {etiqueta}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color }}>
        {valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  resumenCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  resumenRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  resumenDivider: {
    height: StyleSheet.hairlineWidth,
  },
  fila: {
    flex: 1,
    gap: 2,
  },
  filaLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
