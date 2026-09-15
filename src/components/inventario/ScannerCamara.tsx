import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  escaneando: boolean;
  onCodigoDetectado: (codigo: string) => void;
}

export function ScannerCamara({
  visible,
  escaneando,
  onCodigoDetectado,
}: Props) {
  const theme = useTheme();
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!permiso?.granted) solicitarPermiso();
  }, [visible, permiso, solicitarPermiso]);

  if (!visible) return null;

  const permisoConcedido = permiso?.granted;

  return (
    <View style={styles.cameraWrapper} collapsable={false}>
      {permisoConcedido ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flashOn}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "code128"],
            }}
            onBarcodeScanned={
              escaneando ? ({ data }) => onCodigoDetectado(data) : undefined
            }
          />

          <TouchableOpacity
            style={styles.btnFlash}
            onPress={() => setFlashOn((p) => !p)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={flashOn ? "flash" : "flash-outline"}
              size={18}
              color={flashOn ? "#F59E0B" : "#FFFFFF"}
            />
          </TouchableOpacity>

          <View style={styles.scannerOverlay} pointerEvents="box-none">
            <View style={styles.scannerCenter}>
              <View style={styles.scannerTargetBox} />
            </View>
          </View>

          {!escaneando && (
            <View style={styles.loadingOverlay}>
              <ThemedText style={styles.loadingText}>
                Alineando cámara...
              </ThemedText>
            </View>
          )}
        </>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Solicitando permiso de cámara...
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#000",
    position: "relative",
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFill,
  },
  scannerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerTargetBox: {
    width: 250,
    height: 90,
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  btnFlash: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 6,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
});
