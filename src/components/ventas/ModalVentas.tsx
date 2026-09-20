import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { obtenerProductoPorCodigo, ProductoDB } from "@/database/productosService";
import { ItemVenta, registrarVenta } from "@/database/ventaService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import Dialog from "react-native-dialog";
import { ScannerCamara } from "../inventario/ScannerCamara";

type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DialogType = "info" | "error" | "success" | "warning";

interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  type: DialogType;
  onAccept?: () => void;
}

interface ItemCarrito {
  producto: ProductoDB;
  cantidad: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const getDialogColor = (type: DialogType, theme: any) => {
  switch (type) {
    case "error":
      return theme.danger;
    case "success":
      return theme.success ?? "#30A46C";
    case "warning":
      return theme.warning ?? "#F5A623";
    case "info":
    default:
      return theme.primary ?? "#3B82F6";
  }
};

export function ModalVentas({ visible, onClose, onSuccess }: Props) {
  const theme = useTheme();

  const [escaneando, setEscaneando] = useState(true);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");

  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showDialog = (title: string, message: string, type: DialogType = "info", onAccept?: () => void) => {
    setDialog({ visible: true, title, message, type, onAccept });
  };

  const closeDialog = () => {
    const cb = dialog.onAccept;
    setDialog((d) => ({ ...d, visible: false }));
    cb?.();
  };

  const colorModo = theme.success ?? "#30A46C";
  const iconModo = "cart";

  const totalUnidades = items.reduce((acc, it) => {
    const n = parseInt(it.cantidad, 10);
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  const subtotal = items.reduce((acc, it) => {
    const n = parseInt(it.cantidad, 10) || 0;
    return acc + n * it.producto.precio_venta;
  }, 0);

  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const reanudarEscaneo = () => {
    setEscaneando(false);
    setTimeout(() => setEscaneando(true), 400);
  };

  const handleCodigoDetectado = (data: string) => {
    if (!escaneando) return;
    setEscaneando(false);

    const p = obtenerProductoPorCodigo(data);
    if (!p) {
      showDialog("Producto no encontrado", `No existe un producto con el código "${data}".`, "warning", () => reanudarEscaneo());
      return;
    }

    if (p.stock <= 0) {
      showDialog("Sin stock", `"${p.nombre}" no tiene existencias disponibles.`, "warning", () => reanudarEscaneo());
      return;
    }

    setItems((prev) => {
      const index = prev.findIndex((it) => it.producto.id === p.id);
      if (index >= 0) {
        const next = [...prev];
        const cantActual = parseInt(next[index].cantidad, 10) || 0;
        next[index] = { ...next[index], cantidad: String(cantActual + 1) };
        return next;
      }
      return [...prev, { producto: p, cantidad: "1" }];
    });

    reanudarEscaneo();
  };

  const handleCambiarCantidad = (productoId: string, valor: string) => {
    setItems((prev) => prev.map((it) => (it.producto.id === productoId ? { ...it, cantidad: valor.replace(/[^0-9]/g, "") } : it)));
  };

  const handleEliminar = (productoId: string) => {
    setItems((prev) => prev.filter((it) => it.producto.id !== productoId));
  };

  const handleCobrar = () => {
    if (items.length === 0) {
      showDialog("Sin productos", "Escanea al menos un producto.", "warning");
      return;
    }

    const itemsValidos: ItemVenta[] = [];

    for (const it of items) {
      const n = parseInt(it.cantidad, 10);

      if (!Number.isFinite(n) || n <= 0) {
        showDialog("Cantidad inválida", `Cantidad inválida para "${it.producto.nombre}".`, "error");
        return;
      }

      if (n > it.producto.stock) {
        showDialog("Stock insuficiente", `"${it.producto.nombre}": solo hay ${it.producto.stock} u.`, "error");
        return;
      }

      itemsValidos.push({
        producto_id: it.producto.id,
        producto_nombre: it.producto.nombre,
        producto_marca: it.producto.marca,
        cantidad: n,
        precio_venta_unitario: it.producto.precio_venta,
        precio_compra_unitario: it.producto.precio_compra,
      });
    }

    showDialog("Confirmar venta", `Total: $${total.toFixed(2)}\n${itemsValidos.length} producto(s) · ${totalUnidades} u.\nPago: ${metodoPago}`, "info", () => {
      const ventaId = registrarVenta({
        items: itemsValidos,
        metodo_pago: metodoPago,
        total,
      });

      if (ventaId) {
        showDialog("Venta registrada", `Folio: ${ventaId}\nTotal: $${total.toFixed(2)}\nPago: ${metodoPago}`, "success", () => {
          setItems([]);
          onClose();
          onSuccess?.();
        });
      } else {
        showDialog("Error", "No se pudo registrar la venta.", "error");
      }
    });
  };

  if (!visible) return null;

  const dialogColor = getDialogColor(dialog.type, theme);

  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView style={styles.kavWrapper} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: SCREEN_HEIGHT * 0.92 }]}>
          <View style={styles.titleRow}>
            <Ionicons name={iconModo as any} size={22} color={colorModo} />
            <ThemedText type="smallBold" style={styles.titulo}>
              Nueva Venta
            </ThemedText>
          </View>

          <ScannerCamara visible={true} escaneando={escaneando} onCodigoDetectado={handleCodigoDetectado} />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="barcode-outline" size={28} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 8, textAlign: "center" }}>
                  Escanea un producto para comenzar.
                </ThemedText>
              </View>
            ) : (
              items.map((it) => {
                const cantNum = parseInt(it.cantidad, 10) || 0;
                const subtotalItem = cantNum * it.producto.precio_venta;
                const stockInvalido = cantNum > it.producto.stock;

                return (
                  <View key={it.producto.id} style={[styles.itemRow, { borderColor: theme.border, backgroundColor: theme.input }]}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {it.producto.nombre}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 10 }} numberOfLines={1}>
                        ${it.producto.precio_venta.toFixed(2)} c/u · Stock: {it.producto.stock} u.
                      </ThemedText>
                      {cantNum > 0 && (
                        <ThemedText
                          type="small"
                          style={{
                            color: stockInvalido ? theme.danger : colorModo,
                            fontSize: 10,
                            marginTop: 2,
                            fontWeight: "700",
                          }}
                        >
                          Subtotal: ${subtotalItem.toFixed(2)}
                        </ThemedText>
                      )}
                    </View>

                    <TextInput
                      style={[
                        styles.cantidadInput,
                        {
                          borderColor: stockInvalido ? theme.danger : theme.border,
                          backgroundColor: theme.card,
                          color: theme.text,
                        },
                      ]}
                      value={it.cantidad}
                      onChangeText={(v) => handleCambiarCantidad(it.producto.id, v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                      maxLength={6}
                    />

                    <TouchableOpacity onPress={() => handleEliminar(it.producto.id)} hitSlop={6} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.fieldWrapper}>
            <ThemedText type="small" style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Método de pago
            </ThemedText>
            <View style={styles.motivosRow}>
              {[
                { key: "efectivo", label: "Efectivo", icon: "cash-outline" },
                { key: "tarjeta", label: "Tarjeta", icon: "card-outline" },
                { key: "transferencia", label: "Transferencia", icon: "swap-horizontal-outline" },
              ].map((op) => {
                const activo = metodoPago === op.key;
                return (
                  <TouchableOpacity
                    key={op.key}
                    onPress={() => setMetodoPago(op.key as MetodoPago)}
                    style={[
                      styles.motivoBtn,
                      {
                        borderColor: activo ? colorModo : theme.border,
                        backgroundColor: activo ? colorModo + "22" : theme.input,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      },
                    ]}
                  >
                    <Ionicons name={op.icon as any} size={13} color={activo ? colorModo : theme.textSecondary} />
                    <ThemedText
                      type="small"
                      style={{
                        fontSize: 11,
                        color: activo ? colorModo : theme.textSecondary,
                        fontWeight: activo ? "700" : "500",
                      }}
                    >
                      {op.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {items.length > 0 && (
            <View
              style={[
                styles.resumenRow,
                {
                  backgroundColor: colorModo + "15",
                  borderColor: colorModo + "33",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 4,
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11 }}>
                  {items.length} producto{items.length !== 1 ? "s" : ""} · {totalUnidades} u.
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11 }}>
                  Subtotal: ${subtotal.toFixed(2)}
                </ThemedText>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
                <ThemedText type="smallBold" style={{ color: colorModo, fontSize: 13 }}>
                  Total
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: colorModo, fontSize: 15 }}>
                  ${total.toFixed(2)}
                </ThemedText>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel, { borderColor: theme.border }]} onPress={onClose}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSubmit, { backgroundColor: colorModo, opacity: items.length === 0 ? 0.5 : 1 }]} onPress={handleCobrar} disabled={items.length === 0}>
              <ThemedText type="smallBold" style={{ color: "#FFFFFF" }}>
                Cobrar {items.length > 0 ? `($${total.toFixed(2)})` : ""}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Dialog.Container visible={dialog.visible} onBackdropPress={closeDialog} contentStyle={{ backgroundColor: theme.card, borderRadius: 16 }}>
        <Dialog.Title style={{ color: theme.text }}>{dialog.title}</Dialog.Title>
        <Dialog.Description style={{ color: theme.textSecondary }}>{dialog.message}</Dialog.Description>
        <Dialog.Button label="Aceptar" color={dialogColor} onPress={closeDialog} />
      </Dialog.Container>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  kavWrapper: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: Spacing.three,
    borderRadius: 12,
    width: "100%",
    maxHeight: "96%",
    flexShrink: 1,
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  titulo: { fontSize: 16 },
  scroll: {
    marginTop: 4,
    marginBottom: 8,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    maxHeight: 260,
  },
  scrollContent: { paddingBottom: 4, gap: 6 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cantidadInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "700",
  },
  fieldWrapper: { width: "100%", marginBottom: 8 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  motivosRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  motivoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  resumenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  buttonContainer: { flexDirection: "row", gap: Spacing.two },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: { borderWidth: 1 },
  btnSubmit: {},
});
