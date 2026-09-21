import { ThemedText } from "@/components/themed-text";
import { FiltrosFecha, ResumenVentas } from "@/components/ventas/FiltrosFecha";
import { ModalVentas } from "@/components/ventas/ModalVentas";
import { TicketVenta } from "@/components/ventas/TicketVenta";
import { BottomTabInset, ListItemHeight, Spacing } from "@/constants/theme";
import { calcularRango, exportarCsvVentas, listarVentas, obtenerReporteVentas, obtenerVentaCompleta, RangoFecha, ReporteVentas, VentaCompleta, VentaResumen } from "@/database/ventaService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VentasScreen() {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [ticket, setTicket] = useState<VentaCompleta | null>(null);
  const [rango, setRango] = useState<RangoFecha>("hoy");
  const [exportando, setExportando] = useState(false);
  const [reporte, setReporte] = useState<ReporteVentas>({ totalVendido: 0, totalGanancia: 0, totalVentas: 0, totalUnidades: 0 });

  const cargarVentas = useCallback((rangoActual: RangoFecha) => {
    const { desde, hasta } = calcularRango(rangoActual);
    setVentas(listarVentas(500, desde, hasta));
    setReporte(obtenerReporteVentas(desde, hasta));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarVentas(rango);
    }, [cargarVentas, rango]),
  );

  const cambiarRango = (nuevo: RangoFecha) => {
    setRango(nuevo);
    cargarVentas(nuevo);
  };

  const compartirReporte = async () => {
    try {
      setExportando(true);
      const { desde, hasta } = calcularRango(rango);
      await exportarCsvVentas(desde, hasta, rango);
    } finally {
      setExportando(false);
    }
  };

  const abrirTicket = (ventaId: string) => {
    setTicket(obtenerVentaCompleta(ventaId));
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Ventas</ThemedText>
      </View>

      <View style={styles.reportesWrapper}>
        <ResumenVentas totalVendido={reporte.totalVendido} totalGanancia={reporte.totalGanancia} totalVentas={reporte.totalVentas} totalUnidades={reporte.totalUnidades} />

        <FiltrosFecha rangoActual={rango} onCambiar={cambiarRango} />

        <TouchableOpacity style={[styles.btnExportar, { borderColor: theme.border, opacity: ventas.length === 0 || exportando ? 0.5 : 1 }]} onPress={compartirReporte} disabled={ventas.length === 0 || exportando} activeOpacity={0.8}>
          {exportando ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="download-outline" size={18} color={theme.primary} />}
          <ThemedText type="smallBold" style={{ color: theme.primary, marginLeft: 6 }}>
            {exportando ? "Exportando..." : "Exportar reporte (CSV)"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ventas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={ventas.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 8, textAlign: "center" }}>
              Aún no hay ventas registradas.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.ventaRow, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => abrirTicket(item.id)} activeOpacity={0.75}>
            <View style={styles.ventaIcon}>
              <Ionicons name="receipt-outline" size={20} color={theme.success} />
            </View>
            <View style={styles.ventaInfo}>
              <ThemedText type="smallBold">{item.id}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.total_items} {item.total_items === 1 ? "producto" : "productos"} · {item.total_unidades} u. · {item.metodo_pago}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color: theme.success }}>
              S/ {item.total.toFixed(2)}
            </ThemedText>
          </TouchableOpacity>
        )}
      />

      {/* Botón flotante: Nueva venta (cómodo para el pulgar) */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.success ?? "#30A46C" }]} onPress={() => setModalVisible(true)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Nueva venta">
        <Ionicons name="add" size={22} color="#FFF" />
        <ThemedText type="smallBold" style={{ color: "#FFF", marginLeft: 6 }}>
          Nueva venta
        </ThemedText>
      </TouchableOpacity>

      <ModalVentas key={modalVisible ? "abierto" : "cerrado"} visible={modalVisible} onClose={() => setModalVisible(false)} onSuccess={() => cargarVentas(rango)} />
      <TicketVenta visible={ticket !== null} venta={ticket} onClose={() => setTicket(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
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
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + 72,
    gap: Spacing.two,
  },
  reportesWrapper: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  btnExportar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  emptyList: { flexGrow: 1, paddingHorizontal: Spacing.three, paddingBottom: BottomTabInset + 72 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    gap: 12,
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
  ventaRow: {
    minHeight: ListItemHeight,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  ventaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(48, 164, 108, 0.14)",
  },
  ventaInfo: { flex: 1, minWidth: 0, gap: 2 },
});
