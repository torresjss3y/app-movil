import {
  Contadores,
  FiltrosInventario,
  FiltroStock,
} from "@/components/inventario/FiltrosInventario";
import { HeaderInventario } from "@/components/inventario/HeaderInventario";
import { ItemProducto } from "@/components/inventario/ItemProducto";
import ModalCrearProducto from "@/components/modalInventarioScanner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { obtenerProductos, ProductoDB } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Keyboard, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InventarioScreen() {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoDB | null>(
    null,
  );

  const [productos, setProductos] = useState<ProductoDB[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("todos");

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
        (item.codigo_barras &&
          item.codigo_barras.toLowerCase().includes(texto)) ||
        (item.marca && item.marca.toLowerCase().includes(texto)) ||
        (item.talla && item.talla.toLowerCase().includes(texto));

      if (!coincideTexto) return false;

      if (filtroStock === "inactivos") return item.activo === 0;
      if (item.activo !== 1) return false;

      const stockMinimo = item.stock_minimo ?? 2;

      if (filtroStock === "bajo")
        return item.stock > 0 && item.stock <= stockMinimo;
      if (filtroStock === "agotado") return item.stock === 0;
      return true;
    });
  }, [productos, busqueda, filtroStock]);

  const contadores: Contadores = useMemo(() => {
    const activos = productos.filter((p) => p.activo === 1);
    return {
      todos: activos.length,
      bajo: activos.filter(
        (p) => p.stock > 0 && p.stock <= (p.stock_minimo ?? 2),
      ).length,
      agotado: activos.filter((p) => p.stock === 0).length,
      inactivos: productos.filter((p) => p.activo === 0).length,
    };
  }, [productos]);

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <HeaderInventario
          totalActivos={contadores.todos}
          onAgregar={() => setModalVisible(true)}
        />

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
            placeholder="Buscar producto, marca, talla..."
            placeholderTextColor={theme.textSecondary}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <FiltrosInventario
          filtroActual={filtroStock}
          onCambiar={setFiltroStock}
          contadores={contadores}
        />

        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          renderItem={({ item }) => (
            <ItemProducto
              producto={item}
              onRefresh={cargarProductos}
              onEditar={(p) => {
                setProductoEditando(p);
                setModalVisible(true);
              }}
            />
          )}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <ThemedText
                style={{ fontSize: 40, marginBottom: 8 }}
              ></ThemedText>
              <ThemedText
                type="smallBold"
                style={{ color: theme.textSecondary }}
              >
                Sin productos
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginTop: 4 }}
              >
                Prueba con otro filtro o agrega uno nuevo.
              </ThemedText>
            </ThemedView>
          }
        />

        <ModalCrearProducto
          key={productoEditando?.id ?? "nuevo"}
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setProductoEditando(null);
          }}
          onSuccess={cargarProductos}
          productoEditar={productoEditando}
        />
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
    paddingHorizontal: Spacing.four,
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
    paddingBottom: Spacing.four,
    gap: 8,
  },
  emptyContainer: {
    padding: Spacing.four,
    alignItems: "center",
  },
});
