import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

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
        nota: `Venta ${ventaId} (${args.metodo_pago}) · Total: S/ ${args.total.toFixed(2)}`,
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

// ---------------------------------------------------------------------
// Reportes por rango de fechas
// ---------------------------------------------------------------------

export type RangoFecha = "hoy" | "semana" | "mes" | "todo";

export interface ReporteVentas {
  totalVendido: number;
  totalGanancia: number;
  totalVentas: number;
  totalUnidades: number;
}

/**
 * Devuelve el rango [desde, hasta] en formato 'YYYY-MM-DD HH:MM:SS' para
 * poder compararlo con las fechas que guarda SQLite (datetime('now','localtime')).
 *
 * - hoy:    desde las 00:00 de hoy hasta ahora
 * - semana: últimos 7 días
 * - mes:    últimos 30 días
 * - todo:   sin límite inferior (desde una fecha muy lejana)
 */
export function calcularRango(rango: RangoFecha, ahora: Date = new Date()): { desde: string; hasta: string } {
  const hasta = formatearFechaSql(ahora);
  const inicio = new Date(ahora);

  if (rango === "hoy") {
    inicio.setHours(0, 0, 0, 0);
  } else if (rango === "semana") {
    inicio.setDate(inicio.getDate() - 6);
    inicio.setHours(0, 0, 0, 0);
  } else if (rango === "mes") {
    inicio.setDate(inicio.getDate() - 29);
    inicio.setHours(0, 0, 0, 0);
  } else {
    // 'todo': una fecha claramente anterior a cualquier registro
    inicio.setFullYear(1970, 0, 1);
    inicio.setHours(0, 0, 0, 0);
  }

  return { desde: formatearFechaSql(inicio), hasta };
}

export function obtenerReporteVentas(desde: string, hasta: string): ReporteVentas {
  try {
    const cabecera = db.getFirstSync<{ total_vendido: number; total_ventas: number; total_unidades: number }>(
      `SELECT
         COALESCE(SUM(total), 0) AS total_vendido,
         COUNT(*) AS total_ventas,
         COALESCE(SUM(total_unidades), 0) AS total_unidades
       FROM ventas
       WHERE fecha BETWEEN ? AND ?;`,
      [desde, hasta],
    );

    // Ganancia usando los precios guardados en cada línea de venta
    const ganancia = db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(vi.cantidad * (vi.precio_venta_unitario - vi.precio_compra_unitario)), 0) AS total
       FROM ventas_items vi
       INNER JOIN ventas v ON v.id = vi.venta_id
       WHERE v.fecha BETWEEN ? AND ?;`,
      [desde, hasta],
    );

    return {
      totalVendido: cabecera?.total_vendido ?? 0,
      totalVentas: cabecera?.total_ventas ?? 0,
      totalUnidades: cabecera?.total_unidades ?? 0,
      totalGanancia: ganancia?.total ?? 0,
    };
  } catch (error) {
    console.error("Error al obtener reporte de ventas:", error);
    return { totalVendido: 0, totalGanancia: 0, totalVentas: 0, totalUnidades: 0 };
  }
}

/**
 * Genera el CSV con el detalle de ventas (una fila por venta) del rango dado.
 * Usa punto y coma como separador para que Excel en español lo abra sin
 * pedir configuración adicional.
 */
export function generarCsvVentas(desde: string, hasta: string): string {
  const ventas = listarVentas(100000, desde, hasta);
  const cabeceras = ["Folio", "Fecha", "Metodo de pago", "Productos", "Unidades", "Total"];
  const filas = ventas.map((v) => [v.id, v.fecha, v.metodo_pago, String(v.total_items), String(v.total_unidades), v.total.toFixed(2)]);

  return [cabeceras, ...filas].map((fila) => fila.map((celda) => escaparCeldaCsv(celda)).join(";")).join("\n");
}

function formatearFechaSql(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())} ${p(fecha.getHours())}:${p(fecha.getMinutes())}:${p(fecha.getSeconds())}`;
}

function escaparCeldaCsv(valor: string): string {
  if (valor.includes(";") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/**
 * Genera el CSV de ventas del rango dado, lo guarda como archivo y abre el
 * diálogo nativo de compartir. Devuelve true si se generó correctamente.
 */
export async function exportarCsvVentas(desde: string, hasta: string, rango: RangoFecha = "todo"): Promise<boolean> {
  try {
    const csv = generarCsvVentas(desde, hasta);

    const ahora = new Date();
    const sello = [ahora.getFullYear(), String(ahora.getMonth() + 1).padStart(2, "0"), String(ahora.getDate()).padStart(2, "0")].join("-");
    const nombreArchivo = `reporte-ventas-${rango}-${sello}.csv`;

    const archivo = new File(Paths.cache, nombreArchivo);
    if (archivo.exists) archivo.delete();
    archivo.create();
    archivo.write(csv);

    const disponible = await Sharing.isAvailableAsync();
    if (!disponible || Platform.OS === "web") {
      console.warn("El compartir archivos no está disponible; CSV generado en caché.");
      return true;
    }

    await Sharing.shareAsync(archivo.uri, {
      mimeType: "text/csv",
      dialogTitle: "Compartir reporte de ventas (CSV)",
      UTI: "public.comma-separated-values-text",
    });
    return true;
  } catch (error) {
    console.error("Error al exportar CSV de ventas:", error);
    return false;
  }
}

export function generarTextoBoleta(venta: VentaCompleta): string {
  const lineas = venta.items.map((item) => `${item.cantidad} x ${item.producto_nombre} - S/ ${item.subtotal.toFixed(2)}`);

  return [`Boleta ${venta.id}`, venta.fecha, "", ...lineas, "", `Método de pago: ${venta.metodo_pago}`, `Total: S/ ${venta.total.toFixed(2)}`, venta.nota ? `Nota: ${venta.nota}` : ""].filter(Boolean).join("\n");
}
