import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { VentaCompleta, generarTextoBoleta } from "@/database/ventaService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Share, StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  venta: VentaCompleta | null;
  onClose: () => void;
}

export function TicketVenta({ visible, venta, onClose }: Props) {
  const theme = useTheme();
  const [compartiendo, setCompartiendo] = useState(false);

  if (!venta) return null;

  const compartir = async () => {
    try {
      setCompartiendo(true);
      await Share.share({ message: generarTextoBoleta(venta), title: `Venta ${venta.id}` });
    } finally {
      setCompartiendo(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: theme.success + "22" }]}>
              <Ionicons name="checkmark" size={22} color={theme.success} />
            </View>
            <View style={styles.headerInfo}>
              <ThemedText type="smallBold">Venta registrada</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {venta.id} · {venta.fecha}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar ticket">
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {venta.items.map((item) => (
              <View key={item.id} style={[styles.item, { borderBottomColor: theme.divider }]}>
                <View style={styles.itemInfo}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {item.producto_nombre}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {item.cantidad} x S/ {item.precio_venta_unitario.toFixed(2)}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">S/ {item.subtotal.toFixed(2)}</ThemedText>
              </View>
            ))}

            <View style={styles.totalRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {venta.total_unidades} unidades · {venta.metodo_pago}
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.success }}>
                S/ {venta.total.toFixed(2)}
              </ThemedText>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancel, { borderColor: theme.border }]} onPress={onClose}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Cerrar</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={compartir} disabled={compartiendo}>
              <Ionicons name="share-outline" size={17} color="#FFFFFF" />
              <ThemedText type="smallBold" style={{ color: "#FFFFFF", marginLeft: 6 }}>
                {compartiendo ? "Compartiendo..." : "Compartir"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.55)", justifyContent: "center", padding: Spacing.three },
  modal: { width: "100%", maxWidth: 420, maxHeight: "85%", alignSelf: "center", borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1, minWidth: 0, gap: 2 },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: Spacing.two },
  item: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.two },
  itemInfo: { flex: 1, minWidth: 0, gap: 2 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: Spacing.two },
  actions: { flexDirection: "row", gap: Spacing.two },
  button: { flex: 1, minHeight: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  cancel: { borderWidth: 1 },
});
