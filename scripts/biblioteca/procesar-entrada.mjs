#!/usr/bin/env node
/**
 * Procesa los listados de scripts/biblioteca/entrada/*.txt y da de alta las
 * referencias en la Biblioteca. Lo ejecuta GitHub Actions al subir un listado
 * (.github/workflows/biblioteca.yml), o a mano:
 *
 *   node scripts/biblioteca/procesar-entrada.mjs
 *
 * Una referencia por línea, con un prefijo que dice cómo encontrarla:
 *
 *   doi: 10.15304/ohm.34.10016
 *   titulo: Firms' takeover in War Times: The incorporation of the Tenerife...
 *   isbn: 9788416404124
 *   buscar: texto libre (un resumen, autor y año…): solo propone candidatos
 *
 * Opcionalmente, tras barras: | territorios: tenerife, canarias | temas: historia
 * y, para "titulo:", datos conocidos: | autor: Apellidos, Nombre | url: … | tipo: libro
 * Las líneas que empiezan por # son comentarios.
 *
 * "titulo:" solo toma los datos de Crossref si devuelve un título casi idéntico
 * (similitud ≥ 0,85, o ≥ 0,92 si el apellido no coincide). Si no hay
 * coincidencia y la línea trae autor o url, crea una ficha PROVISIONAL con esos
 * datos (verificada: false) para completar en el gestor; si no, la deja en el
 * informe para revisar. Cada listado procesado se mueve a entrada/procesadas/ y
 * su informe queda en informes/.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  RAIZ,
  buscarCrossref,
  consultarCrossref,
  consultarISBN,
  doisPresentes,
  guardarFicha,
  limpiarDOI,
  normalizar,
  similitud,
} from './crossref.mjs';

const DIR = import.meta.dirname;
const ENTRADA = path.join(DIR, 'entrada');
const PROCESADAS = path.join(ENTRADA, 'procesadas');
const INFORMES = path.join(DIR, 'informes');
const UMBRAL = 0.85;
const espera = () => new Promise((r) => setTimeout(r, 250));

const temasValidos = new Set(
  (await readdir(path.join(RAIZ, 'src/content/temas')).catch(() => []))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, '')),
);

function leerLinea(linea) {
  const [principal, ...opciones] = linea.split('|').map((s) => s.trim());
  const m = principal.match(/^(doi|titulo|título|isbn|buscar)\s*:\s*(.+)$/i);
  if (!m) return null;
  const extra = {};
  for (const o of opciones) {
    const i = o.indexOf(':');
    if (i < 1) continue;
    const clave = o.slice(0, i).trim().toLowerCase();
    const valor = o.slice(i + 1).trim();
    if (!valor) continue;
    extra[clave] = ['territorios', 'temas'].includes(clave) ? valor.split(',').map((s) => s.trim()).filter(Boolean) : valor;
  }
  return { modo: m[1].toLowerCase().replace('título', 'titulo'), valor: m[2].trim(), extra };
}

function aplicarExtras(ficha, extra, avisos) {
  if (extra.territorios?.length) ficha.territorios = extra.territorios;
  if (extra.temas?.length) {
    const desconocidos = extra.temas.filter((t) => !temasValidos.has(t));
    if (desconocidos.length) avisos.push(`temas desconocidos ignorados: ${desconocidos.join(', ')}`);
    ficha.temas = extra.temas.filter((t) => temasValidos.has(t));
  }
  return ficha;
}

const tablaCandidatos = (cs) =>
  cs.length
    ? [
        '| Similitud | Título | Autoría | Año | Revista | DOI |',
        '|---|---|---|---|---|---|',
        ...cs.map(
          (c) =>
            `| ${c.sim?.toFixed(2) ?? '–'} | ${c.titulo.replace(/\|/g, '/')} | ${c.autores.replace(/\|/g, '/')} | ${c.anio} | ${c.revista.replace(/\|/g, '/')} | \`${c.doi}\` |`,
        ),
      ].join('\n')
    : '_Sin candidatos._';

async function procesar(archivo) {
  const lineas = (await readFile(path.join(ENTRADA, archivo), 'utf8'))
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const presentes = await doisPresentes();
  const altas = [];
  const yaEstaban = [];
  const revisar = [];
  const provisionales = [];
  const errores = [];

  for (const linea of lineas) {
    const e = leerLinea(linea);
    if (!e) {
      errores.push(`Línea sin prefijo reconocible: ${linea}`);
      continue;
    }
    const avisos = [];
    try {
      if (e.modo === 'doi') {
        const doi = limpiarDOI(e.valor);
        if (!doi) throw new Error(`no parece un DOI: ${e.valor}`);
        const ficha = aplicarExtras(await consultarCrossref(doi), e.extra, avisos);
        const clave = await guardarFicha(ficha, presentes);
        (clave ? altas : yaEstaban).push({ clave, titulo: ficha.titulo, origen: `DOI ${doi}`, avisos });
      } else if (e.modo === 'isbn') {
        const ficha = aplicarExtras(await consultarISBN(e.valor), e.extra, avisos);
        const clave = await guardarFicha(ficha, presentes);
        (clave ? altas : yaEstaban).push({ clave, titulo: ficha.titulo, origen: `ISBN ${e.valor}`, avisos });
      } else {
        const candidatos = (await buscarCrossref(e.valor, 5)).map((c) => ({ ...c, sim: similitud(e.valor, c.titulo) }));
        candidatos.sort((a, b) => b.sim - a.sim);
        const apellido = normalizar((e.extra.autor ?? '').split(',')[0]).split(' ')[0];
        const coincideAutor = (c) => !apellido || normalizar(c.autores).includes(apellido);
        const mejor = candidatos.find((c) => (c.sim >= UMBRAL && coincideAutor(c)) || c.sim >= 0.92);
        if (e.modo === 'titulo' && mejor) {
          const ficha = aplicarExtras(await consultarCrossref(mejor.doi), e.extra, avisos);
          const clave = await guardarFicha(ficha, presentes);
          (clave ? altas : yaEstaban).push({
            clave,
            titulo: ficha.titulo,
            origen: `título (similitud ${mejor.sim.toFixed(2)}, DOI ${mejor.doi})`,
            avisos,
          });
        } else if (e.modo === 'titulo' && (e.extra.autor || e.extra.url)) {
          const ficha = aplicarExtras(
            {
              titulo: e.valor,
              autores: e.extra.autor ? e.extra.autor.split(';').map((a) => a.trim()) : [],
              anio: Number(e.extra.anio) || null,
              tipo: e.extra.tipo ?? 'articulo',
              revista: e.extra.revista ?? '',
              url: e.extra.url ?? '',
              idioma: e.extra.idioma ?? 'es',
              acceso: 'desconocido',
              verificada: false,
            },
            e.extra,
            avisos,
          );
          const clave = await guardarFicha(ficha, presentes);
          if (clave) provisionales.push({ clave, titulo: ficha.titulo, candidatos: candidatos.slice(0, 2) });
          else yaEstaban.push({ clave, titulo: ficha.titulo, origen: 'título ya presente', avisos });
        } else {
          revisar.push({ consulta: e.valor, modo: e.modo, candidatos: candidatos.slice(0, 3) });
        }
      }
    } catch (err) {
      errores.push(`${e.modo}: ${e.valor} → ${err.message}`);
    }
    await espera();
  }

  const informe = [
    `# Informe de importación: ${archivo}`,
    '',
    `Procesado el ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.`,
    `Altas verificadas: ${altas.length} · Provisionales: ${provisionales.length} · Ya estaban: ${yaEstaban.length} · Para revisar: ${revisar.length} · Errores: ${errores.length}`,
    '',
    '## Altas',
    '',
    ...(altas.length
      ? altas.map((a) => `- \`${a.clave}\` · ${a.titulo} _(${a.origen})_${a.avisos.length ? ` · ${a.avisos.join('; ')}` : ''}`)
      : ['_Ninguna._']),
    '',
    '## Fichas provisionales',
    '',
    'Creadas con los datos del listado (sin año ni revista). Completa y marca «verificada» en el gestor. Se muestran los candidatos más cercanos de Crossref por si alguno es el bueno.',
    '',
    ...(provisionales.length
      ? provisionales.flatMap((p) => [
          `- \`${p.clave}\` · ${p.titulo}`,
          ...p.candidatos.map((c) => `  - ¿${c.titulo} (${c.autores}, ${c.anio}) → \`${c.doi}\` · similitud ${c.sim.toFixed(2)}?`),
        ])
      : ['_Ninguna._']),
    '',
    '## Ya estaban en la Biblioteca',
    '',
    ...(yaEstaban.length ? yaEstaban.map((a) => `- ${a.titulo} _(${a.origen})_`) : ['_Ninguna._']),
    '',
    '## Para revisar',
    '',
    'Sin coincidencia segura. Si uno de los candidatos es el correcto, añade su DOI a un nuevo listado con `doi:`.',
    '',
    ...revisar.flatMap((r) => [`### ${r.modo}: ${r.consulta.slice(0, 160)}`, '', tablaCandidatos(r.candidatos), '']),
    '## Errores',
    '',
    ...(errores.length ? errores.map((x) => `- ${x}`) : ['_Ninguno._']),
    '',
  ].join('\n');

  await mkdir(INFORMES, { recursive: true });
  await mkdir(PROCESADAS, { recursive: true });
  const base = archivo.replace(/\.txt$/, '');
  await writeFile(path.join(INFORMES, `${base}.md`), informe);
  await rename(path.join(ENTRADA, archivo), path.join(PROCESADAS, archivo));
  console.log(informe);
}

if (!existsSync(ENTRADA)) {
  console.log('No hay carpeta de entrada.');
  process.exit(0);
}
const pendientes = (await readdir(ENTRADA)).filter((f) => f.endsWith('.txt'));
if (!pendientes.length) console.log('No hay listados pendientes.');
for (const archivo of pendientes) await procesar(archivo);
