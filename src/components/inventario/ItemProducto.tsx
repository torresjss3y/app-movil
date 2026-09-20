import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { desactivarProducto, eliminarProducto, ProductoDB } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Dialog from "react-native-dialog";

interface Props {
  producto: ProductoDB;
  onRefresh: () => void;
  onEditar: (producto: ProductoDB) => void;
}

const STOCK_MINIMO = 2;

export const ItemProducto = memo(function ItemProducto({ producto, onRefresh, onEditar }: Props) {
  const theme = useTheme();
  const sinStock = producto.stock === 0;
  const bajoStock = !sinStock && producto.stock <= STOCK_MINIMO;

  // --- Estados de los diálogos ---
  const [opcionesVisible, setOpcionesVisible] = useState(false);
  const [confirmarEliminarVisible, setConfirmarEliminarVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoMensaje, setInfoMensaje] = useState("");

  // --- Acciones ---
  const abrirOpciones = () => setOpcionesVisible(true);

  const handleEditar = () => {
    setOpcionesVisible(false);
    onEditar(producto);
  };

  const handleEliminarPaso1 = () => {
    setOpcionesVisible(false);
    setTimeout(() => setConfirmarEliminarVisible(true), 150);
  };

  const handleDesactivar = () => {
    setOpcionesVisible(false);
    if (desactivarProducto(producto.id)) {
      setInfoMensaje("Producto desactivado. Puedes verlo desde el filtro de inactivos.");
      setInfoVisible(true);
      onRefresh();
    } else {
      setInfoMensaje("No se pudo desactivar el producto.");
      setInfoVisible(true);
    }
  };

  const confirmarEliminacionDefinitiva = () => {
    setConfirmarEliminarVisible(false);

    if (eliminarProducto(producto.id)) {
      setInfoMensaje("Producto eliminado por completo.");
      setInfoVisible(true);
      onRefresh();
    } else {
      setInfoMensaje("No se pudo eliminar. Si tiene ventas registradas, desactívalo en su lugar.");
      setInfoVisible(true);
    }
  };

  // --- Cálculos derivados ---
  const colorStock = sinStock ? theme.danger : bajoStock ? theme.warning : theme.success;

  const colorFondoStock = sinStock ? theme.danger + "22" : bajoStock ? theme.warning + "22" : theme.success + "22";

  const etiquetaStock = sinStock ? "AGOTADO" : `${producto.stock} u.`;

  const subtexto = [producto.marca, producto.categoria].filter(Boolean).join(" · ") || "Sin marca";

  const atributosTexto = producto.atributos.length > 0 ? producto.atributos.map((a) => `${a.clave}: ${a.valor}`).join(" · ") : null;

  const mensajeOpciones = `¿Qué acción deseas realizar sobre "${producto.nombre}"?`;
  const mensajeEliminar = `Se eliminará "${producto.nombre}" por completo. Esta acción no se puede deshacer.`;

  return (
    <>
      <ThemedView style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        {/* Ícono de estado a la izquierda */}
        <View style={[styles.iconCircle, { backgroundColor: colorFondoStock }]}>
          <Ionicons name={sinStock ? "alert-circle" : bajoStock ? "warning" : "cube"} size={20} color={colorStock} />
        </View>

        {/* Contenido central */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {producto.nombre}
            </ThemedText>
            {sinStock && (
              <View style={[styles.badge, { backgroundColor: theme.danger + "22" }]}>
                <ThemedText type="small" style={[styles.badgeText, { color: theme.danger }]}>
                  SIN STOCK
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText type="small" numberOfLines={1} style={[styles.sub, { color: theme.textSecondary }]}>
            {subtexto}
          </ThemedText>

          {atributosTexto && (
            <ThemedText type="small" numberOfLines={1} style={[styles.atributos, { color: theme.textTertiary }]}>
              {atributosTexto}
            </ThemedText>
          )}
        </View>

        {/* Precio + stock a la derecha */}
        <View style={styles.right}>
          <ThemedText type="smallBold" style={[styles.precio, { color: theme.text }]}>
            S/ {producto.precio_venta.toFixed(2)}
          </ThemedText>
          <ThemedText type="small" style={[styles.stock, { color: colorStock }]}>
            {etiquetaStock}
          </ThemedText>
        </View>

        {/* Botón opciones */}
        <TouchableOpacity style={[styles.optionsBtn, { borderColor: theme.border }]} onPress={abrirOpciones} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Opciones para ${producto.nombre}`}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </ThemedView>

      {/* --- Diálogo: Opciones --- */}
      <Dialog.Container visible={opcionesVisible} onBackdropPress={() => setOpcionesVisible(false)} contentStyle={{ backgroundColor: theme.card, borderRadius: 16 }}>
        <Dialog.Title style={{ color: theme.text }}>Opciones</Dialog.Title>
        <Dialog.Description style={{ color: theme.textSecondary }}>{mensajeOpciones}</Dialog.Description>

        <Dialog.Button label="Editar" color={theme.primary ?? "#3B82F6"} onPress={handleEditar} />
        {producto.activo === 1 && <Dialog.Button label="Desactivar" color={theme.warning} onPress={handleDesactivar} />}
        <Dialog.Button label="Eliminar" color={theme.danger} onPress={handleEliminarPaso1} />
        <Dialog.Button label="Cancelar" color={theme.textSecondary} onPress={() => setOpcionesVisible(false)} />
      </Dialog.Container>

      {/* --- Diálogo: Confirmar eliminación --- */}
      <Dialog.Container visible={confirmarEliminarVisible} onBackdropPress={() => setConfirmarEliminarVisible(false)} contentStyle={{ backgroundColor: theme.card, borderRadius: 16 }}>
        <Dialog.Title style={{ color: theme.text }}>Eliminar definitivamente</Dialog.Title>
        <Dialog.Description style={{ color: theme.textSecondary }}>{mensajeEliminar}</Dialog.Description>

        <Dialog.Button label="Cancelar" color={theme.textSecondary} onPress={() => setConfirmarEliminarVisible(false)} />
        <Dialog.Button label="Sí, eliminar" color={theme.danger} onPress={confirmarEliminacionDefinitiva} />
      </Dialog.Container>

      {/* --- Diálogo: Info / Error --- */}
      <Dialog.Container visible={infoVisible} onBackdropPress={() => setInfoVisible(false)} contentStyle={{ backgroundColor: theme.card, borderRadius: 16 }}>
        <Dialog.Title style={{ color: theme.text }}>Aviso</Dialog.Title>
        <Dialog.Description style={{ color: theme.textSecondary }}>{infoMensaje}</Dialog.Description>
        <Dialog.Button label="OK" color={theme.primary ?? "#3B82F6"} onPress={() => setInfoVisible(false)} />
      </Dialog.Container>
    </>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 11,
  },
  atributos: {
    fontSize: 10,
    marginTop: 1,
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  precio: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  stock: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  optionsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.one,
  },
});
