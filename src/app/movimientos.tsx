import {
  AccionesMovimiento,
  DetalleMovimientoModal,
  FiltrosMovimientos,
  HeaderMetricas,
  ItemMovimiento,
  SesionEscaneo,
} from "@/components/movimientos";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import {
  LoteUI,
  obtenerLotes,
  registrarLote,
} from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TipoFiltro } from "../types/movimientos";

import type { ItemCarrito } from "@/components/movimientos/SesionEscaneo";

export default function MovimientosScreen() {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");
  const [lotes, setLotes] = useState<LoteUI[]>([]);

  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteUI | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [sesionTipo, setSesionTipo] = useState<"entrada" | "salida" | null>(
    null,
  );

  const cargarLotes = useCallback(() => {
    setLotes(obtenerLotes(200));
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

      return (
        l.motivo.toLowerCase().includes(texto) ||
        (l.nota && l.nota.toLowerCase().includes(texto))
      );
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

  const handleIngreso = () => setSesionTipo("entrada");
  const handleRetiro = () => setSesionTipo("salida");

  const confirmarSesion = (
    items: ItemCarrito[],
    motivo: string,
    nota: string,
  ) => {
    if (!sesionTipo) return;

    const loteId = registrarLote({
      tipo: sesionTipo,
      motivo,
      nota,
      items: items.map((i) => ({
        producto_id: i.producto.id,
        cantidad: i.cantidad,
      })),
    });

    if (loteId) {
      Alert.alert(
        "Éxito",
        `Lote registrado con ${items.length} producto${
          items.length !== 1 ? "s" : ""
        }.`,
      );
      setSesionTipo(null);
      cargarLotes();
    } else {
      Alert.alert("Error", "No se pudo registrar el lote.");
    }
  };

  const cerrarSesion = () => setSesionTipo(null);

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <HeaderMetricas gananciaHoy={0} gananciaTotal={0} />

          <AccionesMovimiento
            onIngreso={handleIngreso}
            onRetiro={handleRetiro}
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
              placeholder="Buscar por motivo o nota..."
              placeholderTextColor={theme.textSecondary}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          <View style={styles.section}>
            <FiltrosMovimientos
              filtroActivo={filtro}
              alCambiarFiltro={setFiltro}
            />

            <View style={styles.movementList}>
              {lotesFiltrados.length > 0 ? (
                lotesFiltrados.map((l) => (
                  <ItemMovimiento
                    key={l.id}
                    lote={l}
                    onPress={() => abrirDetalle(l)}
                  />
                ))
              ) : (
                <ThemedText type="small" style={styles.placeholderText}>
                  No hay movimientos registrados.
                </ThemedText>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DetalleMovimientoModal
        visible={modalVisible}
        lote={loteSeleccionado}
        onClose={cerrarDetalle}
      />

      <SesionEscaneo
        visible={sesionTipo !== null}
        tipo={sesionTipo || "entrada"}
        onClose={cerrarSesion}
        onConfirmar={confirmarSesion}
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
