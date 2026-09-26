import type { CollectionEntry } from 'astro:content';

export type Referencia = CollectionEntry<'biblioteca'>;

function apellido(autor: string): string {
  return autor.split(',')[0].trim();
}

function iniciales(autor: string): string {
  const [, nombre = ''] = autor.split(',');
  return nombre
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((p) => `${p[0]}.`)
    .join(' ');
}

/** (García, 2021) · (García y Pérez, 2021) · (García et al., 2021) */
export function citaCorta(r: Referencia, paginas?: string): string {
  const a = r.data.autores;
  let quien = 'Anónimo';
  if (a.length === 1) quien = apellido(a[0]);
  else if (a.length === 2) quien = `${apellido(a[0])} y ${apellido(a[1])}`;
  else if (a.length > 2) quien = `${apellido(a[0])} et al.`;
  return `${quien}, ${r.data.anio}${paginas ? `, p. ${paginas}` : ''}`;
}

function autoresAPA(a: string[]): string {
  const f = a.map((x) => {
    const i = iniciales(x);
    return i ? `${apellido(x)}, ${i}` : apellido(x);
  });
  if (f.length === 0) return '';
  if (f.length === 1) return f[0];
  if (f.length <= 20) return `${f.slice(0, -1).join(', ')} y ${f[f.length - 1]}`;
  return `${f.slice(0, 19).join(', ')}, … ${f[f.length - 1]}`;
}

/** Referencia en estilo APA 7 (texto plano con marcas para cursiva) */
export function referenciaAPA(r: Referencia): { antes: string; cursiva: string; despues: string; enlace: string } {
  const d = r.data;
  const autores = autoresAPA(d.autores);
  const enlace = d.doi ? `https://doi.org/${d.doi}` : d.url;
  const cabeza = `${autores ? `${autores} ` : ''}(${d.anio}). `;

  if (d.tipo === 'articulo') {
    const vol = d.volumen ? `, ${d.volumen}` : '';
    const num = d.numero ? `(${d.numero})` : '';
    const pags = d.paginas ? `, ${d.paginas}` : '';
    return { antes: `${cabeza}${d.titulo}. `, cursiva: `${d.revista}${vol}`, despues: `${num}${pags}.`, enlace };
  }
  if (d.tipo === 'capitulo') {
    const pags = d.paginas ? ` (pp. ${d.paginas})` : '';
    const ed = d.editorial ? ` ${d.editorial}.` : '';
    return { antes: `${cabeza}${d.titulo}. En `, cursiva: d.revista, despues: `${pags}.${ed}`, enlace };
  }
  const ed = d.editorial ? ` ${d.editorial}.` : '';
  return { antes: cabeza, cursiva: d.titulo, despues: `.${ed}`, enlace };
}

export function referenciaTexto(r: Referencia): string {
  const x = referenciaAPA(r);
  return `${x.antes}${x.cursiva}${x.despues}${x.enlace ? ` ${x.enlace}` : ''}`;
}

/** Exportación BibTeX */
export function aBibtex(r: Referencia): string {
  const d = r.data;
  const tipo =
    { articulo: 'article', libro: 'book', capitulo: 'incollection', tesis: 'phdthesis', informe: 'techreport', datos: 'misc', otro: 'misc' }[
      d.tipo
    ] ?? 'misc';
  const campos: [string, string][] = [
    ['title', d.titulo],
    ['author', d.autores.join(' and ')],
    ['year', String(d.anio)],
    [d.tipo === 'articulo' ? 'journal' : 'booktitle', d.tipo === 'articulo' || d.tipo === 'capitulo' ? d.revista : ''],
    ['volume', d.volumen],
    ['number', d.numero],
    ['pages', d.paginas],
    ['publisher', d.editorial],
    ['doi', d.doi],
    ['url', d.url],
    ['language', d.idioma],
  ];
  const cuerpo = campos
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k} = {${v.replace(/[{}]/g, '')}}`)
    .join(',\n');
  return `@${tipo}{${r.id},\n${cuerpo}\n}`;
}

/** Exportación CSL-JSON (Zotero, Mendeley, pandoc…) */
export function aCSL(r: Referencia) {
  const d = r.data;
  const type =
    { articulo: 'article-journal', libro: 'book', capitulo: 'chapter', tesis: 'thesis', informe: 'report', datos: 'dataset', otro: 'document' }[
      d.tipo
    ] ?? 'document';
  return {
    id: r.id,
    type,
    title: d.titulo,
    author: d.autores.map((a) => {
      const [family, given = ''] = a.split(',').map((s) => s.trim());
      return given ? { family, given } : { literal: family };
    }),
    issued: { 'date-parts': [[d.anio]] },
    'container-title': d.revista || undefined,
    volume: d.volumen || undefined,
    issue: d.numero || undefined,
    page: d.paginas || undefined,
    publisher: d.editorial || undefined,
    DOI: d.doi || undefined,
    URL: d.url || undefined,
    language: d.idioma,
  };
}

export const NOMBRES_TERRITORIO: Record<string, string> = {
  canarias: 'Canarias',
  'el-hierro': 'El Hierro',
  'la-palma': 'La Palma',
  'la-gomera': 'La Gomera',
  tenerife: 'Tenerife',
  'gran-canaria': 'Gran Canaria',
  fuerteventura: 'Fuerteventura',
  lanzarote: 'Lanzarote',
  'la-graciosa': 'La Graciosa',
  madeira: 'Madeira',
  azores: 'Azores',
  salvajes: 'Islas Salvajes',
  'cabo-verde': 'Cabo Verde',
  macaronesia: 'Macaronesia',
  'costa-africana': 'Costa africana',
  otros: 'Atlántico / otros',
};

export const NOMBRES_TIPO: Record<string, string> = {
  articulo: 'Artículo',
  libro: 'Libro',
  capitulo: 'Capítulo',
  tesis: 'Tesis',
  informe: 'Informe',
  datos: 'Datos',
  otro: 'Otro',
};
