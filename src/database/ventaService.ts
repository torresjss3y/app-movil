import db from "./db";
import { registrarLoteEnTransaccion } from "./productosService";

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "yape" | "otro";

export interface ItemVenta {
  producto_id: string;
  producto_nombre: string;
  producto_marca?: string | null;
  cantidad: number;
  precio_venta_unitario: number;
  precio_compra_unitario?: number;
}

export interface RegistrarVentaArgs {
  items: ItemVenta[];
  metodo_pago: MetodoPago;
  total: number;
  nota?: string;
}

/**
 * Registra una venta completa en una sola transacción:
 *   1) Inserta cabecera en `ventas`
 *   2) Inserta las líneas en `ventas_items`
 *   3) Descuenta stock vía `registrarLote` (motivo: venta)
 *   4) Enlaza venta ↔ lote
 *
 * Devuelve el id de la venta (folio) o null si algo falla.
 */
export function registrarVenta(args: RegistrarVentaArgs): string | null {
  if (!args.items || args.items.length === 0) return null;

  const ventaId = `V-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const totalItems = args.items.length;
  const totalUnidades = args.items.reduce((a, i) => a + i.cantidad, 0);

  try {
    // Toda la venta, incluido el lote de salida, usa una sola transacción.
    db.withTransactionSync(() => {
      const loteId = registrarLoteEnTransaccion({
        tipo: "salida",
        motivo: "venta",
        nota: `Venta ${ventaId} (${args.metodo_pago}) · Total: $${args.total.toFixed(2)}`,
        items: args.items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
      });

      db.runSync(
        `INSERT INTO ventas (id, total, total_items, total_unidades, metodo_pago, nota)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ventaId, args.total, totalItems, totalUnidades, args.metodo_pago, args.nota ?? `Venta (${args.metodo_pago})`],
      );

      for (const it of args.items) {
        const itemId = `${ventaId}-${it.producto_id}`;
        const subtotal = it.cantidad * it.precio_venta_unitario;

        db.runSync(
          `INSERT INTO ventas_items
             (id, venta_id, producto_id, producto_nombre, producto_marca,
              cantidad, precio_venta_unitario, precio_compra_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, ventaId, it.producto_id, it.producto_nombre, it.producto_marca ?? null, it.cantidad, it.precio_venta_unitario, it.precio_compra_unitario ?? 0, subtotal],
        );
      }

      db.runSync(`UPDATE ventas SET lote_id = ? WHERE id = ?`, [loteId, ventaId]);
    });

    return ventaId;
  } catch (e) {
    console.warn("Error al registrar venta:", e);
    return null;
  }
}

// ---------------------------------------------------------------------
// Consultas útiles (opcionales, para reportes)
// ---------------------------------------------------------------------

export interface VentaResumen {
  id: string;
  fecha: string;
  metodo_pago: MetodoPago;
  total: number;
  total_items: number;
  total_unidades: number;
  lote_id: string | null;
  nota: string | null;
}

export function listarVentas(limite = 100, desde?: string, hasta?: string): VentaResumen[] {
  if (desde && hasta) {
    return db.getAllSync<VentaResumen>(
      `SELECT * FROM ventas
       WHERE fecha BETWEEN ? AND ?
       ORDER BY fecha DESC
       LIMIT ?`,
      [desde, hasta, limite],
    );
  }
  return db.getAllSync<VentaResumen>(`SELECT * FROM ventas ORDER BY fecha DESC LIMIT ?`, [limite]);
}

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id: string;
  producto_nombre: string;
  producto_marca: string | null;
  cantidad: number;
  precio_venta_unitario: number;
  precio_compra_unitario: number;
  subtotal: number;
}

export interface VentaCompleta extends VentaResumen {
  items: VentaItem[];
}

export function obtenerItemsDeVenta(ventaId: string): VentaItem[] {
  return db.getAllSync<VentaItem>(`SELECT * FROM ventas_items WHERE venta_id = ?`, [ventaId]);
}

export function obtenerVentaCompleta(ventaId: string): VentaCompleta | null {
  const venta = db.getFirstSync<VentaResumen>(`SELECT * FROM ventas WHERE id = ?`, [ventaId]);
  return venta ? { ...venta, items: obtenerItemsDeVenta(ventaId) } : null;
}

export function generarTextoBoleta(venta: VentaCompleta): string {
  const lineas = venta.items.map((item) => `${item.cantidad} x ${item.producto_nombre} - S/ ${item.subtotal.toFixed(2)}`);

  return [`Boleta ${venta.id}`, venta.fecha, "", ...lineas, "", `Método de pago: ${venta.metodo_pago}`, `Total: S/ ${venta.total.toFixed(2)}`, venta.nota ? `Nota: ${venta.nota}` : ""].filter(Boolean).join("\n");
}
