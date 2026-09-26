#!/usr/bin/env node
/**
 * Recalcula, a partir de los microdatos públicos del ISTAC, las tablas del
 * artículo «La fractura generacional que esconde la encuesta del turismo»
 * (ECOSOC, segundo trimestre de 2026, módulo de percepción del turismo).
 *
 *   node scripts/istac/ecosoc-2026t2-turismo.mjs           comprueba y escribe
 *   node scripts/istac/ecosoc-2026t2-turismo.mjs --prueba  solo comprueba
 *
 * Microdatos: scripts/istac/microdatos/ecosoc-2026t2/ (tal como los publica el
 * ISTAC: fichero de datos y diseño de registros con los códigos).
 *
 * Método (el mismo que usa el ISTAC en sus tablas):
 *  - «De acuerdo» = respuestas 4 («De acuerdo») y 5 («Muy de acuerdo»).
 *  - Tasa turística (P223): respuesta 1 («Sí»). Vivienda vacacional (P230):
 *    respuesta 1 («Debería ser más estricta»).
 *  - Cada entrevista cuenta con su peso oficial (variable «peso»).
 *  - El denominador son todas las entrevistas del grupo, también las que no
 *    saben o no contestan.
 * Antes de escribir nada, el script comprueba que así se reproducen las cifras
 * publicadas por el ISTAC. Si alguna no coincide, se detiene.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const MICRODATOS = path.join(import.meta.dirname, 'microdatos/ecosoc-2026t2/ECOSOC_DATA31_PUB_MOD.txt');
const DATOS = path.join(RAIZ, 'src/content/datos');
const soloPrueba = process.argv.includes('--prueba');

// Preguntas: variable, respuestas que cuentan y texto corto.
const ACUERDO = ['4', '5'];
const PREGUNTAS = [
  ['P50A', ACUERDO, 'General', 'Ha sido muy beneficioso para la isla'],
  ['P50B', ACUERDO, 'General', 'Se debe seguir potenciando'],
  ['P50C', ACUERDO, 'General', 'Sus beneficios superan a sus costes'],
  ['P217A', ACUERDO, 'Económico', 'Contribuye al desarrollo económico'],
  ['P217B', ACUERDO, 'Económico', 'Atrae inversiones necesarias'],
  ['P217C', ACUERDO, 'Económico', 'Genera empleo precario'],
  ['P217D', ACUERDO, 'Económico', 'Encarece la vivienda'],
  ['P217E', ACUERDO, 'Económico', 'Contribuye al consumo de productos locales'],
  ['P217F', ACUERDO, 'Económico', 'Encarece el coste de la vida'],
  ['P218A', ACUERDO, 'Social', 'Aumenta la calidad de vida'],
  ['P218B', ACUERDO, 'Social', 'Provoca cambios de residencia no deseados'],
  ['P218C', ACUERDO, 'Social', 'Mejora los servicios de mi comarca'],
  ['P218D', ACUERDO, 'Social', 'Colapsa los servicios sanitarios'],
  ['P218E', ACUERDO, 'Social', 'Provoca tensiones entre residentes y turistas'],
  ['P218F', ACUERDO, 'Social', 'Crea una sociedad más tolerante'],
  ['P218G', ACUERDO, 'Social', 'Mejora las infraestructuras'],
  ['P218H', ACUERDO, 'Social', 'Mejora la imagen de mi municipio'],
  ['P219A', ACUERDO, 'Cultural', 'Ayuda a mantener la identidad y la cultura'],
  ['P219B', ACUERDO, 'Cultural', 'Ayuda a conservar los monumentos'],
  ['P219C', ACUERDO, 'Cultural', 'Aumenta la oferta cultural y festiva'],
  ['P219D', ACUERDO, 'Cultural', 'Favorece el intercambio entre culturas'],
  ['P219E', ACUERDO, 'Cultural', 'Permite relacionarse con gente de otros lugares'],
  ['P220A', ACUERDO, 'Medioambiental', 'Perjudica el tráfico y la movilidad'],
  ['P220B', ACUERDO, 'Medioambiental', 'Causa daños irreparables a los ecosistemas'],
  ['P220C', ACUERDO, 'Medioambiental', 'Consume agua, energía o suelo de los residentes'],
  ['P220D', ACUERDO, 'Medioambiental', 'Genera demasiados residuos y contaminación'],
  ['P220E', ACUERDO, 'Medioambiental', 'Tiene prácticas sostenibles'],
  ['P220F', ACUERDO, 'Medioambiental', 'Ayuda a conservar los espacios naturales'],
  ['P223', ['1'], 'Medidas', 'Los turistas deben pagar una tasa'],
  ['P230', ['1'], 'Medidas', 'Regulación de la vivienda vacacional más estricta'],
];

// Grupos (con los códigos del diseño de registros).
const EDAD = (r) => (r.edad <= 34 ? '18-34' : r.edad <= 54 ? '35-54' : '55 y más');
const SEXO = (r) => ({ 1: 'Hombre', 6: 'Mujer' })[r.P1];
const NACIMIENTO = (r) => (r.P3 === 1 ? 'Canarias' : 'Fuera de Canarias');
const NACIMIENTO3 = (r) => ({ 1: 'Canarias', 2: 'Otra comunidad', 3: 'Otro país' })[r.P3];
// Ingreso disponible del hogar al mes (ing_hog): 1 hasta 500 €; 2 500-1.000;
// 3 1.000-1.500; 4 a 7, más de 1.500; -9 no consta.
const INGRESOS = (r) =>
  ({ 1: 'Hasta 500 €', 2: 'De 500 a 1.000 €', 3: 'De 1.000 a 1.500 €' })[r.ing_hog] ??
  (r.ing_hog >= 4 ? 'Más de 1.500 €' : 'No consta');

// --- Lectura ---------------------------------------------------------------
const [cabecera, ...lineas] = (await readFile(MICRODATOS, 'latin1')).split(/\r?\n/).filter(Boolean);
const nombres = cabecera.split(';');
const filas = lineas.map((l) => {
  const v = l.split(';');
  const r = Object.fromEntries(nombres.map((n, i) => [n, v[i]]));
  for (const k of ['edad', 'P1', 'P3', 'ing_hog']) r[k] = Number(r[k]);
  r.peso = Number(r.peso);
  return r;
});

/** % ponderado de quienes dan una de las respuestas «si» en la variable. */
function porcentaje(grupo, variable, si) {
  let total = 0;
  let favor = 0;
  for (const r of grupo) {
    total += r.peso;
    if (si.includes(r[variable])) favor += r.peso;
  }
  return total ? (100 * favor) / total : NaN;
}
const redondeo = (x, d = 1) => Number(x.toFixed(d));

// --- Comprobación con las cifras publicadas por el ISTAC --------------------
const edad = (min, max) => filas.filter((r) => r.edad >= min && r.edad <= max);
const PUBLICADAS = [
  ['Total, muy beneficioso (P50A)', filas, 'P50A', ACUERDO, 67.9],
  ['Total, tasa turística (P223)', filas, 'P223', ['1'], 49.7],
  ['Total, vivienda vacacional (P230)', filas, 'P230', ['1'], 51.7],
  ['18-34, muy beneficioso', edad(18, 34), 'P50A', ACUERDO, 58.7],
  ['55 y más, muy beneficioso', edad(55, 200), 'P50A', ACUERDO, 73.5],
  ['18-34, tensiones (P218E)', edad(18, 34), 'P218E', ACUERDO, 58.8],
  ['35-54, tensiones', edad(35, 54), 'P218E', ACUERDO, 47.0],
  ['55 y más, tensiones', edad(55, 200), 'P218E', ACUERDO, 31.3],
  ['18-34, encarece la vivienda (P217D)', edad(18, 34), 'P217D', ACUERDO, 83.5],
  ['18-34, calidad de vida (P218A)', edad(18, 34), 'P218A', ACUERDO, 27.2],
  ['55 y más, calidad de vida', edad(55, 200), 'P218A', ACUERDO, 50.9],
  ['18-34, tasa turística', edad(18, 34), 'P223', ['1'], 58.0],
];
let fallos = 0;
console.log(`Microdatos: ${filas.length} entrevistas\n\nComprobación con las cifras del ISTAC:`);
for (const [nombre, grupo, variable, si, esperado] of PUBLICADAS) {
  const obtenido = redondeo(porcentaje(grupo, variable, si));
  const ok = obtenido === esperado;
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${nombre}: ${obtenido} (publicado ${esperado})`);
}
if (fallos) {
  console.error(`\n${fallos} cifras no coinciden. No se escribe nada.`);
  process.exit(1);
}

// --- Tablas ----------------------------------------------------------------
const csvCampo = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const csv = (columnas, filasTabla) =>
  [columnas, ...filasTabla].map((f) => f.map(csvCampo).join(',')).join('\n') + '\n';
const pregunta = (variable) => PREGUNTAS.find((p) => p[0] === variable);

function tablaPorGrupos(variables, grupos) {
  const columnas = ['Afirmación', ...grupos.map(([nombre]) => nombre)];
  const filasTabla = variables.map((v) => {
    const [, si, , texto] = pregunta(v);
    return [texto, ...grupos.map(([, g]) => porcentaje(g, v, si).toFixed(1))];
  });
  return csv(columnas, filasTabla);
}

// 1. Por lugar de nacimiento (tres grupos).
const porOrigen = tablaPorGrupos(
  ['P50A', 'P50B', 'P218A', 'P217D', 'P217F', 'P220D', 'P230'],
  [
    ['Nacidos en Canarias', filas.filter((r) => NACIMIENTO3(r) === 'Canarias')],
    ['Nacidos en otra comunidad', filas.filter((r) => NACIMIENTO3(r) === 'Otra comunidad')],
    ['Nacidos en otro país', filas.filter((r) => NACIMIENTO3(r) === 'Otro país')],
  ],
);

// 2. Edad y lugar de nacimiento.
const cruce = (e, n) => filas.filter((r) => EDAD(r) === e && NACIMIENTO(r) === n);
const edadYOrigen = tablaPorGrupos(
  ['P50A', 'P50B', 'P50C', 'P217A', 'P218A', 'P219A', 'P218B', 'P220B', 'P220F', 'P218E', 'P217D', 'P223', 'P230'],
  [
    ['18-34, nacidos en Canarias', cruce('18-34', 'Canarias')],
    ['18-34, nacidos fuera', cruce('18-34', 'Fuera de Canarias')],
    ['55 y más, nacidos en Canarias', cruce('55 y más', 'Canarias')],
    ['55 y más, nacidos fuera', cruce('55 y más', 'Fuera de Canarias')],
  ],
);

// 3. Explorador: una fila por combinación de edad, ingresos, sexo y
//    nacimiento, con el número de entrevistas, la suma de pesos y el % de
//    acuerdo con cada pregunta. Sumando filas (ponderadas por el peso) se
//    obtiene cualquier grupo más amplio, también el total.
const DIMENSIONES = [
  ['Edad', EDAD, ['18-34', '35-54', '55 y más']],
  ['Ingresos del hogar', INGRESOS, ['Hasta 500 €', 'De 500 a 1.000 €', 'De 1.000 a 1.500 €', 'Más de 1.500 €', 'No consta']],
  ['Sexo', SEXO, ['Mujer', 'Hombre']],
  ['Nacimiento', NACIMIENTO, ['Canarias', 'Fuera de Canarias']],
];
const celdas = new Map();
for (const r of filas) {
  const clave = DIMENSIONES.map(([, f]) => f(r)).join('|');
  if (!celdas.has(clave)) celdas.set(clave, []);
  celdas.get(clave).push(r);
}
const orden = (clave) =>
  clave.split('|').reduce((acc, v, i) => acc * 10 + DIMENSIONES[i][2].indexOf(v), 0);
const claves = [...celdas.keys()].sort((a, b) => orden(a) - orden(b));
const explorador = csv(
  [...DIMENSIONES.map(([n]) => n), 'Entrevistas', 'Peso', ...PREGUNTAS.map(([, , bloque, texto]) => `${bloque} · ${texto}`)],
  claves.map((clave) => {
    const g = celdas.get(clave);
    const peso = g.reduce((s, r) => s + r.peso, 0);
    return [...clave.split('|'), g.length, redondeo(peso, 2), ...PREGUNTAS.map(([v, si]) => redondeo(porcentaje(g, v, si), 2))];
  }),
);

// Comprobación: el explorador reproduce el total al sumar todas las celdas.
{
  const [col, ...resto] = explorador.trim().split('\n').map((l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '')));
  const iPeso = col.indexOf('Peso');
  const i = col.indexOf('General · Ha sido muy beneficioso para la isla');
  const tot = resto.reduce((s, f) => s + Number(f[iPeso]), 0);
  const val = resto.reduce((s, f) => s + Number(f[iPeso]) * Number(f[i]), 0) / tot;
  console.log(`  ${redondeo(val) === 67.9 ? '✓' : '✗'} Explorador, total muy beneficioso: ${redondeo(val)} (publicado 67.9)`);
}

console.log(`\nEntrevistas por grupo:`);
for (const [n, f] of [
  ['Nacidos en Canarias', (r) => NACIMIENTO3(r) === 'Canarias'],
  ['Otra comunidad', (r) => NACIMIENTO3(r) === 'Otra comunidad'],
  ['Otro país', (r) => NACIMIENTO3(r) === 'Otro país'],
  ['18-34 Canarias', (r) => EDAD(r) === '18-34' && NACIMIENTO(r) === 'Canarias'],
  ['18-34 fuera', (r) => EDAD(r) === '18-34' && NACIMIENTO(r) !== 'Canarias'],
  ['55+ Canarias', (r) => EDAD(r) === '55 y más' && NACIMIENTO(r) === 'Canarias'],
  ['55+ fuera', (r) => EDAD(r) === '55 y más' && NACIMIENTO(r) !== 'Canarias'],
])
  console.log(`  ${n}: ${filas.filter(f).length}`);
console.log(`  Combinaciones del explorador: ${claves.length}`);

if (soloPrueba) process.exit(0);

/** Sustituye el bloque «csv: |» de un conjunto de datos. */
async function escribirCSV(id, texto) {
  const archivo = path.join(DATOS, `${id}.yaml`);
  const yaml = await readFile(archivo, 'utf8');
  const i = yaml.indexOf('csv: |');
  if (i < 0) throw new Error(`${id}: no tiene campo csv`);
  const bloque = texto.trimEnd().split('\n').map((l) => `  ${l}`).join('\n');
  await writeFile(archivo, `${yaml.slice(0, i)}csv: |\n${bloque}\n`);
  console.log(`✓ ${path.relative(RAIZ, archivo)}`);
}
await escribirCSV('ecosoc-2026t2-turismo-por-origen', porOrigen);
await escribirCSV('ecosoc-2026t2-turismo-edad-y-origen', edadYOrigen);
await escribirCSV('ecosoc-2026t2-turismo-explorador', explorador);
