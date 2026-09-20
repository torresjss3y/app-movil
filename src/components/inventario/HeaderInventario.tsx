import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { StyleSheet, View } from "react-native";

interface Props {
  totalActivos: number;
}

export function HeaderInventario({ totalActivos }: Props) {
  return (
    <View style={styles.header}>
      <ThemedText type="subtitle">Inventario</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
