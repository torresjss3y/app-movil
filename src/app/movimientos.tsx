import { AccionesMovimiento, DetalleMovimientoModal, FiltrosMovimientos, HeaderMetricas, ItemMovimiento, ModalMovimientoRapido } from "@/components/movimientos";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { LoteUI, MetricasResumen, obtenerLotes, obtenerMetricas } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TipoFiltro } from "../types/movimientos";

export default function MovimientosScreen() {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");
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

  const cargarLotes = useCallback(() => {
    setLotes(obtenerLotes(200));
    setMetricas(obtenerMetricas());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarLotes();
    }, [cargarLotes]),
  );

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
          {/* 1. Métricas */}
          <HeaderMetricas metricas={metricas} />

          {/* 2. Búsqueda + Filtros */}
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

            <FiltrosMovimientos filtroActivo={filtro} alCambiarFiltro={setFiltro} />
          </View>

          {/* 3. Ingreso / Retiro */}
          <AccionesMovimiento onIngreso={abrirIngreso} onRetiro={abrirRetiro} />

          {/* 4. Lista de movimientos */}
          <View style={styles.movementList}>
            {lotesFiltrados.length > 0 ? (
              lotesFiltrados.map((l) => <ItemMovimiento key={l.id} lote={l} onPress={() => abrirDetalle(l)} />)
            ) : (
              <ThemedText type="small" style={styles.placeholderText}>
                No hay movimientos registrados.
              </ThemedText>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <ModalMovimientoRapido key={movimientoModo ?? "cerrado"} visible={movimientoModo !== null} modo={movimientoModo ?? "entrada"} onClose={cerrarMovimiento} onSuccess={cargarLotes} />

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
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  section: { gap: Spacing.two },
  movementList: { gap: Spacing.two },
  placeholderText: {
    opacity: 0.6,
    textAlign: "center",
    marginVertical: 12,
  },
});
