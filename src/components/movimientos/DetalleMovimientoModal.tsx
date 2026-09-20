import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { ItemLoteUI, LoteUI, obtenerItemsDeLote } from "@/database/productosService";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  visible: boolean;
  lote: LoteUI | null;
  onClose: () => void;
}

// --- Configuración por tipo de movimiento -----------------------------------

const CONFIG_TIPO: Record<
  string,
  {
    icono: keyof typeof Ionicons.glyphMap;
    etiqueta: string;
    descripcion: string;
    colorKey: "success" | "danger" | "warning";
  }
> = {
  entrada: {
    icono: "arrow-up",
    etiqueta: "Entrada",
    descripcion: "Ingreso de mercadería",
    colorKey: "success",
  },
  salida: {
    icono: "arrow-down",
    etiqueta: "Salida",
    descripcion: "Retiro de mercadería",
    colorKey: "danger",
  },
  ajuste: {
    icono: "swap-vertical",
    etiqueta: "Ajuste",
    descripcion: "Corrección de inventario",
    colorKey: "warning",
  },
};

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

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const formatearFecha = (fecha: string): string => {
  try {
    const [f, h = "00:00:00"] = fecha.split(" ");
    const [y, m, d] = f.split("-");
    const [hh, mm] = h.split(":");
    if (!y || !m || !d) return fecha;
    const mesNombre = MESES[parseInt(m, 10) - 1];
    return `${parseInt(d, 10)} ${mesNombre} ${y} · ${hh}:${mm}`;
  } catch {
    return fecha;
  }
};

const formatearFolio = (id: string): string => {
  return `#${id.slice(-6).toUpperCase()}`;
};

const pluralizar = (n: number, singular: string, plural: string): string => `${n} ${n === 1 ? singular : plural}`;

// --- Chip reutilizable -------------------------------------------------------

function Chip({ icon, label, color, bg }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bg: string }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={10} color={color} />
      <ThemedText type="small" style={[chipStyles.chipText, { color }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 140,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

// --- Componente --------------------------------------------------------------

export function DetalleMovimientoModal({ visible, lote, onClose }: Props) {
  const theme = useTheme() as typeof Colors.light;

  const loteId = lote?.id;

  const items: ItemLoteUI[] = useMemo(() => {
    if (!loteId) return [];
    return obtenerItemsDeLote(loteId);
  }, [loteId]);

  if (!lote) return null;

  const config = CONFIG_TIPO[lote.tipo] ?? CONFIG_TIPO.ajuste;
  const colorTipo = theme[config.colorKey];
  const colorFondo = theme[`${config.colorKey}Background` as const] ?? theme.card;

  const signo = lote.tipo === "entrada" ? "+" : lote.tipo === "salida" ? "-" : "";

  const motivoTexto = MOTIVO_LABEL[lote.motivo] ?? (lote.motivo ?? "").replace(/_/g, " ");

  const etiquetaTotal = lote.tipo === "entrada" ? "Total ingresado" : lote.tipo === "salida" ? "Total retirado" : "Total ajustado";

  const totalProductos = lote.total_productos ?? items.length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          {/* ── Cabecera ────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colorFondo }]}>
              <Ionicons name={config.icono} size={20} color={colorTipo} />
            </View>

            <View style={styles.headerText}>
              <ThemedText type="smallBold" style={styles.titulo}>
                {motivoTexto}
              </ThemedText>
              <ThemedText type="small" style={[styles.headerSub, { color: theme.textSecondary }]}>
                {config.descripcion}
              </ThemedText>
              <ThemedText type="small" style={[styles.headerFecha, { color: theme.textTertiary }]}>
                {formatearFecha(lote.fecha)} · {formatearFolio(lote.id)}
              </ThemedText>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar detalle del movimiento">
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Divisor ─────────────────────────────────────── */}
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* ── Nota del lote ──────────────────────────────── */}
          {lote.nota ? (
            <>
              <View
                style={[
                  styles.notaBox,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.divider,
                  },
                ]}
              >
                <Ionicons name="document-text-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={[styles.notaTexto, { color: theme.textSecondary }]}>
                  {lote.nota}
                </ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            </>
          ) : null}

          {/* ── Sección: Productos ─────────────────────────── */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textTertiary }]}>
              PRODUCTOS · {items.length}
            </ThemedText>

            {items.length === 0 ? (
              <ThemedText type="small" style={[styles.emptyText, { color: theme.textSecondary }]}>
                Sin productos en este lote.
              </ThemedText>
            ) : (
              items.map((item, index) => {
                const esMixta = item.tipo && item.tipo !== lote.tipo;
                const signoItem = item.tipo === "entrada" ? "+" : item.tipo === "salida" ? "-" : "";
                const motivoItem = item.motivo ? (MOTIVO_LABEL[item.motivo] ?? item.motivo.replace(/_/g, " ")) : null;

                const colorCantidad = esMixta ? theme.warning : colorTipo;

                return (
                  <View key={item.id}>
                    <View style={styles.productoRow}>
                      <View style={styles.productoInfo}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {item.producto_nombre}
                        </ThemedText>

                        {/* Chips: marca + categoría (+ motivo si es mixta) */}
                        {(item.producto_marca || item.producto_categoria || (esMixta && motivoItem)) && (
                          <View style={styles.chipsRow}>
                            {item.producto_marca ? <Chip icon="pricetag-outline" label={item.producto_marca} color={theme.textSecondary} bg={theme.backgroundElement ?? theme.card} /> : null}
                            {item.producto_categoria ? <Chip icon="folder-outline" label={item.producto_categoria} color={theme.textSecondary} bg={theme.backgroundElement ?? theme.card} /> : null}
                            {esMixta && motivoItem ? <Chip icon="git-compare-outline" label={motivoItem} color={theme.warning} bg={theme.warningBackground ?? theme.card} /> : null}
                          </View>
                        )}

                        {/* Nota por línea */}
                        {item.nota ? (
                          <ThemedText type="small" numberOfLines={2} style={[styles.productoNota, { color: theme.textTertiary }]}>
                            {item.nota}
                          </ThemedText>
                        ) : null}
                      </View>

                      <ThemedText type="smallBold" style={[styles.cantidad, { color: colorCantidad }]}>
                        {signoItem}
                        {item.cantidad}
                      </ThemedText>
                    </View>

                    {/* Separador entre items, pero no después del último */}
                    {index < items.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.divider }]} />}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* ── Divisor ─────────────────────────────────────── */}
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* ── Total ──────────────────────────────────────── */}
          <View style={styles.totalRow}>
            <ThemedText type="small" style={[styles.totalLabel, { color: theme.textSecondary }]}>
              {etiquetaTotal}
            </ThemedText>

            <View style={styles.totalRight}>
              <ThemedText type="smallBold" style={[styles.totalCantidad, { color: colorTipo }]}>
                {signo}
                {lote.total_unidades}
              </ThemedText>
              <ThemedText type="small" style={[styles.totalUnidad, { color: theme.textSecondary }]}>
                unidades
              </ThemedText>
            </View>
          </View>

          {/* ── Resumen productos/unidades ─────────────────── */}
          <ThemedText type="small" style={[styles.totalProductos, { color: theme.textTertiary }]}>
            {pluralizar(totalProductos, "producto", "productos")}
            {" · "}
            {pluralizar(lote.total_unidades, "unidad", "unidades")}
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

// --- Estilos -----------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: 20,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },

  // Cabecera
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titulo: {
    fontSize: 17,
  },
  headerSub: {
    fontSize: 12,
  },
  headerFecha: {
    fontSize: 11,
    marginTop: 2,
  },

  // Divisor
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },

  // Nota del lote
  notaBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notaTexto: {
    flex: 1,
    fontSize: 12,
    fontStyle: "italic",
  },

  // Sección de productos
  scroll: {
    maxHeight: 340,
    marginTop: -Spacing.one,
  },
  scrollContent: {
    paddingBottom: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: Spacing.two,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: Spacing.four,
    opacity: 0.7,
  },
  productoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  productoInfo: {
    flex: 1,
    minWidth: 0,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 3,
  },
  productoNota: {
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 3,
  },
  cantidad: {
    fontSize: 15,
    letterSpacing: 0.2,
    paddingTop: 1,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
  },

  // Total
  totalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 12,
    paddingTop: 4,
  },
  totalRight: {
    alignItems: "flex-end",
  },
  totalCantidad: {
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  totalUnidad: {
    fontSize: 11,
    marginTop: -2,
  },
  totalProductos: {
    fontSize: 11,
    marginTop: -Spacing.two,
  },
});
