import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import {
  actualizarProducto,
  crearProducto,
  obtenerProductoPorCodigo,
  ProductoDB,
  registrarMovimiento,
} from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { useEscanerCodigo } from "@/hooks/useEscanerCodigo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FormularioProducto } from "./FormularioProducto";
import { ScannerCamara } from "./ScannerCamara";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productoEditar?: ProductoDB | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ModalProducto({
  visible,
  onClose,
  onSuccess,
  productoEditar,
}: Props) {
  const theme = useTheme();
  const { procesarEscaneo, reset: resetScan } = useEscanerCodigo();

  const [nombre, setNombre] = useState(productoEditar?.nombre || "");
  const [marca, setMarca] = useState(productoEditar?.marca || "");
  const [talla, setTalla] = useState(
    productoEditar?.talla ? String(productoEditar.talla) : "",
  );
  const [color, setColor] = useState(productoEditar?.color || "");
  const [precioCompra, setPrecioCompra] = useState(
    productoEditar?.precio_compra ? String(productoEditar.precio_compra) : "",
  );
  const [precioVenta, setPrecioVenta] = useState(
    productoEditar?.precio_venta ? String(productoEditar.precio_venta) : "",
  );
  const [stock, setStock] = useState(
    productoEditar?.stock !== undefined ? String(productoEditar.stock) : "",
  );
  const [codigoBarras, setCodigoBarras] = useState(
    productoEditar?.codigo_barras || "",
  );

  const [escaneando, setEscaneando] = useState(false);
  const [codigoConfirmado, setCodigoConfirmado] = useState(!!productoEditar);

  // 👇 Producto detectado al escanear (para modo "registrar ingreso")
  const [productoExistente, setProductoExistente] = useState<ProductoDB | null>(
    null,
  );

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

  /**
   * Cuando se detecta un código:
   *  - Si existe → precarga datos, guarda `productoExistente` y limpia stock
   *  - Si no existe → limpia `productoExistente` y deja los campos como están
   */
  const autocompletar = (codigo: string) => {
    const p = obtenerProductoPorCodigo(codigo);

    if (p) {
      setProductoExistente(p);
      setNombre(p.nombre || "");
      setMarca(p.marca || "");
      setTalla(p.talla ? String(p.talla) : "");
      setColor(p.color || "");
      setPrecioCompra(p.precio_compra ? String(p.precio_compra) : "");
      setPrecioVenta(p.precio_venta ? String(p.precio_venta) : "");
      setStock(""); // 🔑 vacío → usuario ingresa la cantidad nueva
    } else {
      setProductoExistente(null);
    }
  };

  const handleCodigoDetectado = (data: string) => {
    if (!escaneando) return;
    procesarEscaneo(data, (codigo) => {
      setEscaneando(false);
      setCodigoBarras(codigo);
      setCodigoConfirmado(true);
      autocompletar(codigo);
    });
  };

  const handleReescanear = () => {
    resetScan();
    limpiar();
    setTimeout(() => setEscaneando(true), 600);
  };

  const limpiar = () => {
    setNombre("");
    setMarca("");
    setTalla("");
    setColor("");
    setPrecioCompra("");
    setPrecioVenta("");
    setStock("");
    setCodigoBarras("");
    setEscaneando(false);
    setCodigoConfirmado(false);
    setProductoExistente(null);
  };

  const handleGuardar = () => {
    // ============================================================
    // CASO 1: EDITAR producto existente
    // ============================================================
    if (productoEditar) {
      if (!nombre.trim() || !talla.trim() || !precioVenta) {
        Alert.alert(
          "Campos requeridos",
          "Completa el nombre, talla y precio de venta.",
        );
        return;
      }

      const exito = actualizarProducto({
        id: productoEditar.id,
        codigo_barras: codigoBarras.trim() || null,
        nombre: nombre.trim(),
        marca: marca.trim() || null,
        talla: talla.trim(),
        color: color.trim() || null,
        precio_compra: precioCompra ? parseFloat(precioCompra) : 0,
        precio_venta: parseFloat(precioVenta),
      });

      if (exito) {
        Alert.alert("Éxito", "Producto actualizado correctamente.");
        limpiar();
        onClose();
        onSuccess?.();
      } else {
        Alert.alert("Error", "No se pudo actualizar el producto.");
      }
      return;
    }

    // ============================================================
    // CASO 2: REGISTRAR INGRESO a un producto existente
    // ============================================================
    if (productoExistente) {
      const cantidad = parseInt(stock, 10) || 0;

      if (cantidad <= 0) {
        Alert.alert(
          "Cantidad inválida",
          "Ingresa una cantidad mayor a 0 para registrar el ingreso.",
        );
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
        Alert.alert(
          "Éxito",
          `Se registraron ${cantidad} unidades al producto "${productoExistente.nombre}".`,
        );
        limpiar();
        onClose();
        onSuccess?.();
      } else {
        Alert.alert("Error", "No se pudo registrar el movimiento.");
      }
      return;
    }

    // ============================================================
    // CASO 3: CREAR producto nuevo
    // ============================================================
    if (!nombre.trim() || !talla.trim() || !precioVenta) {
      Alert.alert(
        "Campos requeridos",
        "Completa el nombre, talla y precio de venta.",
      );
      return;
    }

    if (!stock) {
      Alert.alert("Campos requeridos", "Ingresa un stock inicial.");
      return;
    }

    const exito = crearProducto({
      id: Date.now().toString(),
      codigo_barras: codigoBarras.trim() || null,
      nombre: nombre.trim(),
      marca: marca.trim() || null,
      talla: talla.trim(),
      color: color.trim() || null,
      precio_compra: precioCompra ? parseFloat(precioCompra) : 0,
      precio_venta: parseFloat(precioVenta),
      stock: parseInt(stock, 10) || 0,
    });

    if (exito) {
      Alert.alert("Éxito", "Producto registrado exitosamente.");
      limpiar();
      onClose();
      onSuccess?.();
    } else {
      Alert.alert("Error", "No se pudo guardar el producto.");
    }
  };

  const handleCerrar = () => {
    limpiar();
    onClose();
  };

  // Título dinámico
  const titulo = esEdicion
    ? "Editar Zapatilla"
    : esIngreso
      ? "Registrar Ingreso"
      : "Nueva Zapatilla";

  // Texto del botón
  const textoBoton = esEdicion
    ? "Actualizar"
    : esIngreso
      ? "Registrar Ingreso"
      : "Guardar";

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.card, maxHeight: SCREEN_HEIGHT * 0.92 },
          ]}
        >
          <ThemedText type="smallBold" style={styles.titulo}>
            {titulo}
          </ThemedText>

          <ScannerCamara
            visible={!esEdicion && !codigoConfirmado}
            escaneando={escaneando}
            onCodigoDetectado={handleCodigoDetectado}
          />

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
              <Ionicons
                name="alert-circle-outline"
                size={14}
                color={theme.warning}
              />
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
            <View
              style={[
                styles.codeLine,
                { borderColor: theme.border, backgroundColor: theme.input },
              ]}
            >
              <Ionicons
                name={esEdicion ? "create-outline" : "barcode-outline"}
                size={14}
                color={theme.textSecondary}
              />
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
                <TouchableOpacity
                  onPress={handleReescanear}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <FormularioProducto
              nombre={nombre}
              setNombre={setNombre}
              marca={marca}
              setMarca={setMarca}
              talla={talla}
              setTalla={setTalla}
              color={color}
              setColor={setColor}
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
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnCancel,
                { borderColor: theme.border },
              ]}
              onPress={handleCerrar}
            >
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnSubmit,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleGuardar}
            >
              <ThemedText type="smallBold" style={{ color: "#FFFFFF" }}>
                {textoBoton}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
