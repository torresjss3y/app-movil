import { ThemedText } from "@/components/themed-text";
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
  contadores: Contadores;
}

export function FiltrosInventario({ filtroActual, onCambiar }: Props) {
  const theme = useTheme();

  const renderChip = (key: FiltroStock, label: string) => {
    const activo = filtroActual === key;
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.chip,
          {
            borderColor: activo ? theme.primary : theme.border,
            backgroundColor: activo ? theme.primary : "transparent",
          },
        ]}
        onPress={() => onCambiar(key)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Filtrar por ${label}`}
        accessibilityState={{ selected: activo }}
      >
        <ThemedText
          type="small"
          numberOfLines={1}
          style={{
            color: activo ? "#FFF" : theme.textSecondary,
            fontWeight: activo ? "700" : "500",
            fontSize: 12,
          }}
        >
          {label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.filterContainer}>
      {renderChip("todos", "Todos")}
      {renderChip("bajo", "Bajo")}
      {renderChip("agotado", "Agotado")}
      {renderChip("inactivos", "Inactivos")}
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
});
