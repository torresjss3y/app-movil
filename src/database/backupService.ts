import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";

import db from "./db";

// Nombre del archivo de la base de datos (debe coincidir con db.ts)
export const DB_NAME = "database_v2.db";

// Formato del respaldo: una cabecera JSON corta + el volcado binario de SQLite.
// Guardamos la cabecera en el propio archivo para poder validarlo al restaurar.
const BACKUP_MAGIC = "MIPRIMERAAPP_BACKUP_V1";
const BACKUP_MIME = "application/octet-stream";

export interface ResultadoBackup {
  ok: boolean;
  mensaje: string;
  nombreArchivo?: string;
}

export interface ResultadoRestauracion {
  ok: boolean;
  mensaje: string;
}

/**
 * Genera un respaldo de la base de datos y lo comparte con el usuario.
 *
 * Estrategia:
 *   1. `serializeAsync()` produce un snapshot binario consistente de la BD.
 *   2. Se guarda en la carpeta de documentos de la app como `<fecha>.db`.
 *   3. Se abre el diálogo nativo de compartir para que el usuario lo envíe
 *      a Drive, correo, WhatsApp, etc.
 *
 * En web, `expo-sharing` no puede compartir archivos locales, así que se
 * informa al usuario en lugar de fallar silenciosamente.
 */
export async function exportarRespaldo(): Promise<ResultadoBackup> {
  try {
    // 1. Snapshot binario de la base de datos actual
    const bytes = await db.serializeAsync();

    // 2. Nombre con marca de tiempo: backup-2026-02-14_1030.db
    const ahora = new Date();
    const sello = [ahora.getFullYear(), String(ahora.getMonth() + 1).padStart(2, "0"), String(ahora.getDate()).padStart(2, "0")].join("-");
    const hora = [String(ahora.getHours()).padStart(2, "0"), String(ahora.getMinutes()).padStart(2, "0")].join("");
    const nombreArchivo = `backup-${sello}_${hora}.db`;

    // 3. Escribimos el archivo: cabecera + datos binarios
    const archivo = new File(Paths.document, nombreArchivo);
    if (archivo.exists) archivo.delete();
    archivo.create();
    archivo.write(concatenarCabeceraYBytes(bytes));

    // 4. Compartimos el archivo con otras apps
    const disponible = await Sharing.isAvailableAsync();
    if (!disponible) {
      return {
        ok: true,
        nombreArchivo,
        mensaje: `Respaldo creado en la carpeta de la app como "${nombreArchivo}". El compartir archivos no está disponible en esta plataforma (web).`,
      };
    }

    await Sharing.shareAsync(archivo.uri, {
      mimeType: BACKUP_MIME,
      dialogTitle: "Compartir respaldo de la base de datos",
      UTI: "public.database",
    });

    return { ok: true, nombreArchivo, mensaje: `Respaldo "${nombreArchivo}" generado correctamente.` };
  } catch (error) {
    console.error("Error al exportar respaldo:", error);
    return { ok: false, mensaje: "No se pudo generar el respaldo. Revisa la consola para más detalles." };
  }
}

/**
 * Permite al usuario elegir un archivo de respaldo y lo aplica sobre la
 * base de datos en uso.
 *
 * Estrategia:
 *   1. `expo-document-picker` abre el selector de archivos.
 *   2. Se lee el archivo elegido y se valida la cabecera del respaldo.
 *   3. `SQLite.deserializeDatabaseAsync()` reconstruye una BD en memoria.
 *   4. `SQLite.backupDatabaseAsync()` vuelca ese contenido sobre la BD real,
 *      conservando el nombre de archivo actual (no hay que reiniciar la app).
 *
 * Requiere recargar la app después para que la UI lea los datos restaurados.
 */
export async function importarRespaldo(): Promise<ResultadoRestauracion> {
  try {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ["*/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (resultado.canceled || !resultado.assets?.[0]) {
      return { ok: false, mensaje: "Importación cancelada." };
    }

    const asset = resultado.assets[0];
    const archivo = new File(asset.uri);

    if (!archivo.exists) {
      return { ok: false, mensaje: "No se pudo leer el archivo seleccionado." };
    }

    const contenido = archivo.bytesSync();
    const bytesDb = extraerBytesDelRespaldo(contenido);

    if (!bytesDb) {
      return {
        ok: false,
        mensaje: "El archivo seleccionado no es un respaldo válido de MiPrimeraApp.",
      };
    }

    // Reconstruimos una BD en memoria a partir del volcado y la volcamos
    // sobre la base de datos en uso mediante la API de backup de SQLite.
    const dbRespaldo = await SQLite.deserializeDatabaseAsync(bytesDb);
    try {
      await SQLite.backupDatabaseAsync({
        sourceDatabase: dbRespaldo,
        sourceDatabaseName: "backup",
        destDatabase: db,
        destDatabaseName: DB_NAME,
      });
    } finally {
      await dbRespaldo.closeAsync();
    }

    return {
      ok: true,
      mensaje: "Datos restaurados correctamente. Cierra y vuelve a abrir la app para ver los cambios.",
    };
  } catch (error) {
    console.error("Error al importar respaldo:", error);
    return { ok: false, mensaje: "No se pudo restaurar el respaldo. Verifica que el archivo sea correcto." };
  }
}

// ---------------------------------------------------------------------
// Helpers de serialización
// ---------------------------------------------------------------------

// Cabecera: BACKUP_MAGIC + "\n" para poder reconocer nuestros respaldos
function concatenarCabeceraYBytes(bytes: Uint8Array): Uint8Array {
  const cabecera = new TextEncoder().encode(`${BACKUP_MAGIC}\n`);
  const salida = new Uint8Array(cabecera.length + bytes.length);
  salida.set(cabecera, 0);
  salida.set(bytes, cabecera.length);
  return salida;
}

// Devuelve el bloque de la BD si el archivo es un respaldo válido, o null.
function extraerBytesDelRespaldo(contenido: Uint8Array): Uint8Array | null {
  const cabecera = new TextEncoder().encode(`${BACKUP_MAGIC}\n`);

  if (contenido.length <= cabecera.length) return null;

  for (let i = 0; i < cabecera.length; i += 1) {
    if (contenido[i] !== cabecera[i]) return null;
  }

  return contenido.slice(cabecera.length);
}
