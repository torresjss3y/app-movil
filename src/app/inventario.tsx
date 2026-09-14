import ModalCrearProducto from "@/components/modalInventarioScanner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { obtenerProductos, ProductoDB } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InventarioScreen() {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Estado que se llena directamente desde SQLite
  const [productos, setProductos] = useState<ProductoDB[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<"todos" | "bajo" | "agotado">(
    "todos",
  );

  // Carga productos desde SQLite
  const cargarProductos = useCallback(() => {
    const data = obtenerProductos();
    setProductos(data);
  }, []);

  // Recarga la lista automáticamente cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [cargarProductos]),
  );

  // Filtrado síncrono sobre la lista traída de la BD
  const productosFiltrados = productos.filter((item) => {
    const texto = busqueda.toLowerCase();

    const coincideTexto =
      item.nombre.toLowerCase().includes(texto) ||
      (item.codigo_barras &&
        item.codigo_barras.toLowerCase().includes(texto)) ||
      (item.marca && item.marca.toLowerCase().includes(texto)) ||
      (item.talla && item.talla.toLowerCase().includes(texto));

    if (!coincideTexto) return false;

    const stockMinimo = item.stock_minimo ?? 2;

    if (filtroStock === "bajo") {
      return item.stock > 0 && item.stock <= stockMinimo;
    }

    if (filtroStock === "agotado") {
      return item.stock === 0;
    }

    return true;
  });

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Botón para abrir Modal de Creación */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <ThemedText type="smallBold" style={styles.addButtonText}>
            + Agregar Zapatilla
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.danger }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <ThemedText type="smallBold" style={styles.addButtonText}>
            modal de prueba
          </ThemedText>
        </TouchableOpacity>

        {/* Buscador */}
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
            placeholder="Buscar por nombre, código, marca o talla..."
            placeholderTextColor={theme.textSecondary}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {/* Filtros rápidos por Stock */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: theme.border },
              filtroStock === "todos" && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setFiltroStock("todos")}
          >
            <ThemedText
              type="small"
              style={
                filtroStock === "todos"
                  ? styles.chipTextActive
                  : [styles.chipText, { color: theme.textSecondary }]
              }
            >
              Todos
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: theme.border },
              filtroStock === "bajo" && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setFiltroStock("bajo")}
          >
            <ThemedText
              type="small"
              style={
                filtroStock === "bajo"
                  ? styles.chipTextActive
                  : [styles.chipText, { color: theme.textSecondary }]
              }
            >
              Stock Bajo
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: theme.border },
              filtroStock === "agotado" && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setFiltroStock("agotado")}
          >
            <ThemedText
              type="small"
              style={
                filtroStock === "agotado"
                  ? styles.chipTextActive
                  : [styles.chipText, { color: theme.textSecondary }]
              }
            >
              Agotados
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Lista desde SQLite */}
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const stockMinimo = item.stock_minimo ?? 2;

            return (
              <TouchableOpacity activeOpacity={0.75}>
                <ThemedView
                  style={[
                    styles.cardProduct,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.card,
                    },
                  ]}
                >
                  <View style={styles.productInfo}>
                    <ThemedText type="smallBold">
                      {item.nombre} {item.marca ? `(${item.marca})` : ""}
                    </ThemedText>

                    <ThemedText
                      type="small"
                      style={[styles.codeText, { color: theme.textSecondary }]}
                    >
                      Talla: {item.talla}{" "}
                      {item.color ? `| Color: ${item.color}` : ""}
                    </ThemedText>

                    {item.codigo_barras && (
                      <ThemedText
                        type="small"
                        style={[
                          styles.codeText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        CÓD: {item.codigo_barras}
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.productDetails}>
                    <ThemedText type="smallBold">
                      S/ {item.precio_venta.toFixed(2)}
                    </ThemedText>

                    <ThemedText
                      type="small"
                      style={{
                        color:
                          item.stock === 0
                            ? theme.danger
                            : item.stock <= stockMinimo
                              ? theme.warning
                              : theme.success,
                      }}
                    >
                      {item.stock === 0 ? "Agotado" : `Stock: ${item.stock}`}
                    </ThemedText>
                  </View>
                </ThemedView>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                No hay productos en la base de datos.
              </ThemedText>
            </ThemedView>
          }
        />

        {/* Modal para Crear y Recargar la BD */}
        <ModalCrearProducto
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={cargarProductos}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  sectionMargin: {
    marginBottom: Spacing.two,
  },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  addButton: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    opacity: 0.8,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  cardProduct: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  productInfo: {
    gap: 3,
    flex: 1,
    paddingRight: Spacing.two,
  },
  productDetails: {
    alignItems: "flex-end",
    gap: 4,
  },
  codeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    padding: Spacing.four,
    alignItems: "center",
  },
});
