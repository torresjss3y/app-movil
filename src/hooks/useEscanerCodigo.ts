import { useCallback, useRef } from "react";

export function useEscanerCodigo() {
  const lastScanRef = useRef({ data: "", timestamp: 0 });

  const procesarEscaneo = useCallback(
    (codigo: string, onExito: (codigo: string) => void) => {
      const ahora = Date.now();
      const ultimo = lastScanRef.current;

      // Mismo código en <2s → ignorar
      if (ultimo.data === codigo && ahora - ultimo.timestamp < 2000) return;
      // Cualquier código en <500ms → ignorar (ráfaga)
      if (ahora - ultimo.timestamp < 500) return;

      lastScanRef.current = { data: codigo, timestamp: ahora };
      onExito(codigo);
    },
    [],
  );

  const reset = useCallback(() => {
    lastScanRef.current = { data: "", timestamp: 0 };
  }, []);

  return { procesarEscaneo, reset };
}
