import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { TipoFiltro } from "../../types/movimientos";

interface Props {
  filtroActivo: TipoFiltro;
  alCambiarFiltro: (nuevoFiltro: TipoFiltro) => void;
  contadores?: Record<TipoFiltro, number>; // 👈 opcional: badges con conteo
}

const OPCIONES: { key: TipoFiltro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "entradas", label: "Entradas" },
  { key: "retiros", label: "Salidas" },
  { key: "ajustes", label: "Ajustes" },
];

export function FiltrosMovimientos({ filtroActivo, alCambiarFiltro, contadores }: Props) {
  const theme = useTheme() as typeof Colors.light;

  return (
    <View style={styles.filtrosContainer}>
      {OPCIONES.map((opcion) => {
        const estaActivo = filtroActivo === opcion.key;
        const conteo = contadores?.[opcion.key];

        return (
          <TouchableOpacity
            key={opcion.key}
            activeOpacity={0.7}
            onPress={() => alCambiarFiltro(opcion.key)}
            style={[
              styles.filtroBoton,
              {
                borderColor: estaActivo ? theme.primary : theme.border,
                backgroundColor: estaActivo ? theme.primary : "transparent",
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${opcion.label}`}
            accessibilityState={{ selected: estaActivo }}
          >
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              style={[
                styles.filtroTexto,
                {
                  color: estaActivo ? theme.textInverse : theme.textSecondary,
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
  filtrosContainer: {
    width: "100%",
    flexDirection: "row",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  filtroBoton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filtroTexto: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
