import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { TipoFiltro } from "../../types/movimientos";

interface Props {
  filtroActivo: TipoFiltro;
  alCambiarFiltro: (nuevoFiltro: TipoFiltro) => void;
  contadores?: Record<TipoFiltro, number>; // 👈 opcional: badges con conteo
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const OPCIONES: { key: TipoFiltro; label: string; icon: IconName }[] = [
  { key: "todos", label: "Todos", icon: "apps-outline" },
  { key: "entradas", label: "Entradas", icon: "arrow-down-circle-outline" },
  { key: "retiros", label: "Salidas", icon: "arrow-up-circle-outline" },
  { key: "ajustes", label: "Ajustes", icon: "options-outline" },
];

export function FiltrosMovimientos({ filtroActivo, alCambiarFiltro, contadores }: Props) {
  const theme = useTheme() as typeof Colors.light;

  return (
    <View style={[styles.segmento, { borderColor: theme.border, backgroundColor: theme.backgroundMuted }]}>
      {OPCIONES.map((opcion) => {
        const estaActivo = filtroActivo === opcion.key;
        const conteo = contadores?.[opcion.key];

        return (
          <TouchableOpacity
            key={opcion.key}
            activeOpacity={0.7}
            onPress={() => alCambiarFiltro(opcion.key)}
            style={[styles.segmentoBoton, estaActivo && { backgroundColor: theme.card }]}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${opcion.label}`}
            accessibilityState={{ selected: estaActivo }}
          >
            <Ionicons name={opcion.icon} size={16} color={estaActivo ? theme.primary : theme.textSecondary} />
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[
                styles.segmentoTexto,
                {
                  color: estaActivo ? theme.text : theme.textSecondary,
                  fontWeight: estaActivo ? "700" : "500",
                },
              ]}
            >
              {opcion.label}
              {conteo !== undefined ? ` (${conteo})` : ""}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmento: {
    width: "100%",
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  segmentoBoton: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
  },
  segmentoTexto: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
