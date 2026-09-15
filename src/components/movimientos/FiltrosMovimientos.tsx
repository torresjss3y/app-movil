import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { TipoFiltro } from "../../types/movimientos";

interface Props {
  filtroActivo: TipoFiltro;
  alCambiarFiltro: (nuevoFiltro: TipoFiltro) => void;
}

export function FiltrosMovimientos({ filtroActivo, alCambiarFiltro }: Props) {
  const theme = useTheme() as typeof Colors.light;

  const opciones: { key: TipoFiltro; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "entradas", label: "Entradas" },
    { key: "retiros", label: "Salidas" },
    { key: "ajustes", label: "Ajustes" },
  ];

  return (
    <View style={styles.filtrosContainer}>
      {opciones.map((opcion) => {
        const estaActivo = filtroActivo === opcion.key;
        return (
          <TouchableOpacity
            key={opcion.key}
            activeOpacity={0.7}
            onPress={() => alCambiarFiltro(opcion.key)}
            style={[
              styles.filtroBoton,
              {
                borderColor: estaActivo ? theme.primary : theme.border,
                backgroundColor: estaActivo
                  ? theme.primary
                  : theme.backgroundElement || theme.card,
              },
            ]}
          >
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              style={[
                styles.filtroTexto,
                {
                  color: estaActivo ? theme.textInverse : theme.textSecondary,
                },
              ]}
            >
              {opcion.label}
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
    gap: Spacing.one,
    paddingVertical: 4,
    marginBottom: 4,
  },
  filtroBoton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filtroTexto: {
    fontSize: 12,
  },
});
