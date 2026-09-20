import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { actualizarProducto, AtributoProductoInput, crearProducto, obtenerProductoPorCodigo, ProductoDB, registrarMovimiento } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Dialog from "react-native-dialog";
import { FormularioProducto } from "./FormularioProducto";
import { ScannerCamara } from "./ScannerCamara";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productoEditar?: ProductoDB | null;
}

type DialogType = "info" | "error" | "success" | "warning";

interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  type: DialogType;
  onAccept?: () => void;
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

/* ModalProducto                                                       */
export default function ModalProducto({ visible, onClose, onSuccess, productoEditar }: Props) {
  const theme = useTheme();

  const [nombre, setNombre] = useState(productoEditar?.nombre || "");
  const [marca, setMarca] = useState(productoEditar?.marca || "");
  const [categoria, setCategoria] = useState(productoEditar?.categoria || "");
  const [atributos, setAtributos] = useState<AtributoProductoInput[]>(productoEditar?.atributos ?? []);
  const [precioCompra, setPrecioCompra] = useState(productoEditar?.precio_compra ? String(productoEditar.precio_compra) : "");
  const [precioVenta, setPrecioVenta] = useState(productoEditar?.precio_venta ? String(productoEditar.precio_venta) : "");
  const [stock, setStock] = useState(productoEditar?.stock !== undefined ? String(productoEditar.stock) : "");
  const [codigoBarras, setCodigoBarras] = useState(productoEditar?.codigo_barras || "");

  const [escaneando, setEscaneando] = useState(false);
  const [codigoConfirmado, setCodigoConfirmado] = useState(!!productoEditar);

  // Producto detectado al escanear (para modo "registrar ingreso")
  const [productoExistente, setProductoExistente] = useState<ProductoDB | null>(null);

  // Estado del diálogo
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

  const esEdicion = !!productoEditar;
  const esIngreso = !esEdicion && !!productoExistente;

  useEffect(() => {
    if (!visible) return;
    if (esEdicion) return;

    const t = setTimeout(() => setEscaneando(true), 800);
    return () => {
      clearTimeout(t);
      setEscaneando(false);
    };
  }, [visible, esEdicion]);

  const autocompletar = (codigo: string) => {
    const p = obtenerProductoPorCodigo(codigo);

    if (p) {
      setProductoExistente(p);
      setNombre(p.nombre || "");
      setMarca(p.marca || "");
      setCategoria(p.categoria || ""); // 👈 NUEVO
      setAtributos(p.atributos);
      setPrecioCompra(p.precio_compra ? String(p.precio_compra) : "");
      setPrecioVenta(p.precio_venta ? String(p.precio_venta) : "");
      setStock(""); // vacío → usuario ingresa la cantidad nueva
    } else {
      setProductoExistente(null);
    }
  };

  const handleCodigoDetectado = (data: string) => {
    if (!escaneando) return;
    setEscaneando(false);
    setCodigoBarras(data);
    setCodigoConfirmado(true);
    autocompletar(data);
  };

  const handleReescanear = () => {
    limpiar();
    setTimeout(() => setEscaneando(true), 600);
  };

  const limpiar = () => {
    setNombre("");
    setMarca("");
    setCategoria(""); // 👈 NUEVO
    setAtributos([]);
    setPrecioCompra("");
    setPrecioVenta("");
    setStock("");
    setCodigoBarras("");
    setEscaneando(false);
    setCodigoConfirmado(false);
    setProductoExistente(null);
  };

  const handleGuardar = () => {
    const precioVentaNumero = Number.parseFloat(precioVenta.replace(",", "."));
    const precioCompraNumero = precioCompra ? Number.parseFloat(precioCompra.replace(",", ".")) : 0;
    const stockNumero = Number.parseInt(stock, 10);

    if (!Number.isFinite(precioVentaNumero) || precioVentaNumero < 0) {
      showDialog("Precio inválido", "Ingresa un precio de venta válido.", "error");
      return;
    }

    if (!Number.isFinite(precioCompraNumero) || precioCompraNumero < 0) {
      showDialog("Precio inválido", "Ingresa un precio de compra válido.", "error");
      return;
    }

    // CASO 1: EDITAR producto existente
    if (productoEditar) {
      if (!nombre.trim() || !precioVenta) {
        showDialog("Campos requeridos", "Completa el nombre y precio de venta.", "warning");
        return;
      }

      const exito = actualizarProducto({
        id: productoEditar.id,
        codigo_barras: codigoBarras.trim() || null,
        nombre: nombre.trim(),
        marca: marca.trim() || null,
        categoria: categoria.trim() || null, // 👈 NUEVO
        atributos,
        precio_compra: precioCompraNumero,
        precio_venta: precioVentaNumero,
      });

      if (exito) {
        showDialog("Éxito", "Producto actualizado correctamente.", "success", () => {
          limpiar();
          onClose();
          onSuccess?.();
        });
      } else {
        showDialog("Error", "No se pudo actualizar el producto.", "error");
      }
      return;
    }

    // CASO 2: REGISTRAR INGRESO a un producto existente
    if (productoExistente) {
      const cantidad = parseInt(stock, 10) || 0;

      if (cantidad <= 0) {
        showDialog("Cantidad inválida", "Ingresa una cantidad mayor a 0 para registrar el ingreso.", "error");
        return;
      }

      const exito = registrarMovimiento({
        producto_id: productoExistente.id,
        tipo: "entrada",
        cantidad,
        motivo: "compra",
        nota: "Ingreso desde escáner",
      });

      if (exito) {
        showDialog("Éxito", `Se registraron ${cantidad} unidades al producto "${productoExistente.nombre}".`, "success", () => {
          limpiar();
          onClose();
          onSuccess?.();
        });
      } else {
        showDialog("Error", "No se pudo registrar el movimiento.", "error");
      }
      return;
    }

    // CASO 3: CREAR producto nuevo
    if (!nombre.trim() || !precioVenta) {
      showDialog("Campos requeridos", "Completa el nombre y precio de venta.", "warning");
      return;
    }

    if (!stock) {
      showDialog("Campos requeridos", "Ingresa un stock inicial.", "warning");
      return;
    }

    if (!Number.isFinite(stockNumero) || stockNumero < 0) {
      showDialog("Stock inválido", "Ingresa una cantidad entera válida.", "error");
      return;
    }

    const exito = crearProducto({
      id: String(Date.now()),
      codigo_barras: codigoBarras.trim() || null,
      nombre: nombre.trim(),
      marca: marca.trim() || null,
      categoria: categoria.trim() || null, // 👈 NUEVO
      atributos,
      precio_compra: precioCompraNumero,
      precio_venta: precioVentaNumero,
      stock: stockNumero,
    });

    if (exito) {
      showDialog("Éxito", "Producto registrado exitosamente.", "success", () => {
        limpiar();
        onClose();
        onSuccess?.();
      });
    } else {
      showDialog("Error", "No se pudo guardar el producto.", "error");
    }
  };

  const handleCerrar = () => {
    limpiar();
    onClose();
  };

  // Título dinámico
  const titulo = esEdicion ? "Editar " : esIngreso ? "Registrar Ingreso" : "Nuevo ";

  // Texto del botón
  const textoBoton = esEdicion ? "Actualizar" : esIngreso ? "Registrar Ingreso" : "Guardar";

  if (!visible) return null;

  const dialogColor = getDialogColor(dialog.type, theme);

  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView style={styles.kavWrapper} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: SCREEN_HEIGHT * 0.92 }]}>
          <ThemedText type="smallBold" style={styles.titulo}>
            {titulo}
          </ThemedText>

          <ScannerCamara visible={!esEdicion && !codigoConfirmado} escaneando={escaneando} onCodigoDetectado={handleCodigoDetectado} />
          {/* Aviso: producto ya registrado → se registrará ingreso */}
          {esIngreso && (
            <View
              style={[
                styles.warnRow,
                {
                  backgroundColor: theme.warning + "22",
                  borderColor: theme.warning + "55",
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={14} color={theme.warning} />
              <ThemedText
                type="small"
                style={{
                  color: theme.warning,
                  fontSize: 11,
                  marginLeft: 6,
                  flex: 1,
                }}
              >
                Producto ya registrado · se sumará al stock actual
              </ThemedText>
            </View>
          )}

          {codigoConfirmado && (
            <View style={[styles.codeLine, { borderColor: theme.border, backgroundColor: theme.input }]}>
              <Ionicons name={esEdicion ? "create-outline" : "barcode-outline"} size={14} color={theme.textSecondary} />
              <ThemedText
                type="small"
                numberOfLines={1}
                style={{
                  color: theme.textSecondary,
                  fontSize: 11,
                  flex: 1,
                  marginLeft: 6,
                }}
              >
                {esEdicion ? "Editando · " : "Código: "}
                {codigoBarras || "sin código"}
              </ThemedText>

              {!esEdicion && (
                <TouchableOpacity onPress={handleReescanear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <FormularioProducto
              nombre={nombre}
              setNombre={setNombre}
              marca={marca}
              setMarca={setMarca}
              categoria={categoria} // 👈 NUEVO
              setCategoria={setCategoria} // 👈 NUEVO
              atributos={atributos}
              setAtributos={setAtributos}
              stock={stock}
              setStock={setStock}
              precioCompra={precioCompra}
              setPrecioCompra={setPrecioCompra}
              precioVenta={precioVenta}
              setPrecioVenta={setPrecioVenta}
              esEdicion={esEdicion}
              esIngreso={esIngreso}
            />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel, { borderColor: theme.border }]} onPress={handleCerrar}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSubmit, { backgroundColor: theme.primary }]} onPress={handleGuardar}>
              <ThemedText type="smallBold" style={{ color: "#FFFFFF" }}>
                {textoBoton}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      {/* --- Diálogo: Reemplazo de Alert.alert (mismo formato que ItemProducto) --- */}
      <Dialog.Container
        visible={dialog.visible}
        onBackdropPress={closeDialog}
        contentStyle={{
          backgroundColor: theme.card,
          borderRadius: 16,
        }}
      >
        <Dialog.Title style={{ color: theme.text }}>{dialog.title}</Dialog.Title>
        <Dialog.Description style={{ color: theme.textSecondary }}>{dialog.message}</Dialog.Description>
        <Dialog.Button label="Aceptar" color={dialogColor} onPress={closeDialog} />
      </Dialog.Container>
    </View>
  );
}

/* Styles                                                              */
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
  titulo: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  codeLine: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  scroll: {
    marginBottom: 8,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 4,
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
