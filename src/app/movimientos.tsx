import { AccionesMovimiento, DetalleMovimientoModal, FiltrosFechaMovimientos, FiltrosMovimientos, HeaderMetricas, ItemMovimiento, ModalMovimientoRapido } from "@/components/movimientos";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { LoteUI, MetricasResumen, obtenerLotes, obtenerMetricas } from "@/database/productosService";
import { calcularRango, RangoFecha } from "@/database/ventaService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TipoFiltro } from "../types/movimientos";

export default function MovimientosScreen() {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");
  const [rango, setRango] = useState<RangoFecha>("hoy");
  const [lotes, setLotes] = useState<LoteUI[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteUI | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [movimientoModo, setMovimientoModo] = useState<"entrada" | "salida" | null>(null);

  const [metricas, setMetricas] = useState<MetricasResumen>({
    gananciaHoy: 0,
    gananciaTotal: 0,
    unidadesVendidasHoy: 0,
    unidadesVendidasTotal: 0,
    valorInventarioVenta: 0,
    valorInventarioCosto: 0,
    totalProductos: 0,
    productosBajoStock: 0,
  });

  const cargarLotes = useCallback((rangoActual: RangoFecha) => {
    const { desde, hasta } = calcularRango(rangoActual);
    setLotes(obtenerLotes(200, desde, hasta));
    setMetricas(obtenerMetricas());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarLotes(rango);
    }, [cargarLotes, rango]),
  );

  const cambiarRango = (nuevo: RangoFecha) => {
    setRango(nuevo);
    cargarLotes(nuevo);
  };

  const lotesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return lotes.filter((l) => {
      if (filtro === "entradas" && l.tipo !== "entrada") return false;
      if (filtro === "retiros" && l.tipo !== "salida") return false;
      if (filtro === "ajustes" && l.tipo !== "ajuste") return false;

      if (!texto) return true;

      return l.motivo.toLowerCase().includes(texto) || (l.nota?.toLowerCase().includes(texto) ?? false) || (l.productos_nombres?.toLowerCase().includes(texto) ?? false);
    });
  }, [lotes, busqueda, filtro]);

  const abrirDetalle = (l: LoteUI) => {
    setLoteSeleccionado(l);
    setModalVisible(true);
  };

  const cerrarDetalle = () => {
    setModalVisible(false);
    setLoteSeleccionado(null);
  };

  const abrirIngreso = () => setMovimientoModo("entrada");
  const abrirRetiro = () => setMovimientoModo("salida");
  const cerrarMovimiento = () => setMovimientoModo(null);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. Título + contador */}
          <View style={styles.header}>
            <ThemedText type="subtitle">Movimientos</ThemedText>
            <View style={[styles.headerBadge, { backgroundColor: theme.backgroundMuted, borderColor: theme.border }]}>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                {lotes.length}
              </ThemedText>
            </View>
          </View>

          {/* 2. Métricas */}
          <HeaderMetricas metricas={metricas} />

          {/* 3. Ingreso / Retiro */}
          <AccionesMovimiento onIngreso={abrirIngreso} onRetiro={abrirRetiro} />

          {/* 4. Búsqueda + Filtros */}
          <View style={styles.section}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.input,
                  color: theme.text,
                },
              ]}
              placeholder="Buscar por motivo, nota o producto..."
              placeholderTextColor={theme.textSecondary}
              value={busqueda}
              onChangeText={setBusqueda}
            />

            <FiltrosFechaMovimientos rangoActual={rango} onCambiar={cambiarRango} />

            <View style={styles.filtrosSpacer} />

            <FiltrosMovimientos filtroActivo={filtro} alCambiarFiltro={setFiltro} />
          </View>

          {/* 5. Lista de movimientos */}
          <View style={styles.movementList}>
            {lotesFiltrados.length > 0 ? (
              lotesFiltrados.map((l) => <ItemMovimiento key={l.id} lote={l} onPress={() => abrirDetalle(l)} />)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="swap-horizontal-outline" size={40} color={theme.textSecondary} />
                <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginTop: 8 }}>
                  No hay movimientos
                </ThemedText>
                <ThemedText type="small" style={styles.placeholderText}>
                  Registra un ingreso o retiro para comenzar.
                </ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <ModalMovimientoRapido key={movimientoModo ?? "cerrado"} visible={movimientoModo !== null} modo={movimientoModo ?? "entrada"} onClose={cerrarMovimiento} onSuccess={() => cargarLotes(rango)} />

      <DetalleMovimientoModal visible={modalVisible} lote={loteSeleccionado} onClose={cerrarDetalle} />
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  headerBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.five,
  },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  section: { gap: Spacing.two },
  filtrosSpacer: { height: Spacing.two },
  movementList: { gap: Spacing.two },
  placeholderText: {
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
  },
});
