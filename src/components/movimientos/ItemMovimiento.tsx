import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { LoteUI } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  lote: LoteUI;
  onPress: () => void;
}

export function ItemMovimiento({ lote, onPress }: Props) {
  const theme = useTheme() as typeof Colors.light;

  const colorTipo =
    lote.tipo === "entrada"
      ? theme.success
      : lote.tipo === "salida"
        ? theme.danger
        : theme.warning;

  const signo =
    lote.tipo === "entrada" ? "+" : lote.tipo === "salida" ? "-" : "";

  const emoji =
    lote.tipo === "entrada" ? "" : lote.tipo === "salida" ? "" : "";

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <ThemedView style={[styles.card, { borderColor: theme.border }]}>
        {/* Franja lateral de color */}
        <View style={[styles.stripe, { backgroundColor: colorTipo }]} />

        <View style={styles.content}>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <ThemedText style={{ fontSize: 14 }}>{emoji}</ThemedText>
              <ThemedText type="smallBold" numberOfLines={1}>
                {lote.motivo.replace("_", " ")}
              </ThemedText>
            </View>
            <ThemedText type="small" style={styles.sub}>
              {lote.fecha}
            </ThemedText>
            <ThemedText type="small" style={styles.sub}>
              {lote.total_productos} producto
              {lote.total_productos !== 1 ? "s" : ""}
              {lote.nota ? ` · ${lote.nota}` : ""}
            </ThemedText>
          </View>

          <View style={styles.details}>
            <ThemedText
              type="smallBold"
              style={[styles.cantidad, { color: colorTipo }]}
            >
              {signo}
              {lote.total_unidades}
            </ThemedText>
            <ThemedText type="small" style={styles.tipo}>
              {lote.tipo}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "stretch",
  },
  stripe: { width: 4 },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.three,
    gap: 8,
  },
  info: { gap: 2, flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sub: { opacity: 0.6, fontSize: 11 },
  details: { alignItems: "flex-end", gap: 2 },
  cantidad: { fontSize: 16 },
  tipo: {
    opacity: 0.6,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "600",
  },
});
