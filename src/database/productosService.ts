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
      `SELECT * FROM productos ORDER BY nombre ASC;`,
    );
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};

// 2. BUSCAR POR CÓDIGO DE BARRAS O ID
export const obtenerProductoPorCodigo = (codigo: string): ProductoDB | null => {
  try {
    const codigoLimpio = codigo.trim();
    const resultado = db.getFirstSync<ProductoDB>(
      `SELECT * FROM productos WHERE codigo_barras = ? AND activo = 1;`,
      [codigoLimpio],
    );
    return resultado || null;
  } catch (error) {
    console.error("Error al buscar producto por código:", error);
    return null;
  }
};

// 3. GUARDAR O ACTUALIZAR PRODUCTO (Actualiza datos si el codigo_barras ya existe)
export const crearProducto = (producto: NuevoProductoInput): boolean => {
  try {
    const codigoBarrasLimpio = producto.codigo_barras?.trim() || null;

    db.runSync(
      `INSERT INTO productos (
        id, codigo_barras, nombre, marca, categoria, talla, color,
        precio_compra, precio_venta, stock, stock_minimo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(codigo_barras) DO UPDATE SET
        nombre = excluded.nombre,
        marca = excluded.marca,
        categoria = COALESCE(excluded.categoria, productos.categoria),
        talla = excluded.talla,
        color = COALESCE(excluded.color, productos.color),
        precio_compra = excluded.precio_compra,
        precio_venta = excluded.precio_venta,
        stock = productos.stock + excluded.stock,
        stock_minimo = excluded.stock_minimo,
        activo = 1;`,
      [
        producto.id,
        codigoBarrasLimpio,
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
    console.error("Error al crear/actualizar producto:", error);
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

// 6. ELIMINAR PRODUCTO (Borrar de la base de datos)
export const eliminarProducto = (id: string): boolean => {
  try {
    db.runSync(`DELETE FROM productos WHERE id = ?;`, [id]);
    return true;
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return false;
  }
};
