import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Movimiento } from "@/types/moviminetos";

interface Props {
  visible: boolean;
  movimiento: Movimiento | null;
  onClose: () => void;
}

export function DetalleMovimientoModal({
  visible,
  movimiento,
  onClose,
}: Props) {
  const theme = useTheme() as typeof Colors.light;

  if (!movimiento) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
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
            <ThemedText type="smallBold" style={styles.titulo}>
              {movimiento.ticket}
            </ThemedText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <ThemedText type="small" style={{ opacity: 0.6, fontSize: 16 }}>
                ✕
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Metadatos */}
          <View style={[styles.metaList, { borderBottomColor: theme.border }]}>
            <ThemedText type="small" style={styles.metaItem}>
              • Hora: {movimiento.hora}
            </ThemedText>
            {movimiento.modoPago ? (
              <ThemedText type="small" style={styles.metaItem}>
                • Modo de pago: {movimiento.modoPago}
              </ThemedText>
            ) : null}
          </View>

          {/* CONTENEDOR CON LÍMITE (View) + SCROLLVIEW INTERNO */}
          <View style={styles.scrollWrapper}>
            <ScrollView
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContentContainer}
            >
              {movimiento.productos.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.productoRow,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {item.nombre}
                    </ThemedText>
                    <ThemedText type="small" style={styles.codeText}>
                      {item.cantidad}{" "}
                      {item.cantidad === 1 ? "unidad" : "unidades"} × $
                      {item.precio.toFixed(2)}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ color: theme.success }}>
                    ${item.subtotal.toFixed(2)}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Total Fijo */}
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <ThemedText type="smallBold">Total:</ThemedText>
            <ThemedText
              type="smallBold"
              style={{ color: theme.success, fontSize: 16 }}
            >
              {movimiento.monto}
            </ThemedText>
          </View>

          {/* Botón Cerrar */}
          <TouchableOpacity
            style={[
              styles.btnCerrar,
              { backgroundColor: theme.card || "#27272a" },
            ]}
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
    maxWidth: 380,
    maxHeight: "85%",
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },

  /* CLAVE: El View exterior es el que tiene maxHeight y overflow hidden */
  scrollWrapper: {
    maxHeight: 280,
    overflow: "hidden",
    marginVertical: Spacing.one,
  },

  /* CLAVE: Quitamos flexGrow: 0 para que el ScrollView mida su altura real y permita el desplazamiento */
  scrollContentContainer: {
    paddingBottom: 12,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  titulo: {
    fontSize: 15,
  },
  metaList: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: 3,
  },
  metaItem: {
    opacity: 0.75,
  },
  productoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  codeText: {
    opacity: 0.6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
    borderTopWidth: 1,
  },
  btnCerrar: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCerrarText: {
    fontSize: 13,
  },
});
