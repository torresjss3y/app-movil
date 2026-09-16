import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function VentasScreen() {
  return <ThemedView style={styles.container}></ThemedView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 10,
    borderWidth: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
