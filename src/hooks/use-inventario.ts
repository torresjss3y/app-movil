import { FiltroStock } from "@/components/inventario";
import { obtenerProductos, ProductoDB } from "@/database/productosService";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";



export type { FiltroStock };
export function useInventario() {
  const [productos, setProductos] = useState<ProductoDB[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("todos");

  const cargarProductos = useCallback(() => {
    const data = obtenerProductos();
    setProductos(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarProductos();
    }, [cargarProductos]),
  );

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((item) => {
      const coincideTexto =
        item.nombre.toLowerCase().includes(texto) ||
        (item.codigo_barras && item.codigo_barras.toLowerCase().includes(texto)) ||
        (item.marca && item.marca.toLowerCase().includes(texto)) ||
        item.atributos.some((atributo) => atributo.clave.toLowerCase().includes(texto) || atributo.valor.toLowerCase().includes(texto));

      if (!coincideTexto) return false;

      if (filtroStock === "inactivos") return item.activo === 0;
      if (item.activo !== 1) return false;

      const stockMinimo = 2;

      if (filtroStock === "bajo") return item.stock > 0 && item.stock <= stockMinimo;
      if (filtroStock === "agotado") return item.stock === 0;
      return true;
    });
  }, [productos, busqueda, filtroStock]);

  // Contadores por filtro
  const contadores = useMemo(() => {
    const activos = productos.filter((p) => p.activo === 1);
    return {
      todos: activos.length,
      bajo: activos.filter((p) => p.stock > 0 && p.stock <= 2).length,
      agotado: activos.filter((p) => p.stock === 0).length,
      inactivos: productos.filter((p) => p.activo === 0).length,
    };
  }, [productos]);

  return {
    productos,
    productosFiltrados,
    busqueda,
    setBusqueda,
    filtroStock,
    setFiltroStock,
    contadores,
    cargarProductos,
  };
}

