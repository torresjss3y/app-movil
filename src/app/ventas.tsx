import { ThemedText } from "@/components/themed-text";
import { ModalVentas } from "@/components/ventas/ModalVentas";
import { TicketVenta } from "@/components/ventas/TicketVenta";
import { Spacing } from "@/constants/theme";
import { listarVentas, obtenerVentaCompleta, VentaCompleta, VentaResumen } from "@/database/ventaService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VentasScreen() {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [ticket, setTicket] = useState<VentaCompleta | null>(null);

  const cargarVentas = useCallback(() => {
    setVentas(listarVentas(100));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarVentas();
    }, [cargarVentas]),
  );

  const abrirTicket = (ventaId: string) => {
    setTicket(obtenerVentaCompleta(ventaId));
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Ventas</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {ventas.length} {ventas.length === 1 ? "venta registrada" : "ventas registradas"}
          </ThemedText>
        </View>
        <TouchableOpacity style={[styles.btnNuevaVenta, { backgroundColor: theme.success ?? "#30A46C" }]} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <ThemedText type="smallBold" style={{ color: "#FFF", marginLeft: 6 }}>
            Nueva venta
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

      <ModalVentas key={modalVisible ? "abierto" : "cerrado"} visible={modalVisible} onClose={() => setModalVisible(false)} onSuccess={cargarVentas} />
      <TicketVenta visible={ticket !== null} venta={ticket} onClose={() => setTicket(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  emptyList: { flexGrow: 1, paddingHorizontal: Spacing.three },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  btnNuevaVenta: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  ventaRow: {
    minHeight: 68,
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
