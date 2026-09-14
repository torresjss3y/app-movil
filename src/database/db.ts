import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("calzado_pos.db");

export const initDB = () => {
  try {
    db.execSync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;

      -- 1. TABLA PRODUCTOS CON FECHAS AUTOMÁTICAS
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY NOT NULL,
        codigo_barras TEXT UNIQUE,
        nombre TEXT NOT NULL,
        marca TEXT,
        categoria TEXT,
        talla TEXT NOT NULL,
        color TEXT,
        precio_compra REAL DEFAULT 0,
        precio_venta REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        stock_minimo INTEGER DEFAULT 2,
        activo INTEGER DEFAULT 1,
        
        -- Asigna la fecha local actual al CREAR
        fecha_creacion TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        fecha_actualizacion TEXT
      );

      -- 2. TRIGGER AUTOMÁTICO PARA EDICIONES / ACTUALIZACIONES
      CREATE TRIGGER IF NOT EXISTS actualizar_fecha_producto
      AFTER UPDATE ON productos
      FOR EACH ROW
      BEGIN
        UPDATE productos 
        SET fecha_actualizacion = datetime('now', 'localtime')
        WHERE id = NEW.id;
      END;

      -- 3. ÍNDICES DE RENDIMIENTO
      CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_barras);
      CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
      CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
      CREATE INDEX IF NOT EXISTS idx_productos_talla ON productos(talla);
    `);

    console.log(
      "Base de datos inicializada con fechas automáticas (Creación y Actualización).",
    );
  } catch (error) {
    console.error("Error al inicializar la base de datos SQLite:", error);
  }
};

export default db;
