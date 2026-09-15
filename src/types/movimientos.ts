// Tipo para el filtro de la lista de movimientos
export type TipoFiltro = "todos" | "entradas" | "retiros" | "ajustes";

// Tipo del movimiento en sí (coincide con la BD)
export type TipoMovimiento = "entrada" | "salida" | "ajuste";

// Modo del modal de producto (para saber qué está haciendo el usuario)
export type ModoModalProducto = "crear" | "editar" | "ingreso" | "retiro";

export const MOTIVOS_AJUSTE = ["ajuste"] as const;

// Motivos predefinidos según el tipo
export const MOTIVOS_ENTRADA = [
  "compra",
  "devolucion",
  "stock_inicial",
  "otro",
] as const;

export const MOTIVOS_SALIDA = [
  "venta",
  "merma",
  "robo",
  "devolucion",
  "uso_interno",
  "otro",
] as const;

export interface MovimientoUI {
  id: string;
  producto_id: string;
  producto_nombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  nota?: string | null;
  fecha: string;
}
