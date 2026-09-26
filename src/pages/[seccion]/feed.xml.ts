import type { APIRoute, GetStaticPaths } from 'astro';
import { obtenerArticulos } from '../../lib/contenido';
import { feed } from '../../lib/rss';
import { CATEGORIAS, SITIO, type Categoria } from '../../lib/sitio';

export const getStaticPaths = (() =>
  Object.keys(CATEGORIAS).map((seccion) => ({ params: { seccion } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const clave = params.seccion as Categoria;
  const articulos = (await obtenerArticulos('es')).filter((a) => a.data.categoria === clave);
  return feed({
    titulo: `${SITIO.nombre}: ${CATEGORIAS[clave].nombre}`,
    descripcion: CATEGORIAS[clave].descripcion,
    articulos,
    ruta: `/${clave}/feed.xml`,
  });
};
