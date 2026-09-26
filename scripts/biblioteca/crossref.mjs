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

const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'da', 'do', 'dos', 'das', 'van', 'von', 'y']);

/** "José de Viera y Clavijo" → "Viera y Clavijo, José de" */
export function invertirNombre(nombre) {
  const t = String(nombre).trim().split(/\s+/);
  if (t.length < 2) return nombre;
  const i = t.findIndex((p, k) => k > 0 && k < t.length - 1 && PARTICULAS.has(p.toLowerCase()));
  if (i > 0 && t[i].toLowerCase() !== 'y') return `${t.slice(i + 1).join(' ')}, ${t.slice(0, i + 1).join(' ')}`;
  return `${t.slice(1).join(' ')}, ${t[0]}`;
}

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
  const apellido =
    slug((autores[0] ?? 'anonimo').split(',')[0])
      .split('-')
      .find((p) => p && !PARTICULAS.has(p)) || 'anonimo';
  const palabra =
    slug(titulo)
      .split('-')
      .find((p) => p.length > 3 && !PALABRAS_VACIAS.has(p)) ?? 'obra';
  return `${apellido}-${anio || 'sf'}-${palabra}`;
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

const INSTITUCION = /universi|instituto|facultad|departamento|consejo superior|\(espa[ñn]a\)/i;
const ROMANOS = /^(?:[ivxlcdm]+)$/i;
const PROPIOS = new Set(
  'canarias canaria canarios canarias, tenerife gran lanzarote fuerteventura gomera palma hierro graciosa arona orotava anaga macaronesia madeira azores cabo verde áfrica africa españa castilla portugal guinea sierra leona santa cruz laguna qanāriya túnez hornachos juba zurara gomes eanes'.split(' '),
);

/** Títulos en MAYÚSCULAS → tipo oración, respetando topónimos y números romanos */
export function arreglarMayusculas(t) {
  const letras = t.replace(/[^\p{L}]/gu, '');
  const mayus = letras.replace(/[^\p{Lu}]/gu, '');
  if (!letras || mayus.length / letras.length < 0.6) return t;
  let inicio = true;
  return t
    .split(/(\s+)/)
    .map((p) => {
      if (/^\s+$/.test(p)) return p;
      const limpio = p.replace(/[^\p{L}]/gu, '').toLowerCase();
      let r = p.toLowerCase();
      if (ROMANOS.test(limpio) && limpio.length <= 5 && !['di', 'mi', 'vi', 'mil', 'dc'].includes(limpio)) r = p.toUpperCase();
      else if (inicio || PROPIOS.has(limpio)) r = r.replace(/\p{L}/u, (c) => c.toUpperCase());
      inicio = /[.:?!]["»”)]?$/.test(p);
      return r;
    })
    .join('');
}

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
    titulo: arreglarMayusculas(
      (m.title?.[0] ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim(),
    ),
    autores: (m.author ?? [])
      .map((a) => (a.family ? `${a.family}, ${a.given ?? ''}`.trim().replace(/,$/, '') : a.name ?? ''))
      .filter((a) => a && !INSTITUCION.test(a))
      .filter((a, i, xs) => xs.indexOf(a) === i),
    anio: Number(fecha[0]) || null,
    tipo: TIPOS[m.type] ?? 'otro',
    revista: arreglarMayusculas((m['container-title']?.[0] ?? '').replace(/\s+n[úu]mero\s+\d+\s*$/i, '')),
    volumen: m.volume ?? '',
    numero: m.issue ?? (m['container-title']?.[0] ?? '').match(/n[úu]mero\s+(\d+)\s*$/i)?.[1] ?? '',
    paginas: m.page ?? '',
    editorial: m.publisher ?? '',
    doi: m.DOI ?? doi,
    url: m.URL ?? `https://doi.org/${doi}`,
    idioma: ['es', 'pt', 'en', 'fr'].includes(idioma) ? idioma : 'otro',
    acceso: /creativecommons/i.test(licencia) ? 'abierto' : 'desconocido',
  };
}

/** Normaliza un título para compararlo: sin tildes, signos ni mayúsculas */
export function normalizar(t) {
  return String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Similitud de Dice sobre bigramas de caracteres (0 a 1) */
export function similitud(a, b) {
  const x = normalizar(a);
  const y = normalizar(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigramas = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const bx = bigramas(x);
  const by = bigramas(y);
  let comunes = 0;
  for (const [g, n] of bx) comunes += Math.min(n, by.get(g) ?? 0);
  return (2 * comunes) / (x.length - 1 + (y.length - 1));
}

/** Búsqueda bibliográfica en Crossref: devuelve candidatos con su DOI */
export async function buscarCrossref(consulta, filas = 5) {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', consulta);
  url.searchParams.set('rows', String(filas));
  url.searchParams.set('select', 'DOI,title,author,issued,container-title,type,score');
  const r = await fetch(url, { headers: { 'User-Agent': `macaronesico-biblioteca (mailto:${CONTACTO})` } });
  if (!r.ok) throw new Error(`Crossref respondió ${r.status}`);
  const { message } = await r.json();
  return (message.items ?? []).map((m) => ({
    doi: m.DOI,
    titulo: (m.title?.[0] ?? '').replace(/\s+/g, ' ').trim(),
    autores: (m.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(' ') || a.name).join('; '),
    anio: m.issued?.['date-parts']?.[0]?.[0] ?? '',
    revista: m['container-title']?.[0] ?? '',
    puntuacion: m.score,
  }));
}

/** Libro por ISBN: Google Books y, si no, Open Library */
export async function consultarISBN(isbn) {
  const limpio = String(isbn).replace(/[^0-9Xx]/g, '');
  const g = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${limpio}`).then((r) => (r.ok ? r.json() : {}));
  const v = g.items?.[0]?.volumeInfo;
  if (v) {
    return {
      titulo: [v.title, v.subtitle].filter(Boolean).join(': '),
      autores: (v.authors ?? []).map(invertirNombre),
      anio: Number(String(v.publishedDate ?? '').slice(0, 4)) || null,
      tipo: 'libro',
      editorial: v.publisher ?? '',
      url: v.infoLink ?? '',
      idioma: ['es', 'pt', 'en', 'fr'].includes(v.language) ? v.language : 'otro',
      acceso: 'desconocido',
      isbn: limpio,
    };
  }
  const o = await fetch(`https://openlibrary.org/isbn/${limpio}.json`).then((r) => (r.ok ? r.json() : null));
  if (!o) throw new Error(`ISBN no encontrado: ${limpio}`);
  const autores = [];
  for (const a of o.authors ?? []) {
    const d = await fetch(`https://openlibrary.org${a.key}.json`).then((r) => (r.ok ? r.json() : null));
    if (d?.name) autores.push(invertirNombre(d.name));
  }
  return {
    titulo: [o.title, o.subtitle].filter(Boolean).join(': '),
    autores,
    anio: Number(String(o.publish_date ?? '').match(/\d{4}/)?.[0]) || null,
    tipo: 'libro',
    editorial: o.publishers?.[0] ?? '',
    url: `https://openlibrary.org/isbn/${limpio}`,
    idioma: 'es',
    acceso: 'desconocido',
    isbn: limpio,
  };
}

const q = (v) => JSON.stringify(v ?? '');

export function aYAML(ficha) {
  const lista = (xs) => (xs?.length ? `\n${xs.map((x) => `  - ${q(x)}`).join('\n')}` : ' []');
  return [
    `titulo: ${q(ficha.titulo)}`,
    `autores:${lista(ficha.autores)}`,
    ...(ficha.anio ? [`anio: ${ficha.anio}`] : []),
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
    `verificada: ${ficha.verificada === false ? 'false' : 'true'}`,
    '',
  ].join('\n');
}

/** Guarda la ficha; si la clave existe, añade un sufijo. Devuelve la clave usada o null si el DOI ya estaba. */
export async function guardarFicha(ficha, doisExistentes = new Set()) {
  if (ficha.doi && doisExistentes.has(ficha.doi.toLowerCase())) return null;
  if (doisExistentes.has(`t:${normalizar(ficha.titulo)}`)) return null;
  await mkdir(DIR_BIBLIOTECA, { recursive: true });
  let clave = claveDe(ficha);
  for (let i = 2; existsSync(path.join(DIR_BIBLIOTECA, `${clave}.yaml`)); i++) clave = `${claveDe(ficha)}-${i}`;
  await writeFile(path.join(DIR_BIBLIOTECA, `${clave}.yaml`), aYAML(ficha));
  if (ficha.doi) doisExistentes.add(ficha.doi.toLowerCase());
  doisExistentes.add(`t:${normalizar(ficha.titulo)}`);
  return clave;
}

/** DOIs ya presentes en la Biblioteca, para no duplicar */
export async function doisPresentes() {
  const { readdir, readFile } = await import('node:fs/promises');
  const presentes = new Set();
  if (!existsSync(DIR_BIBLIOTECA)) return presentes;
  for (const f of await readdir(DIR_BIBLIOTECA)) {
    if (!f.endsWith('.yaml')) continue;
    const texto = await readFile(path.join(DIR_BIBLIOTECA, f), 'utf8');
    const m = texto.match(/^doi:\s*"?([^"\n]+)"?/m);
    if (m && m[1].trim()) presentes.add(m[1].trim().toLowerCase());
    const t = texto.match(/^titulo:\s*(.+)$/m);
    if (t) presentes.add(`t:${normalizar(t[1].replace(/^["']|["']$/g, ''))}`);
  }
  return presentes;
}
