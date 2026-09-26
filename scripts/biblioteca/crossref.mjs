/**
 * Utilidades compartidas: consulta a Crossref (gratuita, sin clave) y
 * escritura de fichas YAML de la Biblioteca en el formato de Keystatic.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const RAIZ = path.resolve(import.meta.dirname, '../..');
export const DIR_BIBLIOTECA = path.join(RAIZ, 'src/content/biblioteca');

// Crossref pide identificarse para usar su "polite pool"
const CONTACTO = process.env.CROSSREF_EMAIL ?? 'hola@macaronesico.com';

const PALABRAS_VACIAS = new Set(
  'a al and de del el en for la las los of on the to un una y e o u the an in con por para sobre from'.split(' '),
);

export function limpiarDOI(texto) {
  const m = String(texto).match(/10\.\d{4,9}\/[^\s"'<>]+/i);
  return m ? m[0].replace(/[.,;)\]]+$/, '') : null;
}

export function slug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function claveDe({ autores, anio, titulo }) {
  const apellido = slug((autores[0] ?? 'anonimo').split(',')[0]).split('-')[0] || 'anonimo';
  const palabra =
    slug(titulo)
      .split('-')
      .find((p) => p.length > 3 && !PALABRAS_VACIAS.has(p)) ?? 'obra';
  return `${apellido}-${anio}-${palabra}`;
}

const TIPOS = {
  'journal-article': 'articulo',
  book: 'libro',
  monograph: 'libro',
  'edited-book': 'libro',
  'book-chapter': 'capitulo',
  'book-part': 'capitulo',
  dissertation: 'tesis',
  report: 'informe',
  dataset: 'datos',
};

export async function consultarCrossref(doi) {
  const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': `macaronesico-biblioteca (mailto:${CONTACTO})` },
  });
  if (r.status === 404) throw new Error(`DOI no encontrado en Crossref: ${doi}`);
  if (!r.ok) throw new Error(`Crossref respondió ${r.status} para ${doi}`);
  const { message: m } = await r.json();

  const fecha = m.issued?.['date-parts']?.[0] ?? m.published?.['date-parts']?.[0] ?? [];
  const idioma = (m.language ?? '').slice(0, 2);
  const licencia = (m.license ?? []).map((l) => l.URL).join(' ');
  return {
    titulo: (m.title?.[0] ?? '').replace(/\s+/g, ' ').trim(),
    autores: (m.author ?? []).map((a) => (a.family ? `${a.family}, ${a.given ?? ''}`.trim().replace(/,$/, '') : a.name ?? '')),
    anio: Number(fecha[0]) || new Date().getFullYear(),
    tipo: TIPOS[m.type] ?? 'otro',
    revista: m['container-title']?.[0] ?? '',
    volumen: m.volume ?? '',
    numero: m.issue ?? '',
    paginas: m.page ?? '',
    editorial: m.publisher ?? '',
    doi: m.DOI ?? doi,
    url: m.URL ?? `https://doi.org/${doi}`,
    idioma: ['es', 'pt', 'en', 'fr'].includes(idioma) ? idioma : 'otro',
    acceso: /creativecommons/i.test(licencia) ? 'abierto' : 'desconocido',
  };
}

const q = (v) => JSON.stringify(v ?? '');

export function aYAML(ficha) {
  const lista = (xs) => (xs?.length ? `\n${xs.map((x) => `  - ${q(x)}`).join('\n')}` : ' []');
  return [
    `titulo: ${q(ficha.titulo)}`,
    `autores:${lista(ficha.autores)}`,
    `anio: ${ficha.anio}`,
    `tipo: ${ficha.tipo}`,
    `revista: ${q(ficha.revista)}`,
    `volumen: ${q(ficha.volumen)}`,
    `numero: ${q(ficha.numero)}`,
    `paginas: ${q(ficha.paginas)}`,
    `editorial: ${q(ficha.editorial)}`,
    `doi: ${q(ficha.doi)}`,
    `url: ${q(ficha.url)}`,
    `idioma: ${ficha.idioma}`,
    `acceso: ${ficha.acceso}`,
    `pdf: ${q(ficha.pdf)}`,
    `territorios:${lista(ficha.territorios ?? ['canarias'])}`,
    `temas:${lista(ficha.temas ?? [])}`,
    `resumen: ${q(ficha.resumen)}`,
    `importancia: ${q(ficha.importancia)}`,
    `estado: ${ficha.estado ?? 'pendiente'}`,
    '',
  ].join('\n');
}

/** Guarda la ficha; si la clave existe, añade un sufijo. Devuelve la clave usada o null si el DOI ya estaba. */
export async function guardarFicha(ficha, doisExistentes = new Set()) {
  if (ficha.doi && doisExistentes.has(ficha.doi.toLowerCase())) return null;
  await mkdir(DIR_BIBLIOTECA, { recursive: true });
  let clave = claveDe(ficha);
  for (let i = 2; existsSync(path.join(DIR_BIBLIOTECA, `${clave}.yaml`)); i++) clave = `${claveDe(ficha)}-${i}`;
  await writeFile(path.join(DIR_BIBLIOTECA, `${clave}.yaml`), aYAML(ficha));
  if (ficha.doi) doisExistentes.add(ficha.doi.toLowerCase());
  return clave;
}

/** DOIs ya presentes en la Biblioteca, para no duplicar */
export async function doisPresentes() {
  const { readdir, readFile } = await import('node:fs/promises');
  const presentes = new Set();
  if (!existsSync(DIR_BIBLIOTECA)) return presentes;
  for (const f of await readdir(DIR_BIBLIOTECA)) {
    if (!f.endsWith('.yaml')) continue;
    const m = (await readFile(path.join(DIR_BIBLIOTECA, f), 'utf8')).match(/^doi:\s*"?([^"\n]+)"?/m);
    if (m && m[1].trim()) presentes.add(m[1].trim().toLowerCase());
  }
  return presentes;
}
