import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  onIngreso: () => void;
  onRetiro: () => void;
}

export function AccionesMovimiento({ onIngreso, onRetiro }: Props) {
  const theme = useTheme() as typeof Colors.light;

  return (
    <View style={styles.container}>
      {/* Botón Ingreso */}
      <TouchableOpacity
        style={[
          styles.boton,
          {
            backgroundColor: theme.success + "15",
            borderColor: theme.success + "55",
          },
        ]}
        onPress={onIngreso}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Registrar ingreso de stock"
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.success + "22" },
          ]}
        >
          <Ionicons name="add" size={18} color={theme.success} />
        </View>
        <ThemedText
          type="smallBold"
          style={[styles.label, { color: theme.success }]}
        >
          Ingreso
        </ThemedText>
      </TouchableOpacity>

      {/* Botón Retiro */}
      <TouchableOpacity
        style={[
          styles.boton,
          {
            backgroundColor: theme.danger + "15",
            borderColor: theme.danger + "55",
          },
        ]}
        onPress={onRetiro}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Registrar retiro de stock"
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.danger + "22" },
          ]}
        >
          <Ionicons name="remove" size={18} color={theme.danger} />
        </View>
        <ThemedText
          type="smallBold"
          style={[styles.label, { color: theme.danger }]}
        >
          Retiro
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  boton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
  },
});