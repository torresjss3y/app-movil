import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import {
  ProductoDB,
  obtenerProductoPorCodigo,
} from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
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
import { ScannerCamara } from "../inventario/ScannerCamara";

export interface ItemCarrito {
  producto: ProductoDB;
  cantidad: number;
}

interface Props {
  visible: boolean;
  tipo: "entrada" | "salida";
  onClose: () => void;
  onConfirmar: (items: ItemCarrito[], motivo: string, nota: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Ventana anti-ráfaga por código. Si el MISMO código llega dentro de este
// tiempo, se ignora. 800ms da margen suficiente para que la cámara se
// estabilice entre lecturas y evita duplicados.
const DEBOUNCE_MS = 800;

export function SesionEscaneo({ visible, tipo, onClose, onConfirmar }: Props) {
  const theme = useTheme() as typeof Colors.light;

  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [motivo, setMotivo] = useState(tipo === "entrada" ? "compra" : "merma");
  const [nota, setNota] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [ultimoEscaneado, setUltimoEscaneado] = useState<string | null>(null);

  // Mapa de timestamps: { [codigo]: Date.now() }
  const ultimoScanRef = useRef<Record<string, number>>({});

  const esIngreso = tipo === "entrada";
  const colorAccion = esIngreso ? theme.success : theme.danger;
  const iconoAccion = esIngreso ? "add-circle" : "remove-circle";

  // Activa el escáner cuando se abre el modal
  useEffect(() => {
    if (!visible) return;

    const t = setTimeout(() => setEscaneando(true), 800);
    return () => {
      clearTimeout(t);
      setEscaneando(false);
    };
  }, [visible]);

  const totalUnidades = items.reduce((acc, i) => acc + i.cantidad, 0);

  const handleCodigoDetectado = (codigo: string) => {
    if (!escaneando) return;

    // 1) Anti-ráfaga: mismo código dentro de la ventana → ignora
    const ahora = Date.now();
    const ultimo = ultimoScanRef.current[codigo] || 0;
    if (ahora - ultimo < DEBOUNCE_MS) return;
    ultimoScanRef.current[codigo] = ahora;

    // 2) Busca el producto
    const producto = obtenerProductoPorCodigo(codigo);

    if (!producto) {
      Alert.alert(
        "Producto no encontrado",
        `El código "${codigo}" no está registrado.`,
        [{ text: "OK" }],
      );
      return;
    }

    // 3) Valida stock si es retiro
    if (!esIngreso && producto.stock <= 0) {
      Alert.alert(
        "Sin stock",
        `"${producto.nombre}" no tiene stock disponible.`,
      );
      return;
    }

    // 4) Agrega al carrito o incrementa la cantidad
    setItems((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id);
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });

    setUltimoEscaneado(producto.nombre);
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.producto.id === productoId
            ? { ...i, cantidad: Math.max(0, i.cantidad + delta) }
            : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  };

  const eliminarItem = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
  };

  const limpiar = () => {
    setItems([]);
    setNota("");
    setMotivo(esIngreso ? "compra" : "merma");
    setEscaneando(false);
    setUltimoEscaneado(null);
    ultimoScanRef.current = {};
  };

  const handleConfirmar = () => {
    if (items.length === 0) {
      Alert.alert("Sin productos", "Escanea al menos un producto.");
      return;
    }

    if (!esIngreso) {
      const excedido = items.find((i) => i.cantidad > i.producto.stock);
      if (excedido) {
        Alert.alert(
          "Stock insuficiente",
          `"${excedido.producto.nombre}" solo tiene ${excedido.producto.stock} unidades.`,
        );
        return;
      }
    }

    onConfirmar(items, motivo, nota);
    limpiar();
  };

  const handleCerrar = () => {
    if (items.length > 0) {
      Alert.alert(
        "Descartar cambios",
        "¿Seguro que quieres salir? Se perderán los productos escaneados.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salir",
            style: "destructive",
            onPress: () => {
              limpiar();
              onClose();
            },
          },
        ],
      );
    } else {
      limpiar();
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.card, maxHeight: SCREEN_HEIGHT * 0.92 },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                {esIngreso ? "Registrar Ingreso" : "Registrar Retiro"}
              </ThemedText>
              <ThemedText
                type="small"
                style={{
                  color: theme.textSecondary,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                Escanea los productos · se guardarán en un solo movimiento
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleCerrar} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cámara — mismo componente y contrato que en ModalProducto */}
          <ScannerCamara
            visible={true}
            escaneando={escaneando}
            onCodigoDetectado={handleCodigoDetectado}
          />

          {/* Motivo y nota */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <ThemedText type="small" style={styles.label}>
                Motivo
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
                value={motivo}
                onChangeText={setMotivo}
                placeholder="compra, merma, etc."
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={styles.flex1}>
              <ThemedText type="small" style={styles.label}>
                Nota (opcional)
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
                value={nota}
                onChangeText={setNota}
                placeholder="Factura #1234"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Lista de productos escaneados */}
          <View style={styles.listaHeader}>
            <ThemedText type="smallBold">
              Productos escaneados ({items.length})
            </ThemedText>
            {ultimoEscaneado && (
              <ThemedText
                type="small"
                style={{ color: theme.success, fontSize: 11 }}
                numberOfLines={1}
              >
                ✓ {ultimoEscaneado}
              </ThemedText>
            )}
          </View>

          <ScrollView
            style={styles.lista}
            contentContainerStyle={styles.listaContent}
            keyboardShouldPersistTaps="handled"
          >
            {items.length === 0 ? (
              <ThemedText
                type="small"
                style={{
                  color: theme.textSecondary,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                Escanea el primer producto para comenzar
              </ThemedText>
            ) : (
              items.map((item) => (
                <View
                  key={item.producto.id}
                  style={[styles.item, { borderBottomColor: theme.border }]}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {item.producto.nombre}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary, fontSize: 11 }}
                    >
                      Talla {item.producto.talla} · Stock actual:{" "}
                      {item.producto.stock}
                    </ThemedText>
                  </View>

                  <View style={styles.controles}>
                    <TouchableOpacity
                      style={[styles.ctrlBtn, { borderColor: theme.border }]}
                      onPress={() => cambiarCantidad(item.producto.id, -1)}
                    >
                      <Ionicons name="remove" size={14} color={theme.text} />
                    </TouchableOpacity>
                    <ThemedText type="smallBold" style={styles.cantidad}>
                      {item.cantidad}
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.ctrlBtn, { borderColor: theme.border }]}
                      onPress={() => cambiarCantidad(item.producto.id, 1)}
                    >
                      <Ionicons name="add" size={14} color={theme.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => eliminarItem(item.producto.id)}
                      hitSlop={8}
                      style={{ marginLeft: 4 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={theme.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer con totales y acciones */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <View style={styles.totalesRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {items.length} producto{items.length !== 1 ? "s" : ""} ·{" "}
                {totalUnidades} unidad{totalUnidades !== 1 ? "es" : ""}
              </ThemedText>
            </View>

            <View style={styles.botonesRow}>
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
                  styles.btnConfirmar,
                  {
                    backgroundColor:
                      items.length > 0 ? colorAccion : theme.border,
                  },
                ]}
                onPress={handleConfirmar}
                disabled={items.length === 0}
              >
                <Ionicons
                  name={iconoAccion}
                  size={16}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
                <ThemedText type="smallBold" style={{ color: "#FFF" }}>
                  Confirmar ({totalUnidades})
                </ThemedText>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.55)",
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  flex1: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 3,
    marginLeft: 2,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  listaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
    gap: 8,
  },
  lista: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 100,
    maxHeight: 220,
  },
  listaContent: {
    paddingBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  controles: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctrlBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cantidad: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 14,
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 8,
  },
  totalesRow: {
    marginBottom: 8,
    alignItems: "center",
  },
  botonesRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  btnCancel: { borderWidth: 1 },
  btnConfirmar: {},
});
