import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { eliminarProducto, ProductoDB } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import {
  Alert,
  AlertButton,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  producto: ProductoDB;
  onRefresh: () => void;
  onEditar: (producto: ProductoDB) => void;
}

export const ItemProducto = memo(function ItemProducto({
  producto,
  onRefresh,
  onEditar,
}: Props) {
  const theme = useTheme();
  const sinStock = producto.stock === 0;
  const stockMinimo = producto.stock_minimo ?? 2;

  const confirmarEliminacionDefinitiva = () => {
    Alert.alert(
      "¿Eliminar Definitivamente?",
      `Se eliminará "${producto.nombre}" por completo. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: () => {
            if (eliminarProducto(producto.id)) {
              Alert.alert("Eliminado", "Producto eliminado por completo.");
              onRefresh();
            } else {
              Alert.alert(
                "Error",
                "No se pudo eliminar. Si tiene ventas registradas, desactívalo en su lugar.",
              );
            }
          },
        },
      ],
    );
  };

  const mostrarOpciones = () => {
    const opciones: AlertButton[] = [
      { text: "Cancelar", style: "cancel" },
      { text: "Editar", onPress: () => onEditar(producto) },
      {
        text: "Eliminar producto",
        style: "destructive",
        onPress: confirmarEliminacionDefinitiva,
      },
    ];

    Alert.alert("Opciones", `"${producto.nombre}"`, opciones, {
      cancelable: true,
    });
  };

  const colorStock = sinStock
    ? theme.danger
    : producto.stock <= stockMinimo
      ? theme.warning
      : theme.success;

  const bgStock = sinStock
    ? theme.danger + "22"
    : producto.stock <= stockMinimo
      ? theme.warning + "22"
      : theme.success + "22";

  return (
    <ThemedView
      style={[
        styles.card,
        {
          borderColor: theme.border,
          backgroundColor: theme.card,
          opacity: sinStock ? 0.5 : 1,
        },
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: colorStock }]} />

      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.nameRow}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {producto.nombre}
            </ThemedText>
            {sinStock && (
              <View
                style={[styles.badge, { backgroundColor: theme.danger + "22" }]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: theme.danger,
                    fontSize: 10,
                    fontWeight: "600",
                  }}
                >
                  SIN STOCK
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText
            type="small"
            numberOfLines={1}
            style={[styles.sub, { color: theme.textSecondary }]}
          >
            {producto.marca || "Sin marca"}
            {producto.talla ? ` · Talla ${producto.talla}` : ""}
          </ThemedText>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.priceStock}>
            <ThemedText type="smallBold" style={styles.price}>
              S/ {producto.precio_venta.toFixed(2)}
            </ThemedText>
            <View style={[styles.stockBadge, { backgroundColor: bgStock }]}>
              <ThemedText
                type="small"
                style={{
                  color: colorStock,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {sinStock ? "AGOTADO" : `${producto.stock} u.`}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.optionsBtn,
              { borderColor: theme.border, backgroundColor: theme.input },
            ]}
            onPress={mostrarOpciones}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Opciones para ${producto.nombre}`}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "stretch",
  },
  stripe: { width: 4 },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    gap: 8,
  },
  cardLeft: { flex: 1, gap: 2 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: { flexShrink: 1, fontSize: 14 },
  sub: { fontSize: 11 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceStock: {
    alignItems: "flex-end",
    gap: 4,
  },
  price: { fontSize: 13 },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  optionsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
