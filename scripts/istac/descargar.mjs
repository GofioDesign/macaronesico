#!/usr/bin/env node
/**
 * Descarga las consultas y conjuntos de datos del ISTAC usados en los
 * artículos, para conservar la procedencia de cada cifra.
 *
 *   npm run istac:descargar
 *
 * Guarda el JSON original en scripts/istac/crudo/ (no se sube al repositorio)
 * con la fecha de descarga. Los CSV publicados en src/content/datos/ se
 * elaboran a partir de estos archivos; su método está en el campo "notas".
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://datos.canarias.es/api/estadisticas/statistical-resources/v1.0';
const FUENTES = {
  'ecosoc-2026t2-percepcion-por-edad': `${BASE}/queries/ISTAC/C00086A_000028.json`,
  'ecosoc-2026t2-impacto-economico-por-edad': `${BASE}/queries/ISTAC/C00086A_000030.json`,
  'ecosoc-2026t2-impacto-social-por-edad': `${BASE}/queries/ISTAC/C00086A_000032.json`,
  'ecosoc-2026t2-impacto-medioambiental-por-edad': `${BASE}/queries/ISTAC/C00086A_000036.json`,
  'ecosoc-2026t2-dependencia-por-edad': `${BASE}/datasets/ISTAC/C00086A_000490/~latest.json`,
  'ecosoc-2026t2-tasa-turistica-por-edad': `${BASE}/datasets/ISTAC/C00086A_000502/~latest.json`,
  'ecosoc-2026t2-vivienda-vacacional-por-edad': `${BASE}/datasets/ISTAC/C00086A_000516/~latest.json`,
};

const destino = path.join(import.meta.dirname, 'crudo', new Date().toISOString().slice(0, 10));
await mkdir(destino, { recursive: true });

for (const [nombre, url] of Object.entries(FUENTES)) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(String(r.status));
    await writeFile(path.join(destino, `${nombre}.json`), await r.text());
    console.log(`✓ ${nombre}`);
  } catch (e) {
    console.error(`✗ ${nombre}: ${e.message}`);
    process.exitCode = 1;
  }
}
console.log(`Guardado en ${path.relative(process.cwd(), destino)}`);
