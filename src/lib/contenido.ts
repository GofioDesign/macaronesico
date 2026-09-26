import { getCollection, type CollectionEntry } from 'astro:content';
import { IDIOMAS, type Idioma } from './sitio';

export type Articulo = CollectionEntry<'articulos'>;

/**
 * Los borradores se ven en desarrollo y en las vistas previas de Cloudflare
 * (cualquier rama que no sea main), nunca en producción.
 */
const rama = typeof process !== 'undefined' ? process.env.CF_PAGES_BRANCH : undefined;
export const MOSTRAR_BORRADORES = import.meta.env.DEV || (!!rama && rama !== 'main');

export function idiomaDe(a: Articulo): Idioma {
  return a.id.split('/')[0] as Idioma;
}

export function slugDe(a: Articulo): string {
  return a.id.split('/').slice(1).join('/');
}

export function urlArticulo(a: Articulo): string {
  return `${IDIOMAS[idiomaDe(a)].prefijo}/${a.data.categoria}/${slugDe(a)}/`;
}

export async function obtenerArticulos(idioma: Idioma = 'es'): Promise<Articulo[]> {
  const todos = await getCollection(
    'articulos',
    (a) => idiomaDe(a) === idioma && (MOSTRAR_BORRADORES || a.data.estado === 'publicado'),
  );
  return todos.sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());
}

/** Traducciones de un artículo (incluido él mismo), para hreflang y selector de idioma */
export async function traduccionesDe(a: Articulo): Promise<Articulo[]> {
  const todos = await getCollection(
    'articulos',
    (x) => MOSTRAR_BORRADORES || x.data.estado === 'publicado',
  );
  const original = idiomaDe(a) === 'es' ? slugDe(a) : a.data.traduccionDe;
  if (!original) return [a];
  return todos.filter(
    (x) => (idiomaDe(x) === 'es' && slugDe(x) === original) || x.data.traduccionDe === original,
  );
}

export function formatoFecha(fecha: Date, idioma: Idioma = 'es'): string {
  return new Intl.DateTimeFormat(IDIOMAS[idioma].locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Atlantic/Canary',
  }).format(fecha);
}

export function isoFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Minutos de lectura aproximados a partir del cuerpo MDX */
export function minutosLectura(cuerpo: string | undefined): number {
  const palabras = (cuerpo ?? '')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 220));
}
