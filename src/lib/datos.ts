import { getEntry, type CollectionEntry } from 'astro:content';

export type Tabla = {
  columnas: string[];
  filas: Record<string, string>[];
};

/** Lector de CSV (RFC 4180): comas, comillas dobles y saltos de línea dentro de comillas. */
export function leerCSV(texto: string): Tabla {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let entreComillas = false;
  const t = texto.replace(/^﻿/, '');

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (entreComillas) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else entreComillas = false;
      } else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ',') {
      fila.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      fila.push(campo);
      campo = '';
      if (fila.some((v) => v.trim() !== '')) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  fila.push(campo);
  if (fila.some((v) => v.trim() !== '')) filas.push(fila);

  const [cabecera = [], ...resto] = filas;
  const columnas = cabecera.map((c) => c.trim());
  return {
    columnas,
    filas: resto.map((f) => Object.fromEntries(columnas.map((c, i) => [c, (f[i] ?? '').trim()]))),
  };
}

export function esNumero(v: string): boolean {
  return v !== '' && !Number.isNaN(Number(v));
}

export function formatoNumero(v: string, locale = 'es-ES', conSigno = false): string {
  if (!esNumero(v)) return v;
  const n = Number(v);
  const decimales = (v.split('.')[1] ?? '').length;
  const texto = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n);
  return conSigno && n > 0 ? `+${texto}` : texto;
}

export function listaColumnas(texto: string | undefined): string[] {
  return (texto ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

export function ordenarFilas(tabla: Tabla, orden: string | undefined): Record<string, string>[] {
  if (!orden) return tabla.filas;
  const [col, dir = 'desc'] = orden.split(/:(?=asc$|desc$)/);
  const columna = col.trim();
  if (!tabla.columnas.includes(columna)) return tabla.filas;
  const signo = dir.trim() === 'asc' ? 1 : -1;
  return [...tabla.filas].sort((a, b) => {
    const x = a[columna];
    const y = b[columna];
    if (esNumero(x) && esNumero(y)) return (Number(x) - Number(y)) * signo;
    return x.localeCompare(y, 'es') * signo;
  });
}

export async function cargarDatos(
  id: string,
): Promise<{ meta: CollectionEntry<'datos'>; tabla: Tabla }> {
  const meta = await getEntry('datos', id);
  if (!meta) throw new Error(`[macaronesico] No existe el conjunto de datos "${id}" en src/content/datos/`);
  return { meta, tabla: leerCSV(meta.data.csv) };
}
