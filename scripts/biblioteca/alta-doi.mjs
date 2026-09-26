#!/usr/bin/env node
/**
 * Da de alta referencias en la Biblioteca a partir de su DOI.
 *
 *   npm run biblioteca:doi -- 10.1016/j.annals.2020.102898 10.3390/su12104123
 *   npm run biblioteca:doi -- --territorio tenerife --tema turismo 10.xxxx/yyyy
 *
 * Crea una ficha YAML por referencia en src/content/biblioteca/, con estado
 * "pendiente" para completar el resumen propio desde el gestor.
 */
import { consultarCrossref, doisPresentes, guardarFicha, limpiarDOI } from './crossref.mjs';

const args = process.argv.slice(2);
const territorios = [];
const temas = [];
const dois = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--territorio') territorios.push(args[++i]);
  else if (args[i] === '--tema') temas.push(args[++i]);
  else {
    const doi = limpiarDOI(args[i]);
    if (doi) dois.push(doi);
    else console.warn(`No parece un DOI: ${args[i]}`);
  }
}

if (!dois.length) {
  console.log('Uso: npm run biblioteca:doi -- [--territorio canarias] [--tema turismo] <DOI> [<DOI>…]');
  process.exit(1);
}

const presentes = await doisPresentes();
for (const doi of dois) {
  try {
    const ficha = await consultarCrossref(doi);
    if (territorios.length) ficha.territorios = territorios;
    if (temas.length) ficha.temas = temas;
    const clave = await guardarFicha(ficha, presentes);
    console.log(clave ? `✓ ${clave}  ${ficha.titulo}` : `· Ya estaba: ${doi}`);
  } catch (e) {
    console.error(`✗ ${doi}: ${e.message}`);
    process.exitCode = 1;
  }
  await new Promise((r) => setTimeout(r, 200));
}
