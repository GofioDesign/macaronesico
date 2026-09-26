import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Id "es/mi-articulo" a partir de "es/mi-articulo/index.mdx" */
const idDeCarpeta = ({ entry }: { entry: string }) => entry.replace(/\/index\.mdx?$/, '');

const texto = z.string().nullish().transform((v) => v ?? '');
const lista = z.array(z.string()).nullish().transform((v) => (v ?? []).filter(Boolean));

const articulos = defineCollection({
  loader: glob({ pattern: '*/*/index.mdx', base: './src/content/articulos', generateId: idDeCarpeta }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      entradilla: texto,
      descripcion: texto,
      fecha: z.coerce.date(),
      actualizado: z.coerce.date().nullish(),
      categoria: z.enum(['canarias', 'costa-norafricana', 'macaronesia', 'internacional']),
      temas: lista,
      autoria: lista,
      portada: image().nullish(),
      portadaAlt: texto,
      estado: z.enum(['borrador', 'publicado']).default('borrador'),
      destacado: z.boolean().nullish().transform((v) => !!v),
      serie: texto,
      licencia: z.enum(['cc-by-sa', 'cc-by-nc-nd', 'reservados']).default('cc-by-sa'),
      referencias: lista,
      traduccionDe: z.string().nullish(),
    }),
});

const paginas = defineCollection({
  loader: glob({ pattern: '*/index.mdx', base: './src/content/paginas', generateId: idDeCarpeta }),
  schema: z.object({
    titulo: z.string(),
    descripcion: texto,
  }),
});

const datos = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/datos' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: texto,
    fuente: texto,
    url: texto,
    fecha: z.coerce.date().nullish(),
    licencia: texto,
    notas: texto,
    dimensiones: texto,
    csv: z.string(),
  }),
});

const biblioteca = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/biblioteca' }),
  schema: z.object({
    titulo: z.string(),
    autores: lista,
    anio: z.number().int().nullish(),
    tipo: z.enum(['articulo', 'libro', 'capitulo', 'tesis', 'informe', 'datos', 'otro']).default('articulo'),
    revista: texto,
    volumen: texto,
    numero: texto,
    paginas: texto,
    editorial: texto,
    doi: texto,
    url: texto,
    idioma: z.string().default('es'),
    acceso: z.enum(['abierto', 'cerrado', 'desconocido']).default('desconocido'),
    pdf: texto,
    territorios: lista,
    temas: lista,
    resumen: texto,
    importancia: texto,
    estado: z.enum(['pendiente', 'leida', 'resenada', 'usada']).default('pendiente'),
    verificada: z.boolean().nullish().transform((v) => v !== false),
  }),
});

const autoria = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/autoria' }),
  schema: z.object({ nombre: z.string(), bio: texto, web: texto }),
});

const temas = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/temas' }),
  schema: z.object({ nombre: z.string(), descripcion: texto }),
});

export const collections = { articulos, paginas, datos, biblioteca, autoria, temas };
