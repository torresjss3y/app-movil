import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { crearProducto } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
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
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ModalCrearProducto({
  visible,
  onClose,
  onSuccess,
}: ModalCrearProductoProps) {
  const theme = useTheme();

  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [stock, setStock] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");

  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(false);
  const [codigoConfirmado, setCodigoConfirmado] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Solicitar permiso y activar escaneo al abrir el modal
  useEffect(() => {
    if (!visible) return;

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
  }, [visible, permiso, solicitarPermiso]);

  const handleCodigoDetectado = ({ data }: { data: string }) => {
    if (data && escaneando) {
      setCodigoBarras(data);
      setEscaneando(false);
      setCodigoConfirmado(true);
      setFlashOn(false);
    }
  };

  const handleReescanear = () => {
    setCodigoBarras("");
    setCodigoConfirmado(false);
    setTimeout(() => {
      setEscaneando(true);
    }, 600);
  };

  const toggleFlash = () => {
    setFlashOn((prev) => !prev);
  };

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
    if (!nombre.trim() || !talla.trim() || !precioVenta || !stock) {
      Alert.alert(
        "Campos requeridos",
        "Por favor completa el nombre, talla, precio de venta y stock.",
      );
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
      stock: parseInt(stock, 10),
    });

    if (exito) {
      limpiarFormulario();
      onClose();
      if (onSuccess) onSuccess();
    } else {
      Alert.alert(
        "Error",
        "No se pudo guardar la zapatilla en la base de datos.",
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
          {
            backgroundColor: theme.card,
            maxHeight: SCREEN_HEIGHT * 0.9,
          },
        ]}
      >
        <ThemedText type="smallBold" style={styles.titulo}>
          Nueva Zapatilla
        </ThemedText>

        {/* ===== CÁMARA EMBEBIDA ===== */}
        {/* Se oculta una vez confirmado el código para liberar espacio
            vertical y que el formulario no quede tapado por el teclado */}
        {!codigoConfirmado && (
          <View style={styles.cameraWrapper} collapsable={false}>
            {permisoConcedido ? (
              <>
                {/* CameraView ocupa todo el wrapper (sin children) */}
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

                {/* Botón de Flash (hermano, no hijo) */}
                <TouchableOpacity
                  style={styles.btnFlash}
                  onPress={toggleFlash}
                  activeOpacity={0.7}
                  accessibilityLabel="Alternar flash"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={flashOn ? "flash" : "flash-outline"}
                    size={20}
                    color={flashOn ? "#F59E0B" : "#FFFFFF"}
                  />
                </TouchableOpacity>

                {/* Overlay con la caja verde */}
                <View style={styles.scannerOverlay} pointerEvents="box-none">
                  <View style={styles.scannerCenter}>
                    <View style={styles.scannerTargetBox} />
                  </View>
                </View>

                {/* Mensaje de alineación */}
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
        {/* ===== FIN CÁMARA ===== */}

        {/* Badge de confirmación + botón reescanear, ahora fuera de la
            cámara (que ya está oculta) para que sigan visibles */}
        {codigoConfirmado && (
          <View
            style={[
              styles.confirmRow,
              { borderColor: theme.border, backgroundColor: theme.input },
            ]}
          >
            <View style={styles.confirmInfo}>
              <ThemedText
                style={[styles.confirmBadgeText, { color: theme.text }]}
              >
                ✓ Código detectado
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {codigoBarras}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.btnReescanear, { backgroundColor: theme.primary }]}
              onPress={handleReescanear}
              activeOpacity={0.8}
              accessibilityLabel="Volver a escanear"
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText
            type="small"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Producto
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.border,
                backgroundColor: theme.input,
                color: theme.text,
              },
            ]}
            placeholder="Modelo / Nombre * (ej: Air Max 90)"
            placeholderTextColor={theme.textSecondary}
            value={nombre}
            onChangeText={setNombre}
          />

          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.input,
                  color: theme.text,
                },
              ]}
              placeholder="Marca (ej: Nike)"
              placeholderTextColor={theme.textSecondary}
              value={marca}
              onChangeText={setMarca}
            />
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.input,
                  color: theme.text,
                },
              ]}
              placeholder="Talla * (ej: 41)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={talla}
              onChangeText={setTalla}
            />
          </View>

          <ThemedText
            type="small"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Detalles
          </ThemedText>

          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.input,
                  color: theme.text,
                },
              ]}
              placeholder="Color (ej: Blanco)"
              placeholderTextColor={theme.textSecondary}
              value={color}
              onChangeText={setColor}
            />
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.input,
                  color: theme.text,
                },
              ]}
              placeholder="Stock * (Pares)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />
          </View>

          <ThemedText
            type="small"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Precios
          </ThemedText>

          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.input,
                  color: theme.text,
                },
              ]}
              placeholder="P. Compra ($)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={precioCompra}
              onChangeText={setPrecioCompra}
            />
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.input,
                  color: theme.text,
                },
              ]}
              placeholder="P. Venta * ($)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={precioVenta}
              onChangeText={setPrecioVenta}
            />
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
              Guardar
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
    top: 3,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 999,
    elevation: 999,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  modalContent: {
    padding: Spacing.four,
    borderRadius: 12,
    width: "100%",
    maxHeight: "96%",
    flexShrink: 1,
    overflow: "hidden",
  },
  titulo: {
    fontSize: 18,
    marginBottom: Spacing.three,
    textAlign: "center",
  },

  // ===== CÁMARA =====
  cameraWrapper: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: Spacing.three,
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
    width: 200,
    height: 90,
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  btnFlash: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 11,
  },
  // ===== FIN CÁMARA =====

  // Fila de confirmación de código (reemplaza el badge flotante
  // sobre la cámara, ahora que la cámara se oculta tras confirmar)
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  confirmInfo: {
    flexShrink: 1,
  },
  confirmBadgeText: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  btnReescanear: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    marginBottom: Spacing.three,
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.two,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    borderWidth: 1,
  },
  btnSubmit: {},
});
