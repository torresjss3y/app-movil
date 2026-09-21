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

const moneda = (valor: number) => `S/ ${(Number.isFinite(valor) ? valor : 0).toFixed(2)}`;

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

  // Total valorizado del lote y si los precios provienen de una venta real.
  const totales = useMemo(() => {
    let venta = 0;
    let todosDeVenta = items.length > 0;
    for (const it of items) {
      const cantidad = Number(it.cantidad) || 0;
      venta += cantidad * (Number(it.precio_venta_unitario) || 0);
      if (!it.precios_de_venta) todosDeVenta = false;
    }
    return { venta, todosDeVenta };
  }, [items]);

  if (!lote) return null;

  const config = CONFIG_TIPO[lote.tipo] ?? CONFIG_TIPO.ajuste;
  const colorTipo = theme[config.colorKey];
  const colorFondo = theme[`${config.colorKey}Background` as const] ?? theme.card;
  const motivoTexto = MOTIVO_LABEL[lote.motivo] ?? (lote.motivo ?? "").replace(/_/g, " ");

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

                const cantidad = Number(item.cantidad) || 0;
                const precioUnitario = Number(item.precio_venta_unitario) || 0;
                const subtotal = cantidad * precioUnitario;

                return (
                  <View key={item.id}>
                    <View style={styles.productoRow}>
                      <View style={styles.productoInfo}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {item.producto_nombre}
                          {(item.producto_marca || (esMixta && motivoItem)) && (
                            <View style={styles.chipsRow}>
                              {item.producto_marca ? <Chip icon="pricetag-outline" label={item.producto_marca} color={theme.textSecondary} bg={theme.backgroundElement ?? theme.card} /> : null}
                              {esMixta && motivoItem ? <Chip icon="git-compare-outline" label={motivoItem} color={theme.warning} bg={theme.warningBackground ?? theme.card} /> : null}
                            </View>
                          )}
                        </ThemedText>
                        {/* Precio unitario */}
                        <ThemedText type="small" numberOfLines={1} style={[styles.productoPrecio, { color: theme.textSecondary }]}>
                          {moneda(precioUnitario)} c/u
                        </ThemedText>

                        {/* Nota por línea */}
                        {item.nota ? (
                          <ThemedText type="small" numberOfLines={2} style={[styles.productoNota, { color: theme.textTertiary }]}>
                            {item.nota}
                          </ThemedText>
                        ) : null}
                      </View>

                      <View style={styles.productoDerecha}>
                        <ThemedText type="smallBold" style={[styles.cantidad, { color: colorCantidad }]}>
                          {signoItem}
                          {item.cantidad}
                        </ThemedText>
                        <ThemedText type="small" numberOfLines={1} style={[styles.subtotalLinea, { color: theme.textSecondary }]}>
                          {moneda(subtotal)}
                        </ThemedText>
                      </View>
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

          {/* ── Valorización del lote (estilo ticket POS) ──── */}
          {items.length > 0 && (
            <View style={styles.totalesLista}>
              <View style={[styles.granTotalLinea, { borderTopColor: theme.divider }]}>
                <ThemedText type="smallBold" style={[styles.granTotalLabel, { color: theme.text }]}>
                  Total {lote.tipo === "entrada" ? "ingresado" : lote.tipo === "salida" ? "retirado" : "ajustado"}
                </ThemedText>
                <ThemedText type="smallBold" style={[styles.granTotalValor, { color: colorTipo }]}>
                  {moneda(totales.venta)}
                </ThemedText>
              </View>

              {!totales.todosDeVenta && (
                <View style={styles.valorAviso}>
                  <Ionicons name="information-circle-outline" size={12} color={theme.textTertiary} />
                  <ThemedText type="small" style={[styles.valorAvisoTexto, { color: theme.textTertiary }]}>
                    Precios de referencia del catálogo actual.
                  </ThemedText>
                </View>
              )}
            </View>
          )}
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
  productoPrecio: {
    fontSize: 11,
    marginTop: 3,
  },
  productoDerecha: {
    alignItems: "flex-end",
    gap: 2,
  },
  cantidad: {
    fontSize: 15,
    letterSpacing: 0.2,
    paddingTop: 1,
  },
  subtotalLinea: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
  },

  // Valorización del lote (estilo ticket POS, sin tarjeta)
  totalesLista: {
    gap: 6,
  },
  granTotalLinea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  granTotalLabel: {
    fontSize: 13,
  },
  granTotalValor: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  valorAviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  valorAvisoTexto: {
    fontSize: 10,
    flex: 1,
    fontStyle: "italic",
  },
});
