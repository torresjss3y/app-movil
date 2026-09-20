import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  totalActivos: number;
  onAgregar: () => void;
}

export function HeaderInventario({ totalActivos, onAgregar }: Props) {
  const theme = useTheme();

  const etiquetaProductos = totalActivos === 1 ? "1 producto activo" : `${totalActivos} productos activos`;

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <ThemedText type="title" style={styles.title}>
          Inventario
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
          {etiquetaProductos}
        </ThemedText>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onAgregar} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Agregar producto">
        <ThemedText style={styles.buttonText}>Nuevo producto</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  titleBlock: {
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  button: {
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
