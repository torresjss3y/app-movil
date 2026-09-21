import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { RangoFecha } from "@/database/ventaService";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  rangoActual: RangoFecha;
  onCambiar: (rango: RangoFecha) => void;
}

const OPCIONES: { key: RangoFecha; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "7d" },
  { key: "mes", label: "30d" },
  { key: "todo", label: "Histórico" },
];

export function FiltrosFechaMovimientos({ rangoActual, onCambiar }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.icono, { backgroundColor: theme.backgroundMuted, borderColor: theme.border }]}>
        <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
      </View>
      <View style={styles.chipsRow}>
        {OPCIONES.map((opcion) => {
          const activo = rangoActual === opcion.key;
          return (
            <TouchableOpacity
              key={opcion.key}
              onPress={() => onCambiar(opcion.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar movimientos por ${opcion.label}`}
              accessibilityState={{ selected: activo }}
              style={[
                styles.chip,
                {
                  borderColor: activo ? theme.primary : theme.border,
                  backgroundColor: activo ? theme.primary : "transparent",
                },
              ]}
            >
              <ThemedText type="small" numberOfLines={1} style={[styles.chipLabel, { color: activo ? theme.textInverse : theme.textSecondary, fontWeight: activo ? "700" : "500" }]}>
                {opcion.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
