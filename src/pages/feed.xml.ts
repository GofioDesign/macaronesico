import type { APIRoute } from 'astro';
import { obtenerArticulos } from '../lib/contenido';
import { feed } from '../lib/rss';
import { SITIO } from '../lib/sitio';

export const GET: APIRoute = async () =>
  feed({
    titulo: SITIO.nombre,
    descripcion: SITIO.descripcion,
    articulos: await obtenerArticulos('es'),
    ruta: '/feed.xml',
  });
