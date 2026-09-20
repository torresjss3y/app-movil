import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("database_v2.db");

export const initDB = () => {
  try {
    db.execSync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;

      -- 1. TABLA PRODUCTOS
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY NOT NULL,
        codigo_barras TEXT UNIQUE,
        nombre TEXT NOT NULL,
        marca TEXT,
        categoria TEXT,
        precio_compra REAL DEFAULT 0,
        precio_venta REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        activo INTEGER DEFAULT 1,
        fecha_creacion TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        fecha_actualizacion TEXT
      );

      CREATE TABLE IF NOT EXISTS producto_atributos (
        id TEXT PRIMARY KEY NOT NULL,
        producto_id TEXT NOT NULL,
        clave TEXT NOT NULL,
        valor TEXT NOT NULL,
        orden INTEGER DEFAULT 0,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
        UNIQUE (producto_id, clave)
      );

      CREATE INDEX IF NOT EXISTS idx_atributos_producto ON producto_atributos(producto_id);
      CREATE INDEX IF NOT EXISTS idx_atributos_clave ON producto_atributos(clave);

      -- 2. TABLA MOVIMIENTOS_STOCK
      CREATE TABLE IF NOT EXISTS movimientos_stock (
        id TEXT PRIMARY KEY NOT NULL,
        producto_id TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        motivo TEXT NOT NULL,
        nota TEXT,
        lote_id TEXT,
        fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
      );

      -- Tabla de lotes
      CREATE TABLE IF NOT EXISTS lotes_movimiento (
        id TEXT PRIMARY KEY NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
        motivo TEXT NOT NULL,
        nota TEXT,
        total_productos INTEGER DEFAULT 0,
        total_unidades INTEGER DEFAULT 0,
        fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
      -- ========================================================
      -- TABLA VENTAS (cabecera del ticket)
      -- ========================================================
      CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY NOT NULL,
        lote_id TEXT,
        total REAL NOT NULL,
        total_items INTEGER NOT NULL,
        total_unidades INTEGER NOT NULL,
        metodo_pago TEXT NOT NULL DEFAULT 'efectivo',
        nota TEXT,
        fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (lote_id) REFERENCES lotes_movimiento(id) ON DELETE SET NULL
      );

      -- ========================================================
      -- TABLA VENTAS_ITEMS (líneas del ticket)
      -- ========================================================
      CREATE TABLE IF NOT EXISTS ventas_items (
        id TEXT PRIMARY KEY NOT NULL,
        venta_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        producto_nombre TEXT NOT NULL,
        producto_marca TEXT,
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_venta_unitario REAL NOT NULL,
        precio_compra_unitario REAL NOT NULL DEFAULT 0,
        subtotal REAL NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
      );

      -- ========================================================
      -- ÍNDICES
      -- ========================================================
      CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
      CREATE INDEX IF NOT EXISTS idx_ventas_lote ON ventas(lote_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_metodo ON ventas(metodo_pago);

      CREATE INDEX IF NOT EXISTS idx_ventas_items_venta ON ventas_items(venta_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_items_producto ON ventas_items(producto_id);
            


      -- 3. TRIGGER: fecha de actualización del producto
      DROP TRIGGER IF EXISTS actualizar_fecha_producto;
      CREATE TRIGGER actualizar_fecha_producto
      AFTER UPDATE ON productos
      FOR EACH ROW
      BEGIN
        UPDATE productos 
        SET fecha_actualizacion = datetime('now', 'localtime')
        WHERE id = NEW.id;
      END;

      -- 4. TRIGGER: al INSERTAR producto, sincronizar activo con stock
      DROP TRIGGER IF EXISTS sync_activo_al_insertar;
      CREATE TRIGGER sync_activo_al_insertar
      AFTER INSERT ON productos
      FOR EACH ROW
      WHEN (NEW.stock = 0 AND NEW.activo = 1)
        OR (NEW.stock > 0 AND NEW.activo = 0)
      BEGIN
        UPDATE productos
        SET activo = CASE WHEN NEW.stock = 0 THEN 0 ELSE 1 END
        WHERE id = NEW.id;
      END;

      -- 5. TRIGGER: al INSERTAR un movimiento,
      --    recalcula stock del producto y su activo.
      DROP TRIGGER IF EXISTS recalcular_stock_al_insertar_movimiento;
      CREATE TRIGGER recalcular_stock_al_insertar_movimiento
      AFTER INSERT ON movimientos_stock
      FOR EACH ROW
      BEGIN
        UPDATE productos
        SET stock = (
              SELECT COALESCE(SUM(
                CASE
                  WHEN tipo = 'entrada' THEN cantidad
                  WHEN tipo = 'salida'  THEN -cantidad
                  WHEN tipo = 'ajuste'  THEN cantidad
                END
              ), 0)
              FROM movimientos_stock
              WHERE producto_id = NEW.producto_id
            ),
            activo = CASE 
              WHEN (
                SELECT COALESCE(SUM(
                  CASE
                    WHEN tipo = 'entrada' THEN cantidad
                    WHEN tipo = 'salida'  THEN -cantidad
                    WHEN tipo = 'ajuste'  THEN cantidad
                  END
                ), 0)
                FROM movimientos_stock
                WHERE producto_id = NEW.producto_id
              ) > 0 THEN 1
              ELSE 0
            END
        WHERE id = NEW.producto_id;
      END;

      -- 6. TRIGGER: al ELIMINAR un movimiento,
      DROP TRIGGER IF EXISTS recalcular_stock_al_eliminar_movimiento;
      CREATE TRIGGER recalcular_stock_al_eliminar_movimiento
      AFTER DELETE ON movimientos_stock
      FOR EACH ROW
      BEGIN
        UPDATE productos
        SET stock = (
              SELECT COALESCE(SUM(
                CASE
                  WHEN tipo = 'entrada' THEN cantidad
                  WHEN tipo = 'salida'  THEN -cantidad
                  WHEN tipo = 'ajuste'  THEN cantidad
                END
              ), 0)
              FROM movimientos_stock
              WHERE producto_id = OLD.producto_id
            ),
            activo = CASE 
              WHEN (
                SELECT COALESCE(SUM(
                  CASE
                    WHEN tipo = 'entrada' THEN cantidad
                    WHEN tipo = 'salida'  THEN -cantidad
                    WHEN tipo = 'ajuste'  THEN cantidad
                  END
                ), 0)
                FROM movimientos_stock
                WHERE producto_id = OLD.producto_id
              ) > 0 THEN 1
              ELSE 0
            END
        WHERE id = OLD.producto_id;
      END;

      -- 7. TRIGGER: al ACTUALIZAR un movimiento,
      DROP TRIGGER IF EXISTS recalcular_stock_al_actualizar_movimiento;
      CREATE TRIGGER recalcular_stock_al_actualizar_movimiento
      AFTER UPDATE ON movimientos_stock
      FOR EACH ROW
      BEGIN
        UPDATE productos
        SET stock = (
              SELECT COALESCE(SUM(
                CASE
                  WHEN tipo = 'entrada' THEN cantidad
                  WHEN tipo = 'salida'  THEN -cantidad
                  WHEN tipo = 'ajuste'  THEN cantidad
                END
              ), 0)
              FROM movimientos_stock
              WHERE producto_id = NEW.producto_id
            ),
            activo = CASE 
              WHEN (
                SELECT COALESCE(SUM(
                  CASE
                    WHEN tipo = 'entrada' THEN cantidad
                    WHEN tipo = 'salida'  THEN -cantidad
                    WHEN tipo = 'ajuste'  THEN cantidad
                  END
                ), 0)
                FROM movimientos_stock
                WHERE producto_id = NEW.producto_id
              ) > 0 THEN 1
              ELSE 0
            END
        WHERE id = NEW.producto_id;
      END;

      -- 8. ÍNDICES
      CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_barras);
      CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
      CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);

      CREATE INDEX IF NOT EXISTS idx_mov_producto ON movimientos_stock(producto_id);
      CREATE INDEX IF NOT EXISTS idx_mov_tipo ON movimientos_stock(tipo);
      CREATE INDEX IF NOT EXISTS idx_mov_motivo ON movimientos_stock(motivo);
      CREATE INDEX IF NOT EXISTS idx_mov_fecha ON movimientos_stock(fecha);

      CREATE INDEX IF NOT EXISTS idx_lotes_tipo ON lotes_movimiento(tipo);
      CREATE INDEX IF NOT EXISTS idx_lotes_fecha ON lotes_movimiento(fecha);
    `);

    const columnasMovimiento = db.getAllSync<{ name: string }>(`PRAGMA table_info(movimientos_stock);`);
    if (!columnasMovimiento.some((columna) => columna.name === "lote_id")) {
      db.execSync(`ALTER TABLE movimientos_stock ADD COLUMN lote_id TEXT;`);
    }
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_mov_lote ON movimientos_stock(lote_id);`);

    console.log("Base de datos inicializada con soporte de movimientos de stock.");
  } catch (error) {
    console.error("Error al inicializar la base de datos SQLite:", error);
  }
};

export default db;
