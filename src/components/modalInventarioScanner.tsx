import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import {
  actualizarProducto,
  crearProducto,
  obtenerProductoPorCodigo,
  ProductoDB,
} from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ModalCrearProductoProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productoEditar?: ProductoDB | null;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper: input con label arriba
function Field({
  label,
  required,
  theme,
  ...inputProps
}: {
  label: string;
  required?: boolean;
  theme: any;
} & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  const bloqueado = inputProps.editable === false;

  return (
    <View style={styles.fieldWrapper}>
      <ThemedText
        type="small"
        style={[styles.fieldLabel, { color: theme.textSecondary }]}
      >
        {label}
        {required && (
          <ThemedText style={{ color: theme.danger }}> *</ThemedText>
        )}
      </ThemedText>
      <TextInput
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderColor: focused && !bloqueado ? theme.primary : theme.border,
            backgroundColor: bloqueado ? theme.border + "44" : theme.input,
            color: bloqueado ? theme.textSecondary : theme.text,
          },
          inputProps.style,
        ]}
        placeholderTextColor={theme.textSecondary}
      />
    </View>
  );
}

export default function ModalCrearProducto({
  visible,
  onClose,
  onSuccess,
  productoEditar,
}: ModalCrearProductoProps) {
  const theme = useTheme();

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

  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(false);
  const [codigoConfirmado, setCodigoConfirmado] = useState(!!productoEditar);
  const [flashOn, setFlashOn] = useState(false);

  const [productos, setProductos] = useState<ProductoDB[]>([]);

  const esEdicion = !!productoEditar;

  const buscarYAutoCompletarProducto = useCallback((codigo: string) => {
    const productoEncontrado = obtenerProductoPorCodigo(codigo);

    if (productoEncontrado) {
      setNombre(productoEncontrado.nombre || "");
      setMarca(productoEncontrado.marca || "");
      setTalla(
        productoEncontrado.talla ? String(productoEncontrado.talla) : "",
      );
      setColor(productoEncontrado.color || "");
      setPrecioCompra(
        productoEncontrado.precio_compra
          ? String(productoEncontrado.precio_compra)
          : "",
      );
      setPrecioVenta(
        productoEncontrado.precio_venta
          ? String(productoEncontrado.precio_venta)
          : "",
      );
      setStock(
        productoEncontrado.stock !== undefined
          ? String(productoEncontrado.stock)
          : "",
      );

      setProductos((prevProductos) => {
        const existeIndice = prevProductos.findIndex(
          (p) => p.codigo_barras === productoEncontrado.codigo_barras,
        );

        if (existeIndice !== -1) {
          const actualizados = [...prevProductos];
          actualizados[existeIndice] = productoEncontrado;
          return actualizados;
        }

        return [...prevProductos, productoEncontrado];
      });
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (esEdicion) return;

    if (!permiso?.granted) {
      solicitarPermiso();
    }

    const timer = setTimeout(() => {
      setEscaneando(true);
    }, 800);

    return () => {
      clearTimeout(timer);
      setEscaneando(false);
      setFlashOn(false);
    };
  }, [visible, esEdicion, permiso, solicitarPermiso]);

  const handleCodigoDetectado = ({ data }: { data: string }) => {
    if (data && escaneando) {
      setCodigoBarras(data);
      setEscaneando(false);
      setCodigoConfirmado(true);
      setFlashOn(false);
      buscarYAutoCompletarProducto(data);
    }
  };

  const handleReescanear = () => {
    limpiarFormulario();
    setTimeout(() => {
      setEscaneando(true);
    }, 600);
  };

  const toggleFlash = () => setFlashOn((prev) => !prev);

  const limpiarFormulario = () => {
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
    setFlashOn(false);
  };

  const handleGuardar = () => {
    if (!nombre.trim() || !talla.trim() || !precioVenta) {
      Alert.alert(
        "Campos requeridos",
        "Por favor completa el nombre, talla y precio de venta.",
      );
      return;
    }

    if (!esEdicion && !stock) {
      Alert.alert("Campos requeridos", "Ingresa un stock inicial.");
      return;
    }

    let exito = false;

    if (productoEditar) {
      exito = actualizarProducto({
        ...productoEditar,
        codigo_barras: codigoBarras.trim() || null,
        nombre: nombre.trim(),
        marca: marca.trim() || null,
        talla: talla.trim(),
        color: color.trim() || null,
        precio_compra: precioCompra ? parseFloat(precioCompra) : 0,
        precio_venta: parseFloat(precioVenta),
      });
    } else {
      exito = crearProducto({
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
    }

    if (exito) {
      Alert.alert(
        "Éxito",
        esEdicion
          ? "Producto actualizado correctamente."
          : "Producto registrado exitosamente.",
      );
      limpiarFormulario();
      onClose();
      if (onSuccess) onSuccess();
    } else {
      Alert.alert(
        "Error",
        esEdicion
          ? "No se pudo actualizar el producto."
          : "No se pudo guardar el producto.",
      );
    }
  };

  const handleCerrar = () => {
    limpiarFormulario();
    onClose();
  };

  const permisoConcedido = permiso?.granted;

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View
        style={[
          styles.modalContent,
          { backgroundColor: theme.card, maxHeight: SCREEN_HEIGHT * 0.92 },
        ]}
      >
        <ThemedText type="smallBold" style={styles.titulo}>
          {esEdicion ? "Editar Zapatilla" : "Nueva Zapatilla"}
        </ThemedText>

        {/* CÁMARA (solo si NO es edición) */}
        {!esEdicion && !codigoConfirmado && (
          <View style={styles.cameraWrapper} collapsable={false}>
            {permisoConcedido ? (
              <>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={flashOn}
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      "qr",
                      "ean13",
                      "ean8",
                      "upc_a",
                      "upc_e",
                      "code128",
                      "code39",
                    ],
                  }}
                  onBarcodeScanned={
                    escaneando ? handleCodigoDetectado : undefined
                  }
                />

                <TouchableOpacity
                  style={styles.btnFlash}
                  onPress={toggleFlash}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={flashOn ? "flash" : "flash-outline"}
                    size={18}
                    color={flashOn ? "#F59E0B" : "#FFFFFF"}
                  />
                </TouchableOpacity>

                <View style={styles.scannerOverlay} pointerEvents="box-none">
                  <View style={styles.scannerCenter}>
                    <View style={styles.scannerTargetBox} />
                  </View>
                </View>

                {!escaneando && (
                  <View style={styles.loadingOverlay}>
                    <ThemedText style={styles.loadingText}>
                      Alineando cámara...
                    </ThemedText>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.cameraPlaceholder}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Solicitando permiso de cámara...
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Línea compacta de código */}
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
          keyboardShouldPersistTaps="handled"
        >
          {/* === PRODUCTO === */}
          <ThemedText
            type="small"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            PRODUCTO
          </ThemedText>

          <Field
            label="Nombre o modelo"
            required
            theme={theme}
            placeholder="Ej. Nike Air Force 1"
            value={nombre}
            onChangeText={setNombre}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field
                label="Marca"
                theme={theme}
                placeholder="Ej. Nike"
                value={marca}
                onChangeText={setMarca}
              />
            </View>
            <View style={styles.flex1}>
              <Field
                label="Talla"
                required
                theme={theme}
                placeholder="Ej. 42"
                keyboardType="numeric"
                value={talla}
                onChangeText={setTalla}
              />
            </View>
          </View>

          {/* === DETALLES === */}
          <ThemedText
            type="small"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            DETALLES
          </ThemedText>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field
                label="Color"
                theme={theme}
                placeholder="Ej. Blanco"
                value={color}
                onChangeText={setColor}
              />
            </View>
            <View style={styles.flex1}>
              <Field
                label={esEdicion ? "Stock (lectura)" : "Stock inicial"}
                required={!esEdicion}
                theme={theme}
                placeholder="Ej. 10"
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
                editable={!esEdicion}
              />
            </View>
          </View>

          {esEdicion && (
            <View
              style={[
                styles.infoRow,
                {
                  backgroundColor: theme.primary + "15",
                  borderColor: theme.primary + "33",
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={theme.primary}
              />
              <ThemedText
                type="small"
                style={{
                  color: theme.primary,
                  fontSize: 10,
                  marginLeft: 5,
                  flex: 1,
                }}
              >
                El stock se gestiona desde movimientos.
              </ThemedText>
            </View>
          )}

          {/* === PRECIOS === */}
          <ThemedText
            type="small"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            PRECIOS
          </ThemedText>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Field
                label="Compra (S/)"
                theme={theme}
                placeholder="0.00"
                keyboardType="numeric"
                value={precioCompra}
                onChangeText={setPrecioCompra}
              />
            </View>
            <View style={styles.flex1}>
              <Field
                label="Venta (S/)"
                required
                theme={theme}
                placeholder="0.00"
                keyboardType="numeric"
                value={precioVenta}
                onChangeText={setPrecioVenta}
              />
            </View>
          </View>
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
              {esEdicion ? "Actualizar" : "Guardar"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 999,
    elevation: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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

  /* Cámara */
  cameraWrapper: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#000",
    position: "relative",
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFill,
  },
  scannerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerTargetBox: {
    width: 250,
    height: 90,
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  btnFlash: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 6,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 10,
  },

  /* Línea compacta de código */
  codeLine: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },

  /* Formulario */
  scroll: {
    marginBottom: 8,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 6,
  },
  fieldWrapper: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 3,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
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
  btnCancel: {
    borderWidth: 1,
  },
  btnSubmit: {},
});
