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

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
};

export function ItemMovimiento({ lote, onPress }: Props) {
  const theme = useTheme() as typeof Colors.light;

  const colorTipo = lote.tipo === "entrada" ? theme.success : lote.tipo === "salida" ? theme.danger : theme.warning;

  const iconTipo = lote.tipo === "entrada" ? "arrow-down" : lote.tipo === "salida" ? "arrow-up" : "construct";

  const signo = lote.tipo === "entrada" ? "+" : lote.tipo === "salida" ? "-" : "";

  const motivoTexto = MOTIVO_LABEL[lote.motivo] ?? lote.motivo.replace(/_/g, " ");

  const tipoTexto = TIPO_LABEL[lote.tipo] ?? lote.tipo;

  // Solo el resumen de productos, sin repetir el conteo
  const resumenProductos = lote.productos_nombres || "Sin productos";

  const etiquetaProductos = lote.total_productos === 1 ? "1 producto" : `${lote.total_productos} productos`;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${tipoTexto} por ${motivoTexto} · ${lote.total_unidades} unidades · ${formatearFechaRelativa(lote.fecha)}`}>
      <ThemedView style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
        {/* Ícono circular con color del tipo */}
        <View style={[styles.iconCircle, { backgroundColor: colorTipo + "22" }]}>
          <Ionicons name={iconTipo as any} size={20} color={colorTipo} />
        </View>

        {/* Contenido central */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.motivo}>
              {motivoTexto}
            </ThemedText>
            <View style={[styles.tipoBadge, { backgroundColor: colorTipo + "22" }]}>
              <ThemedText numberOfLines={1} allowFontScaling={false} style={[styles.tipoBadgeText, { color: colorTipo }]}>
                {tipoTexto.toUpperCase()}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="small" numberOfLines={1} style={[styles.productos, { color: theme.textSecondary }]}>
            {resumenProductos}
          </ThemedText>

          <View style={styles.metaRow}>
            <Ionicons name="layers-outline" size={11} color={theme.textTertiary} />
            <ThemedText type="small" style={[styles.meta, { color: theme.textTertiary }]}>
              {etiquetaProductos}
            </ThemedText>
            <ThemedText type="small" style={[styles.metaDot, { color: theme.textTertiary }]}>
              ·
            </ThemedText>
            <Ionicons name="time-outline" size={11} color={theme.textTertiary} />
            <ThemedText type="small" style={[styles.meta, { color: theme.textTertiary }]}>
              {formatearFechaRelativa(lote.fecha)}
            </ThemedText>
          </View>
        </View>

        {/* Cantidad destacada a la derecha */}
        <View style={[styles.cantidadBox, { backgroundColor: colorTipo + "18", borderColor: colorTipo + "33" }]}>
          <ThemedText type="smallBold" style={[styles.cantidad, { color: colorTipo }]}>
            {signo}
            {lote.total_unidades}
          </ThemedText>
          <ThemedText type="small" style={[styles.cantidadUnidad, { color: colorTipo }]}>
            u.
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  motivo: {
    flexShrink: 1,
    fontSize: 14,
  },
  tipoBadge: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tipoBadgeText: {
    flexShrink: 0,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  productos: {
    fontSize: 12,
    opacity: 0.85,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontSize: 10,
  },
  metaDot: {
    fontSize: 10,
    marginHorizontal: 2,
  },
  cantidadBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  cantidad: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  cantidadUnidad: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.8,
  },
});
