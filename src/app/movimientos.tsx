import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
// IMPORTAS TU MODAL EXTERNO AQUÍ:
import { DetalleMovimientoModal } from "@/components/DetalleMovimientoModal";
import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Movimiento, TipoFiltro } from "@/types/moviminetos";

const MOCK_MOVIMIENTOS: Movimiento[] = [
  {
    id: "1",
    ticket: "Venta #001",
    tipo: "venta",
    monto: "+$94.30", // Suma exacta de los 15 productos distintos
    hora: "08:15 AM",
    modoPago: "Efectivo",
    productos: [
      {
        id: "1",
        codigo: "75012345",
        nombre: "Arroz Extra 1kg",
        precio: 4.5,
        cantidad: 1,
        subtotal: 4.5,
      },
      {
        id: "2",
        codigo: "75098765",
        nombre: "Aceite Vegetal 1L",
        precio: 8.9,
        cantidad: 1,
        subtotal: 8.9,
      },
      {
        id: "3",
        codigo: "75011122",
        nombre: "Leche Entera 900ml",
        precio: 3.8,
        cantidad: 1,
        subtotal: 3.8,
      },
      {
        id: "4",
        codigo: "75033344",
        nombre: "Fideos Tallarín 500g",
        precio: 2.2,
        cantidad: 1,
        subtotal: 2.2,
      },
      {
        id: "5",
        codigo: "75044455",
        nombre: "Azúcar Rubia 1kg",
        precio: 3.9,
        cantidad: 1,
        subtotal: 3.9,
      },
      {
        id: "6",
        codigo: "75055566",
        nombre: "Café Instantáneo 200g",
        precio: 14.5,
        cantidad: 1,
        subtotal: 14.5,
      },
      {
        id: "7",
        codigo: "75066677",
        nombre: "Detergente en Polvo 800g",
        precio: 7.2,
        cantidad: 1,
        subtotal: 7.2,
      },
      {
        id: "8",
        codigo: "75077788",
        nombre: "Atún en Trozos 170g",
        precio: 5.5,
        cantidad: 1,
        subtotal: 5.5,
      },
      {
        id: "9",
        codigo: "75088899",
        nombre: "Jabón de Tocador 120g",
        precio: 2.8,
        cantidad: 1,
        subtotal: 2.8,
      },
      {
        id: "10",
        codigo: "75099900",
        nombre: "Agua Mineral Sin Gas 2L",
        precio: 2.5,
        cantidad: 1,
        subtotal: 2.5,
      },
      {
        id: "11",
        codigo: "75010101",
        nombre: "Galletas de Chocolate 150g",
        precio: 1.8,
        cantidad: 1,
        subtotal: 1.8,
      },
      {
        id: "12",
        codigo: "75020202",
        nombre: "Mantequilla 200g",
        precio: 6.4,
        cantidad: 1,
        subtotal: 6.4,
      },
      {
        id: "13",
        codigo: "75030303",
        nombre: "Queso Edam 250g",
        precio: 12.0,
        cantidad: 1,
        subtotal: 12.0,
      },
      {
        id: "14",
        codigo: "75040404",
        nombre: "Yogurt Fresa 1L",
        precio: 5.8,
        cantidad: 1,
        subtotal: 5.8,
      },
      {
        id: "15",
        codigo: "75050505",
        nombre: "Pan Molde Integral",
        precio: 12.5,
        cantidad: 1,
        subtotal: 12.5,
      },
    ],
  },
];
function FiltroMovimientos({
  filtroActivo,
  alCambiarFiltro,
}: {
  filtroActivo: TipoFiltro;
  alCambiarFiltro: (nuevoFiltro: TipoFiltro) => void;
}) {
  const theme = useTheme() as typeof Colors.light;

  const opciones: { key: TipoFiltro; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "ventas", label: "Ventas" },
    { key: "entradas", label: "Entradas" },
    { key: "retiros", label: "Retiros" },
  ];

  return (
    <View style={styles.filtrosContainer}>
      {opciones.map((opcion) => {
        const estaActivo = filtroActivo === opcion.key;
        return (
          <TouchableOpacity
            key={opcion.key}
            activeOpacity={0.7}
            onPress={() => alCambiarFiltro(opcion.key)}
            style={[
              styles.filtroBoton,
              {
                borderColor: estaActivo ? theme.primary : theme.border,
                backgroundColor: estaActivo
                  ? theme.primary
                  : theme.backgroundElement || theme.card,
              },
            ]}
          >
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              style={[
                styles.filtroTexto,
                { color: estaActivo ? theme.textInverse : theme.textSecondary },
              ]}
            >
              {opcion.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");

  // Estado simple para controlar el modal
  const [movimientoSeleccionado, setMovimientoSeleccionado] =
    useState<Movimiento | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const abrirDetalle = (movimiento: Movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setModalVisible(true);
  };

  const cerrarDetalle = () => {
    setModalVisible(false);
    setMovimientoSeleccionado(null);
  };

  const movimientosFiltrados = MOCK_MOVIMIENTOS.filter((item) => {
    if (filtro === "ventas" && item.tipo !== "venta") return false;
    if (filtro === "entradas" && item.tipo !== "entrada") return false;
    if (filtro === "retiros" && item.tipo !== "baja") return false;

    const texto = busqueda.toLowerCase().trim();
    if (!texto) return true;

    return (
      item.ticket.toLowerCase().includes(texto) ||
      item.monto.toLowerCase().includes(texto) ||
      item.productos.some((p) => p.nombre.toLowerCase().includes(texto))
    );
  });

  const theme = useTheme() as typeof Colors.light;

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Métricas */}
          <View style={styles.metricsRow}>
            <ThemedView style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.metricLabel}>
                Ganancias de Hoy
              </ThemedText>
              <ThemedText
                type="smallBold"
                style={[styles.successValue, { color: theme.success }]}
              >
                $12.30
              </ThemedText>
            </ThemedView>
            <ThemedView style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.metricLabel}>
                Ganancia Total
              </ThemedText>
              <ThemedText
                type="smallBold"
                style={[styles.successValue, { color: theme.success }]}
              >
                $120.50
              </ThemedText>
            </ThemedView>
          </View>

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
              placeholder="Buscar por nombre, ticket o código..."
              placeholderTextColor={theme.textSecondary}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          {/* Movimientos */}
          <View style={styles.section}>
            <FiltroMovimientos
              filtroActivo={filtro}
              alCambiarFiltro={setFiltro}
            />

            <View style={styles.movementList}>
              {movimientosFiltrados.length > 0 ? (
                movimientosFiltrados.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => abrirDetalle(item)}
                  >
                    <ThemedView
                      style={[
                        styles.cardProduct,
                        { borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.productInfo}>
                        <ThemedText type="smallBold">{item.ticket}</ThemedText>
                        <ThemedText type="small" style={styles.codeText}>
                          {item.hora}
                        </ThemedText>
                      </View>
                      <View style={styles.productDetails}>
                        <ThemedText
                          type="smallBold"
                          style={[
                            styles.incomeText,
                            {
                              color:
                                item.tipo === "baja"
                                  ? "#e11d48"
                                  : theme.success,
                            },
                          ]}
                        >
                          {item.monto}
                        </ThemedText>
                        <ThemedText type="small" style={styles.linkText}>
                          Ver Detalles
                        </ThemedText>
                      </View>
                    </ThemedView>
                  </TouchableOpacity>
                ))
              ) : (
                <ThemedText type="small" style={styles.placeholderText}>
                  No se encontraron movimientos con este filtro
                </ThemedText>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* MODAL EXTERNO REUTILIZABLE */}
      <DetalleMovimientoModal
        visible={modalVisible}
        movimiento={movimientoSeleccionado}
        onClose={cerrarDetalle}
      />
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  sectionMargin: { marginBottom: Spacing.two },
  card: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    gap: Spacing.one,
    alignItems: "center",
    justifyContent: "center",
  },
  cardProduct: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricsRow: { flexDirection: "row", gap: Spacing.two },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  section: { gap: Spacing.two },
  filtrosContainer: {
    width: "100%",
    flexDirection: "row",
    gap: Spacing.one,
    paddingVertical: 4,
    marginBottom: 4,
  },
  filtroBoton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filtroTexto: { fontSize: 12 },
  movementList: { gap: Spacing.two },
  productInfo: { gap: 2, flex: 1 },
  productDetails: { alignItems: "flex-end", gap: 2 },
  metricLabel: { opacity: 0.7 },
  successValue: { color: "#0E7490" },
  incomeText: { color: "#0E7490" },
  linkText: { opacity: 0.7, textDecorationLine: "underline" },
  codeText: { opacity: 0.6 },
  placeholderText: { opacity: 0.6, textAlign: "center", marginVertical: 12 },
});
