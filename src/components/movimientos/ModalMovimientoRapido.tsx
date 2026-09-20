import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { obtenerProductoPorCodigo, ProductoDB, registrarLote } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import Dialog from "react-native-dialog";
import { ScannerCamara } from "../inventario/ScannerCamara";

type Modo = "entrada" | "salida";

interface Props {
  visible: boolean;
  modo: Modo;
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

// Item del carrito: producto + cantidad (como string para el input)
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

export function ModalMovimientoRapido({ visible, modo, onClose, onSuccess }: Props) {
  const theme = useTheme();

  const [escaneando, setEscaneando] = useState(true);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [motivo, setMotivo] = useState(modo === "entrada" ? "compra" : "venta");

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

  const colorModo = modo === "entrada" ? theme.success : theme.danger;
  const labelModo = modo === "entrada" ? "Ingreso" : "Retiro";
  const iconModo = modo === "entrada" ? "arrow-up-circle" : "arrow-down-circle";

  const totalUnidades = items.reduce((acc, it) => {
    const n = parseInt(it.cantidad, 10);
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  // Reanuda el escaneo con un pequeño delay para que el scanner se reinicie bien
  const reanudarEscaneo = () => {
    setEscaneando(false);
    setTimeout(() => setEscaneando(true), 400);
  };

  const handleCodigoDetectado = (data: string) => {
    if (!escaneando) return;
    setEscaneando(false);

    const p = obtenerProductoPorCodigo(data);
    if (!p) {
      showDialog("Producto no encontrado", `No existe un producto con el código "${data}". Registra primero el producto.`, "warning", () => reanudarEscaneo());
      return;
    }

    setItems((prev) => {
      const index = prev.findIndex((it) => it.producto.id === p.id);

      // Producto ya en el carrito → sumar 1 a la cantidad
      if (index >= 0) {
        const next = [...prev];
        const cantActual = parseInt(next[index].cantidad, 10) || 0;
        next[index] = { ...next[index], cantidad: String(cantActual + 1) };
        return next;
      }

      // Producto nuevo → agregar con cantidad 1
      return [...prev, { producto: p, cantidad: "1" }];
    });

    // Reanudar escaneo para el siguiente producto
    reanudarEscaneo();
  };

  const handleCambiarCantidad = (productoId: string, valor: string) => {
    setItems((prev) => prev.map((it) => (it.producto.id === productoId ? { ...it, cantidad: valor.replace(/[^0-9]/g, "") } : it)));
  };

  const handleEliminar = (productoId: string) => {
    setItems((prev) => prev.filter((it) => it.producto.id !== productoId));
  };

  const handleGuardar = () => {
    if (items.length === 0) {
      showDialog("Sin productos", "Escanea al menos un producto.", "warning");
      return;
    }

    // Validar cantidades
    const itemsValidos: { producto_id: string; cantidad: number }[] = [];

    for (const it of items) {
      const n = parseInt(it.cantidad, 10);

      if (!Number.isFinite(n) || n <= 0) {
        showDialog("Cantidad inválida", `Cantidad inválida para "${it.producto.nombre}". Debe ser mayor a 0.`, "error");
        return;
      }

      if (modo === "salida" && n > it.producto.stock) {
        showDialog("Stock insuficiente", `"${it.producto.nombre}": solo hay ${it.producto.stock} unidades disponibles.`, "error");
        return;
      }

      itemsValidos.push({ producto_id: it.producto.id, cantidad: n });
    }

    const loteId = registrarLote({
      tipo: modo,
      motivo,
      nota: `Movimiento rápido (${labelModo.toLowerCase()})`,
      items: itemsValidos,
    });

    if (loteId) {
      showDialog("Éxito", `Se registraron ${itemsValidos.length} producto(s) · ${totalUnidades} unidad(es) en el ${labelModo.toLowerCase()}.`, "success", () => {
        onClose();
        onSuccess?.();
      });
    } else {
      showDialog("Error", "No se pudo registrar el movimiento.", "error");
    }
  };

  if (!visible) return null;

  const dialogColor = getDialogColor(dialog.type, theme);

  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView style={styles.kavWrapper} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: SCREEN_HEIGHT * 0.92 }]}>
          {/* Título */}
          <View style={styles.titleRow}>
            <Ionicons name={iconModo as any} size={22} color={colorModo} />
            <ThemedText type="smallBold" style={styles.titulo}>
              Registrar {labelModo}
            </ThemedText>
          </View>

          {/* Escáner */}
          <ScannerCamara visible={true} escaneando={escaneando} onCodigoDetectado={handleCodigoDetectado} />

          {/* Lista de productos escaneados */}
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
                const stockDespues = modo === "entrada" ? it.producto.stock + cantNum : it.producto.stock - cantNum;
                const stockInvalido = modo === "salida" && cantNum > it.producto.stock;

                return (
                  <View key={it.producto.id} style={[styles.itemRow, { borderColor: theme.border, backgroundColor: theme.input }]}>
                    {/* Info del producto */}
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {it.producto.nombre}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 10 }} numberOfLines={1}>
                        {it.producto.marca || "Sin marca"}
                        {it.producto.categoria ? ` · ${it.producto.categoria}` : ""}
                      </ThemedText>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                        <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 10 }}>
                          Stock: {it.producto.stock} u.
                        </ThemedText>
                        {cantNum > 0 && (
                          <ThemedText
                            type="small"
                            style={{
                              color: stockInvalido ? theme.danger : colorModo,
                              fontSize: 10,
                              marginLeft: 6,
                              fontWeight: "700",
                            }}
                          >
                            → {stockDespues} u.
                          </ThemedText>
                        )}
                      </View>
                    </View>

                    {/* Input de cantidad */}
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

                    {/* Botón eliminar */}
                    <TouchableOpacity onPress={() => handleEliminar(it.producto.id)} hitSlop={6} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Motivo */}
          <View style={styles.fieldWrapper}>
            <ThemedText type="small" style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Motivo
            </ThemedText>
            <View style={styles.motivosRow}>
              {(modo === "entrada"
                ? [
                    { key: "compra", label: "Compra" },
                    { key: "devolucion", label: "Devolución" },
                    { key: "ajuste", label: "Ajuste" },
                    { key: "otro", label: "Otro" },
                  ]
                : [
                    { key: "venta", label: "Venta" },
                    { key: "merma", label: "Merma" },
                    { key: "uso_interno", label: "Uso interno" },
                    { key: "otro", label: "Otro" },
                  ]
              ).map((op) => {
                const activo = motivo === op.key;
                return (
                  <TouchableOpacity
                    key={op.key}
                    onPress={() => setMotivo(op.key)}
                    style={[
                      styles.motivoBtn,
                      {
                        borderColor: activo ? colorModo : theme.border,
                        backgroundColor: activo ? colorModo + "22" : theme.input,
                      },
                    ]}
                  >
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

          {/* Resumen */}
          {items.length > 0 && (
            <View
              style={[
                styles.resumenRow,
                {
                  backgroundColor: colorModo + "15",
                  borderColor: colorModo + "33",
                },
              ]}
            >
              <Ionicons name={iconModo as any} size={14} color={colorModo} />
              <ThemedText type="small" style={{ color: colorModo, fontSize: 11, marginLeft: 6, flex: 1 }}>
                {items.length} producto{items.length !== 1 ? "s" : ""} · {totalUnidades} unidad
                {totalUnidades !== 1 ? "es" : ""}
              </ThemedText>
            </View>
          )}

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel, { borderColor: theme.border }]} onPress={onClose}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSubmit, { backgroundColor: colorModo, opacity: items.length === 0 ? 0.5 : 1 }]} onPress={handleGuardar} disabled={items.length === 0}>
              <ThemedText type="smallBold" style={{ color: "#FFFFFF" }}>
                Registrar {items.length > 0 ? `(${items.length})` : ""}
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
  scrollContent: {
    paddingBottom: 4,
    gap: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
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
  fieldWrapper: {
    width: "100%",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  motivosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
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
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.two,
  },
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
