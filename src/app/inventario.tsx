import { FiltrosInventario, FiltroStock, HeaderInventario, ItemProducto, ModalProducto } from "@/components/inventario";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { obtenerProductos, ProductoDB } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InventarioScreen() {
  const theme = useTheme();

  const [productos, setProductos] = useState<ProductoDB[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("todos");

  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoDB | null>(null);

  const cargarProductos = useCallback(() => {
    setProductos(obtenerProductos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [cargarProductos]),
  );

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((item) => {
      const coincideTexto =
        item.nombre.toLowerCase().includes(texto) ||
        (item.codigo_barras && item.codigo_barras.toLowerCase().includes(texto)) ||
        (item.marca && item.marca.toLowerCase().includes(texto)) ||
        item.atributos.some((atributo) => atributo.clave.toLowerCase().includes(texto) || atributo.valor.toLowerCase().includes(texto));

      if (!coincideTexto) return false;

      if (filtroStock === "inactivos") return item.activo === 0;
      if (item.activo !== 1) return false;

      const stockMinimo = 2;

      if (filtroStock === "bajo") return item.stock > 0 && item.stock <= stockMinimo;
      if (filtroStock === "agotado") return item.stock === 0;
      return true;
    });
  }, [productos, busqueda, filtroStock]);

  const contadores = useMemo(() => {
    const activos = productos.filter((p) => p.activo === 1);
    return {
      todos: activos.length,
      bajo: activos.filter((p) => p.stock > 0 && p.stock <= 2).length,
      agotado: activos.filter((p) => p.stock === 0).length,
      inactivos: productos.filter((p) => p.activo === 0).length,
    };
  }, [productos]);

  const abrirNuevo = () => {
    setProductoEditando(null);
    setModalVisible(true);
  };

  const abrirEditar = (p: ProductoDB) => {
    setProductoEditando(p);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setProductoEditando(null);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <HeaderInventario totalActivos={contadores.todos} />

        <View style={styles.sectionMargin}>
          <TextInput
            style={[
              styles.searchInput,
              {
                borderColor: theme.border,
                backgroundColor: theme.input,
                color: theme.text,
              },
            ]}
            placeholder="Buscar producto, marca o atributo..."
            placeholderTextColor={theme.textSecondary}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <FiltrosInventario filtroActual={filtroStock} onCambiar={setFiltroStock} contadores={contadores} />

        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          renderItem={({ item }) => <ItemProducto producto={item} onRefresh={cargarProductos} onEditar={abrirEditar} />}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={40} color={theme.textSecondary} />
              <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginTop: 8 }}>
                Sin productos
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                Prueba con otro filtro o agrega uno nuevo.
              </ThemedText>
            </ThemedView>
          }
        />

        {/* Botón flotante: Nuevo producto (cómodo para el pulgar) */}
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={abrirNuevo} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Nuevo producto">
          <Ionicons name="add" size={22} color="#FFF" />
          <ThemedText type="smallBold" style={{ color: "#FFF", marginLeft: 6 }}>
            Nuevo producto
          </ThemedText>
        </TouchableOpacity>

        <ModalProducto key={productoEditando?.id ?? "nuevo"} visible={modalVisible} onClose={cerrarModal} onSuccess={cargarProductos} productoEditar={productoEditando} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  sectionMargin: { marginBottom: Spacing.two },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: BottomTabInset + 72,
    gap: 8,
  },
  emptyContainer: {
    padding: Spacing.four,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.two,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
