import {
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useThemeMode } from "@/contexts/theme-context";
import { useTheme } from "@/hooks/use-theme";

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: 0,
  };
  const theme = useTheme();
  const { resolvedTheme, toggleDarkMode } = useThemeMode();

  const contentPlatformStyle: StyleProp<ViewStyle> = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    ios: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerContainer}>
          <ThemedText type="subtitle">ventas</ThemedText>
          <ThemedText style={styles.subtitleText} themeColor="textSecondary">
            esto es ventas
          </ThemedText>
        </ThemedView>

        <View style={styles.sectionsWrapper}>
          <ThemedView style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <ThemedText type="smallBold">Modo Oscuro</ThemedText>
              <ThemedText type="small" style={styles.settingDescription}>
                Cambia el tema de la interfaz entre claro y oscuro
              </ThemedText>
            </View>
            <Switch
              trackColor={{
                false: theme.switchTrack,
                true: theme.primaryStrong,
              }}
              thumbColor={theme.backgroundElement}
              ios_backgroundColor={theme.switchTrack}
              onValueChange={toggleDarkMode}
              value={resolvedTheme === "dark"}
            />
          </ThemedView>
        </View>

        {Platform.OS === "web" && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  headerContainer: {
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  subtitleText: {
    opacity: 0.7,
  },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  settingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.two,
    gap: 2,
  },
  settingDescription: {
    opacity: 0.6,
  },
});
