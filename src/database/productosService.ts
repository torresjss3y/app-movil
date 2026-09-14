import db from "./db";

// Interfaces para TypeScript
export interface ProductoDB {
  id: string;
  codigo_barras?: string | null;
  nombre: string;
  marca?: string | null;
  categoria?: string | null;
  talla: string;
  color?: string | null;
  precio_compra?: number;
  precio_venta: number;
  stock: number;
  stock_minimo?: number;
  activo?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string | null;
}

export const verificarEstructuraDB = () => {
  try {
    // 1. Verificar si la tabla 'productos' existe en SQLite
    const tablas = db.getAllSync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='productos';`,
    );

    if (tablas.length === 0) {
      console.warn("⚠️ LA TABLA 'productos' NO EXISTE EN LA BASE DE DATOS.");
      return false;
    }

    console.log("✅ Tabla 'productos' encontrada correctamente.");

    // 2. Inspeccionar la lista de columnas creadas
    const columnas = db.getAllSync<{ name: string; type: string }>(
      `PRAGMA table_info(productos);`,
    );

    console.log("📋 Columnas encontradas en 'productos':");
    columnas.forEach((col) => console.log(` - ${col.name} (${col.type})`));

    // 3. Contar total de registros almacenados
    const conteo = db.getFirstSync<{ total: number }>(
      `SELECT COUNT(*) as total FROM productos;`,
    );
    console.log(`📦 Total de productos registrados: ${conteo?.total ?? 0}`);

    return true;
  } catch (error) {
    console.error(" Error verificando la base de datos:", error);
    return false;
  }
};

export type NuevoProductoInput = Omit<
  ProductoDB,
  "fecha_creacion" | "fecha_actualizacion" | "activo"
>;

export type EditarProductoInput = Partial<NuevoProductoInput> & {
  id: string;
};

// 1. OBTENER TODOS LOS PRODUCTOS ACTIVOS
export const obtenerProductos = (): ProductoDB[] => {
  try {
    return db.getAllSync<ProductoDB>(
      `SELECT * FROM productos WHERE activo = 1 ORDER BY nombre ASC;`,
    );
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};

// 2. BUSCAR POR CÓDIGO DE BARRAS O ID
export const obtenerProductoPorCodigo = (codigo: string): ProductoDB | null => {
  try {
    return (
      db.getFirstSync<ProductoDB>(
        `SELECT * FROM productos WHERE (codigo_barras = ? OR id = ?) AND activo = 1;`,
        [codigo, codigo],
      ) || null
    );
  } catch (error) {
    console.error("Error al buscar producto por código:", error);
    return null;
  }
};

// 3. GUARDAR NUEVO PRODUCTO (Omite fechas para dejar actuar a SQLite)
export const crearProducto = (producto: NuevoProductoInput): boolean => {
  try {
    db.runSync(
      `INSERT INTO productos (
        id, codigo_barras, nombre, marca, categoria, talla, color,
        precio_compra, precio_venta, stock, stock_minimo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        producto.id,
        producto.codigo_barras?.trim() || null,
        producto.nombre.trim(),
        producto.marca?.trim() || null,
        producto.categoria?.trim() || null,
        producto.talla.trim(),
        producto.color?.trim() || null,
        producto.precio_compra ?? 0,
        producto.precio_venta,
        producto.stock,
        producto.stock_minimo ?? 2,
      ],
    );
    return true;
  } catch (error) {
    console.error("Error al crear producto:", error);
    return false;
  }
};

// 4. ACTUALIZAR PRODUCTO (El Trigger 'actualizar_fecha_producto' actualizará la fecha automáticamente)
export const actualizarProducto = (producto: EditarProductoInput): boolean => {
  try {
    db.runSync(
      `UPDATE productos SET
        codigo_barras = COALESCE(?, codigo_barras),
        nombre = COALESCE(?, nombre),
        marca = COALESCE(?, marca),
        categoria = COALESCE(?, categoria),
        talla = COALESCE(?, talla),
        color = COALESCE(?, color),
        precio_compra = COALESCE(?, precio_compra),
        precio_venta = COALESCE(?, precio_venta),
        stock = COALESCE(?, stock),
        stock_minimo = COALESCE(?, stock_minimo)
      WHERE id = ?;`,
      [
        producto.codigo_barras?.trim() ?? null,
        producto.nombre?.trim() ?? null,
        producto.marca?.trim() ?? null,
        producto.categoria?.trim() ?? null,
        producto.talla?.trim() ?? null,
        producto.color?.trim() ?? null,
        producto.precio_compra ?? null,
        producto.precio_venta ?? null,
        producto.stock ?? null,
        producto.stock_minimo ?? null,
        producto.id,
      ],
    );
    return true;
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return false;
  }
};

// 5. BORRADO LÓGICO (Desactivar en lugar de eliminar para preservar historial)
export const desactivarProducto = (id: string): boolean => {
  try {
    db.runSync(`UPDATE productos SET activo = 0 WHERE id = ?;`, [id]);
    return true;
  } catch (error) {
    console.error("Error al desactivar producto:", error);
    return false;
  }
};
