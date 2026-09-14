export interface ProductoMovimiento {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

export type TipoFiltro = "todos" | "ventas" | "entradas" | "retiros";

export interface Movimiento {
  id: string;
  ticket: string;
  tipo: "venta" | "entrada" | "baja";
  monto: string;
  hora: string;
  modoPago?: string;
  productos: ProductoMovimiento[];
}
