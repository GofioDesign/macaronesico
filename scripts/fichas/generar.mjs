/**
 * Genera los PDF de las fichas de los talleres a partir de su HTML.
 * Uso: node scripts/fichas/generar.mjs
 * Necesita Chromium o Chrome instalado (se puede indicar con la variable CHROMIUM).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const carpeta = dirname(fileURLToPath(import.meta.url));
const salida = resolve(carpeta, '../../public/fichas');
const navegador = process.env.CHROMIUM ?? 'chromium';

mkdirSync(salida, { recursive: true });

for (const archivo of readdirSync(carpeta).filter((a) => a.endsWith('.html'))) {
  const pdf = join(salida, archivo.replace(/\.html$/, '.pdf'));
  execFileSync(navegador, [
    '--headless',
    '--no-sandbox',
    '--no-pdf-header-footer',
    `--print-to-pdf=${pdf}`,
    pathToFileURL(join(carpeta, archivo)).href,
  ]);
  console.log(`PDF generado: ${pdf}`);
}
