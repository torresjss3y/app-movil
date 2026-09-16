import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  totalActivos: number;
  onAgregar: () => void;
}

export function HeaderInventario({ totalActivos, onAgregar }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View>
        <ThemedText type="title" style={styles.title}>
          Inventario
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
          {totalActivos} productos activos
        </ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: theme.primary }]}
        onPress={onAgregar}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Agregar producto"
      >
        <ThemedText style={styles.iconButtonText}>+</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "700" },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  iconButtonText: {
    color: "#FFF",
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "300",
  },
});
