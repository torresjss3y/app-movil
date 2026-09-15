import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import {
  ItemLoteUI,
  LoteUI,
  obtenerItemsDeLote,
} from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { useMemo } from "react";

interface Props {
  visible: boolean;
  lote: LoteUI | null;
  onClose: () => void;
}

export function DetalleMovimientoModal({ visible, lote, onClose }: Props) {
  const theme = useTheme() as typeof Colors.light;

  // ✅ Calcular los items DURANTE el render, no en un useEffect.
  // useMemo los recalcula solo cuando cambia el lote.
  const items: ItemLoteUI[] = useMemo(() => {
    if (!lote) return [];
    return obtenerItemsDeLote(lote.id);
  }, [lote]);

  if (!lote) return null;

  const colorTipo =
    lote.tipo === "entrada"
      ? theme.success
      : lote.tipo === "salida"
        ? theme.danger
        : theme.warning;

  const signo =
    lote.tipo === "entrada" ? "+" : lote.tipo === "salida" ? "-" : "";

  const emoji =
    lote.tipo === "entrada" ? "➕" : lote.tipo === "salida" ? "➖" : "⚖️";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          {/* Cabecera */}
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <ThemedText style={{ fontSize: 16 }}>{emoji}</ThemedText>
                <ThemedText type="smallBold" style={styles.titulo}>
                  {lote.motivo.replace("_", " ").toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.subtitulo}>
                {lote.fecha}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <ThemedText type="small" style={{ opacity: 0.6, fontSize: 16 }}>
                ✕
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Nota */}
          {lote.nota ? (
            <View
              style={[
                styles.notaBox,
                { backgroundColor: theme.input, borderColor: theme.border },
              ]}
            >
              <ThemedText type="small" style={styles.notaText}>
                📝 {lote.nota}
              </ThemedText>
            </View>
          ) : null}

          {/* Lista de productos del lote */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <ThemedText type="small" style={styles.sectionLabel}>
              PRODUCTOS ({items.length})
            </ThemedText>

            {items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.productoRow,
                  { borderBottomColor: theme.border },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {item.producto_nombre}
                  </ThemedText>
                </View>
                <ThemedText
                  type="smallBold"
                  style={[styles.cantidad, { color: colorTipo }]}
                >
                  {signo}
                  {item.cantidad}
                </ThemedText>
              </View>
            ))}
          </ScrollView>

          {/* Footer con total */}
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Total: {lote.total_productos} producto
              {lote.total_productos !== 1 ? "s" : ""}
            </ThemedText>
            <ThemedText
              type="smallBold"
              style={{ color: colorTipo, fontSize: 16 }}
            >
              {signo}
              {lote.total_unidades} u.
            </ThemedText>
          </View>

          {/* Botón Cerrar */}
          <TouchableOpacity
            style={[styles.btnCerrar, { backgroundColor: theme.card }]}
            onPress={onClose}
          >
            <ThemedText type="smallBold" style={styles.btnCerrarText}>
              Cerrar
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titulo: { fontSize: 15 },
  subtitulo: { opacity: 0.6, fontSize: 11, marginTop: 2 },
  notaBox: {
    marginTop: Spacing.two,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  notaText: { opacity: 0.85, fontSize: 12, fontStyle: "italic" },
  scroll: {
    marginTop: Spacing.two,
    maxHeight: 320,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.55,
    marginBottom: 6,
  },
  productoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cantidad: { fontSize: 15 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
    borderTopWidth: 1,
  },
  btnCerrar: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCerrarText: { fontSize: 13 },
});
