import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type FiltroStock = "todos" | "bajo" | "agotado" | "inactivos";

export interface Contadores {
  todos: number;
  bajo: number;
  agotado: number;
  inactivos: number;
}

interface Props {
  filtroActual: FiltroStock;
  onCambiar: (filtro: FiltroStock) => void;
  contadores?: Contadores; // 👈 opcional: badges con conteo
}

const OPCIONES: { key: FiltroStock; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "bajo", label: "Bajo stock" },
  { key: "agotado", label: "Agotados" },
  { key: "inactivos", label: "Inactivos" },
];

export function FiltrosInventario({ filtroActual, onCambiar, contadores }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.filterContainer}>
      {OPCIONES.map((opcion) => {
        const activo = filtroActual === opcion.key;
        const conteo = contadores?.[opcion.key];

        return (
          <TouchableOpacity
            key={opcion.key}
            style={[
              styles.chip,
              {
                borderColor: activo ? theme.primary : theme.border,
                backgroundColor: activo ? theme.primary : "transparent",
              },
            ]}
            onPress={() => onCambiar(opcion.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${opcion.label}`}
            accessibilityState={{ selected: activo }}
          >
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[
                styles.chipLabel,
                {
                  color: activo ? "#FFFFFF" : theme.textSecondary,
                  fontWeight: activo ? "700" : "500",
                },
              ]}
            >
              {opcion.label}
              {conteo !== undefined ? ` (${conteo})` : ""}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.two,
    marginBottom: Spacing.three,
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
});
