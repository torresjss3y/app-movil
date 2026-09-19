import { MovimientoUI } from "../types/movimientos";
import db from "./db";

// ============================================================
// PRODUCTOS
// ============================================================

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

// ============================================================
// MOVIMIENTOS Y LOTES
// ============================================================

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

// Item individual de un lote (producto + cantidad)
export interface ItemLoteUI {
  id: string;
  producto_id: string;
  producto_nombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  nota?: string | null;
  fecha: string;
}

// Lote completo con productos consolidados
export interface LoteUI {
  id: string;
  tipo: TipoMovimiento;
  motivo: string;
  nota?: string | null;
  total_productos: number;
  total_unidades: number;
  fecha: string;
  productos_nombres?: string | null; // GROUP_CONCAT de nombres
}

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

// ============================================================
// VERIFICACIÓN DE ESTRUCTURA
// ============================================================

export const verificarEstructuraDB = () => {
  try {
    const tablas = db.getAllSync<{ name: string }>(`SELECT name FROM sqlite_master WHERE type='table' AND name='productos';`);
    if (tablas.length === 0) {
      console.warn("⚠️ LA TABLA 'productos' NO EXISTE EN LA BASE DE DATOS.");
      return false;
    }
    console.log("✅ Tabla 'productos' encontrada correctamente.");

    const conteo = db.getFirstSync<{ total: number }>(`SELECT COUNT(*) as total FROM productos;`);
    console.log(`📦 Total de productos registrados: ${conteo?.total ?? 0}`);
    return true;
  } catch (error) {
    console.error("Error verificando la base de datos:", error);
    return false;
  }
};

// ============================================================
// CRUD PRODUCTOS
// ============================================================

// 1. OBTENER TODOS LOS PRODUCTOS
export const obtenerProductos = (): ProductoDB[] => {
  try {
    const productos = db.getAllSync<Omit<ProductoDB, "atributos">>(`SELECT * FROM productos ORDER BY nombre ASC;`);
    return productos.map(adjuntarAtributos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};

// 2. BUSCAR POR CÓDIGO DE BARRAS
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

// 3. BUSCAR POR ID
export const obtenerProductoPorId = (id: string): ProductoDB | null => {
  try {
    const resultado = db.getFirstSync<Omit<ProductoDB, "atributos">>(`SELECT * FROM productos WHERE id = ?;`, [id]);
    return resultado ? adjuntarAtributos(resultado) : null;
  } catch (error) {
    console.error("Error al buscar producto por id:", error);
    return null;
  }
};

// 4. CREAR PRODUCTO + REGISTRAR STOCK INICIAL COMO MOVIMIENTO
export const crearProducto = (producto: NuevoProductoInput): boolean => {
  let productoInsertado = false;

  try {
    const codigoBarrasLimpio = producto.codigo_barras?.trim() || null;
    const stockInicial = Number(producto.stock) || 0;

    db.runSync(
      `INSERT INTO productos (
        id, codigo_barras, nombre, marca, categoria,
        precio_compra, precio_venta, stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0);`,
      [
        producto.id,
        codigoBarrasLimpio,
        producto.nombre.trim(),
        producto.marca?.trim() || null,
        producto.categoria?.trim() || null,
        producto.precio_compra ?? 0,
        producto.precio_venta,
      ],
    );
    productoInsertado = true;

    guardarAtributos(producto.id, producto.atributos ?? []);

    if (stockInicial > 0) {
      const loteId = `L-${Date.now()}`;

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

    return true;
  } catch (error) {
    if (productoInsertado) {
      try {
        db.runSync(`DELETE FROM productos WHERE id = ?;`, [producto.id]);
      } catch (cleanupError) {
        console.error("Error al limpiar alta incompleta de producto:", cleanupError);
      }
    }
    console.error("Error al crear producto:", error);
    return false;
  }
};

// 5. ACTUALIZAR PRODUCTO (NO toca stock — el stock solo cambia por movimientos)
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
        [
          producto.codigo_barras?.trim() ?? null,
          producto.nombre?.trim() ?? null,
          producto.marca?.trim() ?? null,
          producto.categoria?.trim() ?? null,
          producto.precio_compra ?? null,
          producto.precio_venta ?? null,
          producto.id,
        ],
      );
      if (producto.atributos) guardarAtributos(producto.id, producto.atributos);
    });
    return true;
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return false;
  }
};

// 6. ELIMINAR PRODUCTO (CASCADE borra sus movimientos automáticamente)
export const eliminarProducto = (id: string): boolean => {
  try {
    db.runSync(`DELETE FROM productos WHERE id = ?;`, [id]);
    return true;
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return false;
  }
};

// ============================================================
// REGISTRO DE MOVIMIENTOS
// ============================================================

// 7. REGISTRAR UN MOVIMIENTO INDIVIDUAL
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
      [Date.now().toString(), mov.producto_id, mov.tipo, mov.cantidad, mov.motivo, mov.nota?.trim() || null],
    );
    return true;
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return false;
  }
};

// 8. REGISTRAR UN LOTE COMPLETO (N movimientos en 1 sola fecha)
export const registrarLote = (input: RegistrarLoteInput): string | null => {
  try {
    if (input.items.length === 0) {
      console.warn("El lote está vacío");
      return null;
    }

    const loteId = `L-${Date.now()}`;
    const totalUnidades = input.items.reduce((acc, i) => acc + i.cantidad, 0);
    const totalProductos = input.items.length;

    db.withTransactionSync(() => {
      // 8.1. Crear el lote
      db.runSync(
        `INSERT INTO lotes_movimiento
          (id, tipo, motivo, nota, total_productos, total_unidades)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [loteId, input.tipo, input.motivo, input.nota || null, totalProductos, totalUnidades],
      );

      // 8.2. Crear cada movimiento individual
      for (const item of input.items) {
        db.runSync(
          `INSERT INTO movimientos_stock
            (id, producto_id, tipo, cantidad, motivo, nota, lote_id)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [`${loteId}-${item.producto_id}`, item.producto_id, input.tipo, item.cantidad, input.motivo, item.nota || null, loteId],
        );
      }
    });

    return loteId;
  } catch (error) {
    console.error("Error al registrar lote:", error);
    return null;
  }
};

// ============================================================
// CONSULTAS DE MOVIMIENTOS Y LOTES
// ============================================================

// 9. OBTENER LOTES (con nombres de productos para búsqueda)
export const obtenerLotes = (limite: number = 100): LoteUI[] => {
  try {
    return db.getAllSync<LoteUI>(
      `SELECT
         l.id,
         l.tipo,
         l.motivo,
         l.nota,
         l.total_productos,
         l.total_unidades,
         l.fecha,
         GROUP_CONCAT(p.nombre, ' · ') AS productos_nombres
       FROM lotes_movimiento l
       LEFT JOIN movimientos_stock m ON m.lote_id = l.id
       LEFT JOIN productos p ON p.id = m.producto_id
       GROUP BY l.id
       ORDER BY l.fecha DESC, l.rowid DESC
       LIMIT ?;`,
      [limite],
    );
  } catch (error) {
    console.error("Error al obtener lotes:", error);
    return [];
  }
};

// 10. OBTENER LOS ITEMS (productos) DE UN LOTE
export const obtenerItemsDeLote = (loteId: string): ItemLoteUI[] => {
  try {
    return db.getAllSync<ItemLoteUI>(
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
       WHERE m.lote_id = ?
       ORDER BY p.nombre ASC;`,
      [loteId],
    );
  } catch (error) {
    console.error("Error al obtener items del lote:", error);
    return [];
  }
};

// 11. MOVIMIENTOS INDIVIDUALES (con nombre de producto)
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

// 12. MOVIMIENTOS DE UN PRODUCTO ESPECÍFICO
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

// 13. ÚLTIMOS MOVIMIENTOS GLOBALES
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

// ============================================================
// AUDITORÍA / CÁLCULOS
// ============================================================

// 14. CALCULAR STOCK DESDE MOVIMIENTOS
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

// 15. RESUMEN DE MOVIMIENTOS DE UN PRODUCTO
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

// 16. ELIMINAR UN MOVIMIENTO
export const eliminarMovimiento = (id: string): boolean => {
  try {
    db.runSync(`DELETE FROM movimientos_stock WHERE id = ?;`, [id]);
    return true;
  } catch (error) {
    console.error("Error al eliminar movimiento:", error);
    return false;
  }
};
