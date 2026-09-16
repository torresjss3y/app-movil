import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  escaneando: boolean;
  onCodigoDetectado: (codigo: string) => void;
}

export function ScannerCamara({ visible, escaneando, onCodigoDetectado }: Props) {
  const theme = useTheme();
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  // Guardamos la última lectura y el contador para confirmar el código
  const lecturaPrevia = useRef<string | null>(null);
  const contadorLecturas = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;
    if (!permiso?.granted) solicitarPermiso();
  }, [visible, permiso, solicitarPermiso]);

  if (!visible) return null;

  const permisoConcedido = permiso?.granted;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  };

  // Validaciones físicas e integridad del formato
  const esCodigoValido = (type: string, data: string): boolean => {
    if (!data || data.trim().length === 0) return false;
    if (type === "ean13") {
      return /^\d{13}$/.test(data);
    }
    if (type === "code128") {
      return data.length >= 4;
    }
    return data.length >= 3; // QR u otros
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!escaneando || !result.bounds) return;

    const { data, type, bounds } = result;
    const { origin, size } = bounds;
    const padding = 5;

    // 1. Filtro Espacial: Verificar que esté 100% dentro del cuadro
    const estaDentro =
      origin.x >= padding &&
      origin.y >= padding &&
      origin.x + size.width <= layout.width - padding &&
      origin.y + size.height <= layout.height - padding;

    if (!estaDentro) {
      lecturaPrevia.current = null;
      contadorLecturas.current = 0;
      return;
    }

    // 2. Filtro de Formato: Descartar lecturas corruptas/incompletas
    if (!esCodigoValido(type, data)) {
      return;
    }

    // 3. Filtro de Concurrencia (Doble Confirmación):
    // Requiere 2 lecturas idénticas seguidas para darlo por bueno
    if (lecturaPrevia.current === data) {
      contadorLecturas.current += 1;
    } else {
      lecturaPrevia.current = data;
      contadorLecturas.current = 1;
    }

    // Solo cuando se confirma 2 veces consecutivas se emite el resultado
    if (contadorLecturas.current >= 2) {
      lecturaPrevia.current = null;
      contadorLecturas.current = 0;
      onCodigoDetectado(data);
    }
  };

  return (
    <View style={styles.cameraWrapper} collapsable={false} onLayout={handleLayout}>
      {permisoConcedido ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flashOn}
            barcodeScannerSettings={{
              // Restringe únicamente a las simbologías que realmente usas
              barcodeTypes: ["qr", "ean13", "code128"],
            }}
            onBarcodeScanned={escaneando ? handleBarcodeScanned : undefined}
          />

          <TouchableOpacity style={styles.btnFlash} onPress={() => setFlashOn((p) => !p)} activeOpacity={0.7}>
            <Ionicons name={flashOn ? "flash" : "flash-outline"} size={18} color={flashOn ? "#F59E0B" : "#FFFFFF"} />
          </TouchableOpacity>

          {!escaneando && (
            <View style={styles.loadingOverlay}>
              <ThemedText style={styles.loadingText}>Alineando cámara...</ThemedText>
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
    height: 140,
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
