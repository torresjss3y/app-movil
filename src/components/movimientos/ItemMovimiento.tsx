import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { LoteUI } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  lote: LoteUI;
  onPress: () => void;
}

const MOTIVO_LABEL: Record<string, string> = {
  stock_inicial: "Stock inicial",
  compra: "Compra",
  venta: "Venta",
  devolucion: "Devolución",
  merma: "Merma",
  uso_interno: "Uso interno",
  ajuste: "Ajuste",
  otro: "Otro",
};

// "2026-09-19 23:05:12" → "Hoy, 23:05" | "Ayer, 14:30" | "18 sep, 09:12"
const formatearFechaRelativa = (fecha: string): string => {
  try {
    const [f, h = "00:00:00"] = fecha.split(" ");
    const [y, m, d] = f.split("-");
    const [hh, mm] = h.split(":");

    if (!y || !m || !d) return fecha;

    const fechaObj = new Date(`${y}-${m}-${d}T${hh}:${mm}:00`);
    const hoy = new Date();

    // Resetear horas para comparar solo el día
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioAyer = new Date(inicioHoy);
    inicioAyer.setDate(inicioAyer.getDate() - 1);
    const inicioFecha = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate());

    const horaMinuto = `${hh}:${mm}`;

    if (inicioFecha.getTime() === inicioHoy.getTime()) {
      return `Hoy, ${horaMinuto}`;
    }

    if (inicioFecha.getTime() === inicioAyer.getTime()) {
      return `Ayer, ${horaMinuto}`;
    }

    // Otros días: "18 sep"
    const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const mesNombre = MESES[parseInt(m, 10) - 1];

    // Si es del mismo año, no mostrar el año
    if (fechaObj.getFullYear() === hoy.getFullYear()) {
      return `${parseInt(d, 10)} ${mesNombre}, ${horaMinuto}`;
    }

    // Otro año: "18 sep 2025"
    return `${parseInt(d, 10)} ${mesNombre} ${y}`;
  } catch {
    return fecha;
  }
};

export function ItemMovimiento({ lote, onPress }: Props) {
  const theme = useTheme() as typeof Colors.light;

  const colorTipo = lote.tipo === "entrada" ? theme.success : lote.tipo === "salida" ? theme.danger : theme.warning;

  const iconTipo = lote.tipo === "entrada" ? "arrow-up-circle" : lote.tipo === "salida" ? "arrow-down-circle" : "construct";

  const signo = lote.tipo === "entrada" ? "+" : lote.tipo === "salida" ? "-" : "";

  const motivoTexto = MOTIVO_LABEL[lote.motivo] ?? lote.motivo.replace(/_/g, " ");

  // Solo el resumen de productos, sin repetir el conteo
  const resumenProductos = lote.productos_nombres || "Sin productos";

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${motivoTexto} · ${lote.total_unidades} unidades · ${formatearFechaRelativa(lote.fecha)}`}>
      <ThemedView style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        {/* Ícono a la izquierda */}
        <View style={styles.iconWrapper}>
          <Ionicons name={iconTipo as any} size={22} color={colorTipo} />
        </View>

        {/* Contenido central */}
        <View style={styles.content}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.motivo}>
            {motivoTexto}
          </ThemedText>
          <ThemedText type="small" numberOfLines={1} style={[styles.productos, { color: theme.textSecondary }]}>
            {resumenProductos}
          </ThemedText>
          <ThemedText type="small" numberOfLines={1} style={[styles.fecha, { color: theme.textSecondary }]}>
            {formatearFechaRelativa(lote.fecha)}
          </ThemedText>
        </View>

        {/* Cantidad a la derecha */}
        <View style={styles.details}>
          <ThemedText type="smallBold" style={[styles.cantidad, { color: colorTipo }]}>
            {signo}
            {lote.total_unidades}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

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
  iconWrapper: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  motivo: {
    fontSize: 14,
  },
  productos: {
    fontSize: 12,
    opacity: 0.85,
  },
  fecha: {
    fontSize: 11,
    opacity: 0.65,
  },
  details: {
    alignItems: "flex-end",
    paddingLeft: Spacing.one,
  },
  cantidad: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
