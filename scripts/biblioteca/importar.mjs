#!/usr/bin/env node
/**
 * Importa a la Biblioteca un listado de artículos científicos.
 *
 *   npm run biblioteca:importar -- listado.csv
 *   npm run biblioteca:importar -- mi-biblioteca.bib
 *   npm run biblioteca:importar -- dois.txt
 *
 * Acepta cualquier archivo de texto (CSV, BibTeX, RIS, exportación de Zotero,
 * una lista pegada…): busca todos los DOI que contenga y los da de alta vía
 * Crossref. Las líneas sin DOI se listan al final en
 * scripts/biblioteca/sin-doi.txt para darlas de alta a mano en el gestor.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { consultarCrossref, doisPresentes, guardarFicha, limpiarDOI } from './crossref.mjs';

const archivo = process.argv[2];
if (!archivo) {
  console.log('Uso: npm run biblioteca:importar -- <archivo>');
  process.exit(1);
}

const texto = await readFile(archivo, 'utf8');
const esBibtex = /@\w+\s*\{/.test(texto);
const bloques = esBibtex ? texto.split(/(?=@\w+\s*\{)/) : texto.split(/\r?\n/);

const dois = new Set();
const sinDoi = [];
for (const b of bloques) {
  if (!b.trim()) continue;
  const doi = limpiarDOI(b);
  if (doi) dois.add(doi);
  else if (b.trim().length > 10) sinDoi.push(b.trim().replace(/\s+/g, ' ').slice(0, 300));
}

console.log(`${dois.size} DOI encontrados, ${sinDoi.length} entradas sin DOI.`);
const presentes = await doisPresentes();
let altas = 0;
for (const doi of dois) {
  try {
    const clave = await guardarFicha(await consultarCrossref(doi), presentes);
    if (clave) {
      altas++;
      console.log(`✓ ${clave}`);
    } else console.log(`· Ya estaba: ${doi}`);
  } catch (e) {
    console.error(`✗ ${doi}: ${e.message}`);
    sinDoi.push(`[DOI no resuelto] ${doi}`);
  }
  await new Promise((r) => setTimeout(r, 200));
}

if (sinDoi.length) {
  const destino = path.join(import.meta.dirname, 'sin-doi.txt');
  await writeFile(destino, sinDoi.join('\n') + '\n');
  console.log(`Entradas sin DOI guardadas en ${path.relative(process.cwd(), destino)}`);
}
console.log(`Altas nuevas: ${altas}`);
