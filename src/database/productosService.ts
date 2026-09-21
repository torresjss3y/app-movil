import { MovimientoUI } from "../types/movimientos";
import db from "./db";

// ---------- Productos ----------
export interface ProductoDB {
  id: string;
  codigo_barras?: string | null;
  nombre: string;
  marca?: string | null;
  categoria?: string | null;
  precio_compra?: number;
  precio_venta: number;
  stock: number;
  activo?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string | null;
  atributos: ProductoAtributo[];
}

export interface ProductoAtributo {
  id: string;
  producto_id: string;
  clave: string;
  valor: string;
  orden: number;
}

export type AtributoProductoInput = Pick<ProductoAtributo, "clave" | "valor">;

export type NuevoProductoInput = Omit<ProductoDB, "fecha_creacion" | "fecha_actualizacion" | "activo" | "atributos"> & {
  atributos: AtributoProductoInput[];
};

export type EditarProductoInput = Omit<Partial<NuevoProductoInput>, "atributos"> & {
  atributos?: AtributoProductoInput[];
  id: string;
};

// ---------- Movimientos ----------
export type TipoMovimiento = "entrada" | "salida" | "ajuste";

export type MotivoMovimiento = "stock_inicial" | "compra" | "venta" | "devolucion" | "merma" | "uso_interno" | "ajuste" | "otro";

export interface MovimientoDB {
  id: string;
  producto_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  nota?: string | null;
  fecha: string;
}

export interface MovimientoInput {
  producto_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: MotivoMovimiento | string;
  nota?: string;
}

export interface ResumenMovimientos {
  entradas: number;
  salidas: number;
  ajustes: number;
  total: number;
}

// ---------- Lotes ----------

export interface ItemLote {
  producto_id: string;
  cantidad: number;
  nota?: string;
}

export interface RegistrarLoteInput {
  tipo: TipoMovimiento;
  motivo: string;
  nota?: string;
  items: ItemLote[];
}

const crearId = (prefijo: string) => `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Item individual de un lote (producto + cantidad) para UI
export interface ItemLoteUI {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_marca?: string | null;
  producto_categoria?: string | null;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  nota?: string | null;
  fecha: string;
  // Precio unitario de venta: el real de la venta (si el lote proviene de una
  // venta) o el del catálogo del producto como referencia.
  precio_venta_unitario: number;
  // Precio unitario de compra: el real de la venta (si aplica) o el del catálogo.
  precio_compra_unitario: number;
  // Indica si los precios provienen de una venta registrada (true) o del
  // catálogo del producto (false), para saber si son un dato histórico exacto.
  precios_de_venta: number;
}

// Lote completo con productos consolidados para UI
export interface LoteUI {
  id: string;
  tipo: TipoMovimiento;
  motivo: string;
  nota?: string | null;
  total_productos: number;
  total_unidades: number;
  fecha: string;
  productos_nombres?: string | null; // GROUP_CONCAT de nombres
  // Monto total de la venta asociada (si el lote proviene de una venta). Null en
  // entradas, ajustes u otros movimientos que no sean ventas.
  total_venta?: number | null;
}

// ---------- Métricas ----------

export interface MetricasResumen {
  gananciaHoy: number;
  gananciaTotal: number;
  unidadesVendidasHoy: number;
  unidadesVendidasTotal: number;
  valorInventarioVenta: number;
  valorInventarioCosto: number;
  totalProductos: number;
  productosBajoStock: number;
}

// 2. HELPERS PRIVADOS
const obtenerAtributos = (productoId: string): ProductoAtributo[] =>
  db.getAllSync<ProductoAtributo>(
    `SELECT id, producto_id, clave, valor, orden
     FROM producto_atributos
     WHERE producto_id = ?
     ORDER BY orden ASC, clave ASC;`,
    [productoId],
  );

const adjuntarAtributos = (producto: Omit<ProductoDB, "atributos">): ProductoDB => ({
  ...producto,
  atributos: obtenerAtributos(producto.id),
});

const guardarAtributos = (productoId: string, atributos: AtributoProductoInput[]) => {
  db.runSync(`DELETE FROM producto_atributos WHERE producto_id = ?;`, [productoId]);

  const clavesGuardadas = new Set<string>();

  atributos
    .map((atributo) => ({
      clave: atributo.clave.trim(),
      valor: atributo.valor.trim(),
    }))
    .filter((atributo) => {
      const claveNormalizada = atributo.clave.toLocaleLowerCase();
      if (!atributo.clave || !atributo.valor || clavesGuardadas.has(claveNormalizada)) return false;
      clavesGuardadas.add(claveNormalizada);
      return true;
    })
    .forEach((atributo, index) => {
      db.runSync(
        `INSERT INTO producto_atributos (id, producto_id, clave, valor, orden)
         VALUES (?, ?, ?, ?, ?);`,
        [`${productoId}-${index}-${Date.now()}`, productoId, atributo.clave, atributo.valor, index],
      );
    });
};

// 3. VERIFICACIÓN / DEBUG

export const verificarEstructuraDB = () => {
  try {
    const tablas = db.getAllSync<{ name: string }>(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN ('productos', 'movimientos_stock', 'lotes_movimiento', 'ventas', 'ventas_items');`,
    );

    const requeridas = ["productos", "movimientos_stock", "lotes_movimiento", "ventas", "ventas_items"];
    const faltantes = requeridas.filter((tabla) => !tablas.some((encontrada) => encontrada.name === tabla));
    if (faltantes.length > 0) {
      console.warn(`⚠️ Faltan tablas en la base de datos: ${faltantes.join(", ")}`);
      return false;
    }

    console.log("✅ Estructura de inventario, movimientos y ventas encontrada correctamente.");

    const conteo = db.getFirstSync<{ total: number }>(`SELECT COUNT(*) as total FROM productos;`);
    console.log(`📦 Total de productos registrados: ${conteo?.total ?? 0}`);

    return true;
  } catch (error) {
    console.error("Error verificando la base de datos:", error);
    return false;
  }
};

export const verificarContenidoDB = () => {
  try {
    const productos = db.getAllSync<Omit<ProductoDB, "atributos">>(`SELECT * FROM productos ORDER BY nombre ASC;`);
    const atributos = db.getAllSync<ProductoAtributo>(`SELECT * FROM producto_atributos ORDER BY producto_id ASC;`);
    const movimientos = db.getAllSync<MovimientoDB>(`SELECT * FROM movimientos_stock ORDER BY id ASC;`);
    const lotes = db.getAllSync<LoteUI>(`SELECT * FROM lotes_movimiento ORDER BY id ASC;`);

    console.log(" PRODUCTOS:", productos);
    console.log("  ATRIBUTOS:", atributos);
    console.log(" MOVIMIENTOS:", movimientos);
    console.log("📚 LOTES:", lotes);

    // Detección de lotes huérfanos en vivo
    const huerfanos = db.getAllSync<{ id: string }>(`
      SELECT id FROM lotes_movimiento
      WHERE id NOT IN (
        SELECT DISTINCT lote_id FROM movimientos_stock WHERE lote_id IS NOT NULL
      );
    `);

    if (huerfanos.length > 0) {
      console.warn(`  Lotes huérfanos detectados: ${huerfanos.length}`, huerfanos);
    } else {
      console.log(" No hay lotes huérfanos.");
    }
  } catch (error) {
    console.error("Error al verificar contenido de la DB:", error);
  }
};

// 4. CRUD DE PRODUCTOS
// 4.1. Obtener todos
export const obtenerProductos = (): ProductoDB[] => {
  try {
    const productos = db.getAllSync<Omit<ProductoDB, "atributos">>(`SELECT * FROM productos ORDER BY nombre ASC;`);
    return productos.map(adjuntarAtributos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};

// 4.2. Buscar por código de barras
export const obtenerProductoPorCodigo = (codigo: string): ProductoDB | null => {
  try {
    const codigoLimpio = codigo.trim();
    const resultado = db.getFirstSync<Omit<ProductoDB, "atributos">>(`SELECT * FROM productos WHERE codigo_barras = ? AND activo = 1;`, [codigoLimpio]);
    return resultado ? adjuntarAtributos(resultado) : null;
  } catch (error) {
    console.error("Error al buscar producto por código:", error);
    return null;
  }
};

// 4.3. Buscar por ID
export const obtenerProductoPorId = (id: string): ProductoDB | null => {
  try {
    const resultado = db.getFirstSync<Omit<ProductoDB, "atributos">>(`SELECT * FROM productos WHERE id = ?;`, [id]);
    return resultado ? adjuntarAtributos(resultado) : null;
  } catch (error) {
    console.error("Error al buscar producto por id:", error);
    return null;
  }
};

// 4.4. Crear producto + stock inicial como movimiento
export const crearProducto = (producto: NuevoProductoInput): boolean => {
  try {
    const codigoBarrasLimpio = producto.codigo_barras?.trim() || null;
    const stockInicial = Number(producto.stock) || 0;

    if (!producto.nombre.trim() || !Number.isFinite(producto.precio_venta) || producto.precio_venta < 0 || !Number.isInteger(stockInicial) || stockInicial < 0) {
      console.warn("Datos inválidos para crear el producto");
      return false;
    }

    db.withTransactionSync(() => {
      // Insertar producto con stock = 0 (el trigger lo actualizará)
      db.runSync(
        `INSERT INTO productos (
          id, codigo_barras, nombre, marca, categoria,
          precio_compra, precio_venta, stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0);`,
        [producto.id, codigoBarrasLimpio, producto.nombre.trim(), producto.marca?.trim() || null, producto.categoria?.trim() || null, producto.precio_compra ?? 0, producto.precio_venta],
      );

      // Guardar atributos
      guardarAtributos(producto.id, producto.atributos ?? []);

      // Si hay stock inicial → crear lote + movimiento
      if (stockInicial > 0) {
        const loteId = crearId("L");

        db.runSync(
          `INSERT INTO lotes_movimiento
            (id, tipo, motivo, nota, total_productos, total_unidades)
           VALUES (?, 'entrada', 'stock_inicial', 'Alta de producto', 1, ?);`,
          [loteId, stockInicial],
        );

        db.runSync(
          `INSERT INTO movimientos_stock
            (id, producto_id, tipo, cantidad, motivo, nota, lote_id)
           VALUES (?, ?, 'entrada', ?, 'stock_inicial', 'Alta de producto', ?);`,
          [`${loteId}-${producto.id}`, producto.id, stockInicial, loteId],
        );
      }
    });

    return true;
  } catch (error) {
    console.error("Error al crear producto:", error);
    return false;
  }
};

// 4.5. Actualizar producto (NO toca stock — el stock solo cambia por movimientos)
export const actualizarProducto = (producto: EditarProductoInput): boolean => {
  try {
    db.withTransactionSync(() => {
      db.runSync(
        `UPDATE productos SET
          codigo_barras = COALESCE(?, codigo_barras),
          nombre = COALESCE(?, nombre),
          marca = COALESCE(?, marca),
          categoria = COALESCE(?, categoria),
          precio_compra = COALESCE(?, precio_compra),
          precio_venta = COALESCE(?, precio_venta)
         WHERE id = ?;`,
        [producto.codigo_barras?.trim() ?? null, producto.nombre?.trim() ?? null, producto.marca?.trim() ?? null, producto.categoria?.trim() ?? null, producto.precio_compra ?? null, producto.precio_venta ?? null, producto.id],
      );

      if (producto.atributos) guardarAtributos(producto.id, producto.atributos);
    });

    return true;
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return false;
  }
};

// 4.6. Eliminar producto (CASCADE borra sus movimientos automáticamente)
export const eliminarProducto = (id: string): boolean => {
  try {
    const venta = db.getFirstSync<{ total: number }>(`SELECT COUNT(*) AS total FROM ventas_items WHERE producto_id = ?;`, [id]);
    if ((venta?.total ?? 0) > 0) {
      console.warn("No se puede eliminar un producto con ventas registradas");
      return false;
    }

    db.runSync(`DELETE FROM productos WHERE id = ?;`, [id]);
    return true;
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return false;
  }
};

export const desactivarProducto = (id: string): boolean => {
  try {
    const resultado = db.runSync(`UPDATE productos SET activo = 0 WHERE id = ?;`, [id]);
    return resultado.changes > 0;
  } catch (error) {
    console.error("Error al desactivar producto:", error);
    return false;
  }
};

export const activarProducto = (id: string): boolean => {
  try {
    const resultado = db.runSync(`UPDATE productos SET activo = 1 WHERE id = ?;`, [id]);
    return resultado.changes > 0;
  } catch (error) {
    console.error("Error al activar producto:", error);
    return false;
  }
};

// ============================================================
// 5. MOVIMIENTOS
// ============================================================

// 5.1. Registrar un movimiento individual
export const registrarMovimiento = (mov: MovimientoInput): boolean => {
  try {
    if (mov.cantidad <= 0) {
      console.warn("La cantidad debe ser mayor a 0");
      return false;
    }

    db.runSync(
      `INSERT INTO movimientos_stock
        (id, producto_id, tipo, cantidad, motivo, nota)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [crearId("M"), mov.producto_id, mov.tipo, mov.cantidad, mov.motivo, mov.nota?.trim() || null],
    );
    return true;
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return false;
  }
};

// Inserta un lote usando la transacción activa. No debe abrir otra transacción.
export const registrarLoteEnTransaccion = (input: RegistrarLoteInput): string => {
  if (input.items.length === 0) {
    throw new Error("El lote está vacío");
  }

  if (input.items.some((item) => !Number.isInteger(item.cantidad) || item.cantidad <= 0)) {
    throw new Error("Las cantidades del lote deben ser enteros mayores a 0");
  }

  if (input.tipo === "salida") {
    const cantidadesPorProducto = new Map<string, number>();
    for (const item of input.items) {
      cantidadesPorProducto.set(item.producto_id, (cantidadesPorProducto.get(item.producto_id) ?? 0) + item.cantidad);
    }

    for (const [productoId, cantidad] of cantidadesPorProducto) {
      const producto = db.getFirstSync<{ stock: number }>("SELECT stock FROM productos WHERE id = ? AND activo = 1", [productoId]);
      if (!producto) throw new Error(`Producto no encontrado: ${productoId}`);
      if (cantidad > producto.stock) throw new Error(`Stock insuficiente para el producto ${productoId}`);
    }
  }

  const loteId = crearId("L");
  const totalUnidades = input.items.reduce((acc, item) => acc + item.cantidad, 0);

  db.runSync(
    `INSERT INTO lotes_movimiento
      (id, tipo, motivo, nota, total_productos, total_unidades)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [loteId, input.tipo, input.motivo, input.nota || null, input.items.length, totalUnidades],
  );

  for (const item of input.items) {
    db.runSync(
      `INSERT INTO movimientos_stock
        (id, producto_id, tipo, cantidad, motivo, nota, lote_id)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [`${loteId}-${item.producto_id}`, item.producto_id, input.tipo, item.cantidad, input.motivo, item.nota || null, loteId],
    );
  }

  return loteId;
};

// 5.2. Registrar un lote completo (N movimientos en 1 sola fecha)
export const registrarLote = (input: RegistrarLoteInput): string | null => {
  try {
    let loteId = "";
    db.withTransactionSync(() => {
      loteId = registrarLoteEnTransaccion(input);
    });
    return loteId;
  } catch (error) {
    console.error("Error al registrar lote:", error);
    return null;
  }
};

// 5.3. Eliminar un movimiento
export const eliminarMovimiento = (id: string): boolean => {
  try {
    db.runSync(`DELETE FROM movimientos_stock WHERE id = ?;`, [id]);
    return true;
  } catch (error) {
    console.error("Error al eliminar movimiento:", error);
    return false;
  }
};

// 6. CONSULTAS DE MOVIMIENTOS Y LOTES
// 6.1. Obtener lotes (con nombres de productos para búsqueda)
// `desde`/`hasta` opcionales en formato 'YYYY-MM-DD HH:MM:SS' para filtrar por
// rango de fechas (mismo formato que usa ventaService).
export const obtenerLotes = (limite: number = 100, desde?: string, hasta?: string): LoteUI[] => {
  try {
    const filtroFecha = desde && hasta ? "WHERE l.fecha BETWEEN ? AND ?" : "";
    const params: (string | number)[] = desde && hasta ? [desde, hasta, limite] : [limite];



















        return db.getAllSync<LoteUI>(
      `SELECT
         l.id,
         l.tipo,
         l.motivo,
         l.nota,
         l.total_productos,
         l.total_unidades,
         l.fecha,
         GROUP_CONCAT(p.nombre, ' · ') AS productos_nombres,
         v.total AS total_venta
       FROM lotes_movimiento l
       LEFT JOIN movimientos_stock m ON m.lote_id = l.id
       LEFT JOIN productos p ON p.id = m.producto_id
       LEFT JOIN ventas v ON v.lote_id = l.id
       ${filtroFecha}
       GROUP BY l.id
       ORDER BY l.fecha DESC, l.rowid DESC
       LIMIT ?;`,
      params,
    );
  } catch (error) {
    console.error("Error al obtener lotes:", error);
    return [];
  }
};

// 6.2. Obtener los items (productos) de un lote
// Los precios se toman, cuando existen, de la venta registrada (dato histórico
// exacto). Si el lote no proviene de una venta (entradas, ajustes, etc.) se usa
// el precio actual del catálogo como referencia.
export const obtenerItemsDeLote = (loteId: string): ItemLoteUI[] => {
  try {
    return db.getAllSync<ItemLoteUI>(
      `SELECT
         m.id,
         m.producto_id,
         p.nombre AS producto_nombre,
         p.marca AS producto_marca,
         p.categoria AS producto_categoria,
         m.tipo,
         m.cantidad,
         m.motivo,
         m.nota,
         m.fecha,
         COALESCE(vi.precio_venta_unitario, p.precio_venta, 0) AS precio_venta_unitario,
         COALESCE(vi.precio_compra_unitario, p.precio_compra, 0) AS precio_compra_unitario,
         CASE WHEN vi.id IS NOT NULL THEN 1 ELSE 0 END AS precios_de_venta
       FROM movimientos_stock m
       INNER JOIN productos p ON p.id = m.producto_id
       LEFT JOIN ventas_items vi
         ON vi.producto_id = m.producto_id
        AND vi.venta_id = (SELECT v.id FROM ventas v WHERE v.lote_id = m.lote_id LIMIT 1)
       WHERE m.lote_id = ?
       ORDER BY p.nombre ASC;`,
      [loteId],
    );
  } catch (error) {
    console.error("Error al obtener items del lote:", error);
    return [];
  }
};

// 6.3. Movimientos individuales (con nombre de producto)
export const obtenerMovimientosConProducto = (limite: number = 100): MovimientoUI[] => {
  try {
    return db.getAllSync<MovimientoUI>(
      `SELECT
         m.id,
         m.producto_id,
         p.nombre AS producto_nombre,
         m.tipo,
         m.cantidad,
         m.motivo,
         m.nota,
         m.fecha
       FROM movimientos_stock m
       INNER JOIN productos p ON p.id = m.producto_id
       ORDER BY m.fecha DESC, m.rowid DESC
       LIMIT ?;`,
      [limite],
    );
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    return [];
  }
};

// 6.4. Movimientos de un producto específico
export const obtenerMovimientosPorProducto = (productoId: string): MovimientoDB[] => {
  try {
    return db.getAllSync<MovimientoDB>(
      `SELECT * FROM movimientos_stock
       WHERE producto_id = ?
       ORDER BY fecha DESC, rowid DESC;`,
      [productoId],
    );
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    return [];
  }
};

// 6.5. Últimos movimientos globales
export const obtenerMovimientosRecientes = (limite: number = 50): MovimientoDB[] => {
  try {
    return db.getAllSync<MovimientoDB>(
      `SELECT * FROM movimientos_stock
       ORDER BY fecha DESC, rowid DESC
       LIMIT ?;`,
      [limite],
    );
  } catch (error) {
    console.error("Error al obtener movimientos recientes:", error);
    return [];
  }
};

// 7. AUDITORÍA / CÁLCULOS
// 7.1. Calcular stock desde movimientos
export const calcularStockDesdeMovimientos = (productoId: string): number => {
  try {
    const resultado = db.getFirstSync<{ stock: number }>(
      `SELECT COALESCE(SUM(
        CASE
          WHEN tipo = 'entrada' THEN cantidad
          WHEN tipo = 'salida' THEN -cantidad
          WHEN tipo = 'ajuste' THEN cantidad
          ELSE 0
        END
      ), 0) AS stock
      FROM movimientos_stock
      WHERE producto_id = ?;`,
      [productoId],
    );
    return resultado?.stock ?? 0;
  } catch (error) {
    console.error("Error al calcular stock:", error);
    return 0;
  }
};

// 7.2. Resumen de movimientos de un producto
export const obtenerResumenMovimientos = (productoId: string): ResumenMovimientos => {
  try {
    const r = db.getFirstSync<{
      entradas: number;
      salidas: number;
      ajustes: number;
      total: number;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE 0 END), 0) AS entradas,
        COALESCE(SUM(CASE WHEN tipo = 'salida'  THEN cantidad ELSE 0 END), 0) AS salidas,
        COALESCE(SUM(CASE WHEN tipo = 'ajuste'  THEN cantidad ELSE 0 END), 0) AS ajustes,
        COUNT(*) AS total
      FROM movimientos_stock
      WHERE producto_id = ?;`,
      [productoId],
    );

    return {
      entradas: r?.entradas ?? 0,
      salidas: r?.salidas ?? 0,
      ajustes: r?.ajustes ?? 0,
      total: r?.total ?? 0,
    };
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    return { entradas: 0, salidas: 0, ajustes: 0, total: 0 };
  }
};

// 7.3. Métricas del dashboard
export const obtenerMetricas = (): MetricasResumen => {
  try {
    // La ganancia usa los precios guardados en cada venta, no los actuales del catálogo.
    const gananciaSql = `
      SELECT
        COALESCE(SUM(
          vi.cantidad * (vi.precio_venta_unitario - vi.precio_compra_unitario)
        ), 0) AS ganancia
      FROM ventas_items vi
      INNER JOIN ventas v ON v.id = vi.venta_id
    `;

    const hoy = db.getFirstSync<{ ganancia: number }>(`${gananciaSql} WHERE DATE(v.fecha) = DATE('now', 'localtime');`);
    const total = db.getFirstSync<{ ganancia: number }>(`${gananciaSql};`);

    // Unidades vendidas
    const unidadesHoy = db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(vi.cantidad), 0) AS total
       FROM ventas_items vi
       INNER JOIN ventas v ON v.id = vi.venta_id
       WHERE DATE(v.fecha) = DATE('now', 'localtime');`,
    );

    const unidadesTotal = db.getFirstSync<{ total: number }>(`SELECT COALESCE(SUM(cantidad), 0) AS total FROM ventas_items;`);

    // Inventario
    const inventario = db.getFirstSync<{
      valor_venta: number;
      valor_costo: number;
      total: number;
    }>(
      `SELECT
        COALESCE(SUM(stock * precio_venta), 0) AS valor_venta,
        COALESCE(SUM(stock * COALESCE(precio_compra, 0)), 0) AS valor_costo,
        COUNT(*) AS total
       FROM productos
       WHERE activo = 1;`,
    );

    const bajoStock = db.getFirstSync<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM productos
       WHERE activo = 1 AND stock <= 2;`,
    );

    return {
      gananciaHoy: hoy?.ganancia ?? 0,
      gananciaTotal: total?.ganancia ?? 0,
      unidadesVendidasHoy: unidadesHoy?.total ?? 0,
      unidadesVendidasTotal: unidadesTotal?.total ?? 0,
      valorInventarioVenta: inventario?.valor_venta ?? 0,
      valorInventarioCosto: inventario?.valor_costo ?? 0,
      totalProductos: inventario?.total ?? 0,
      productosBajoStock: bajoStock?.total ?? 0,
    };
  } catch (error) {
    console.error("Error al obtener métricas:", error);
    return {
      gananciaHoy: 0,
      gananciaTotal: 0,
      unidadesVendidasHoy: 0,
      unidadesVendidasTotal: 0,
      valorInventarioVenta: 0,
      valorInventarioCosto: 0,
      totalProductos: 0,
      productosBajoStock: 0,
    };
  }
};

// 8. MANTENIMIENTO
// 8.1. Limpiar lotes huérfanos (lotes sin movimientos asociados)
export const limpiarLotesHuerfanos = (): number => {
  try {
    const antes = db.getFirstSync<{ total: number }>(`SELECT COUNT(*) as total FROM lotes_movimiento;`)?.total ?? 0;

    db.runSync(`
      DELETE FROM lotes_movimiento
      WHERE id NOT IN (
        SELECT DISTINCT lote_id
        FROM movimientos_stock
        WHERE lote_id IS NOT NULL
      );
    `);

    const despues = db.getFirstSync<{ total: number }>(`SELECT COUNT(*) as total FROM lotes_movimiento;`)?.total ?? 0;

    const eliminados = antes - despues;
    console.log(`🧹 Lotes huérfanos eliminados: ${eliminados}`);
    return eliminados;
  } catch (error) {
    console.error("Error al limpiar lotes huérfanos:", error);
    return 0;
  }
};
