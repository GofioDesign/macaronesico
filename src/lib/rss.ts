import rss from '@astrojs/rss';
import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer as rendererMDX } from '@astrojs/mdx';
import { loadRenderers } from 'astro:container';
import { bloquesPortables } from '../components/portable';
import { urlArticulo, type Articulo } from './contenido';
import { CATEGORIAS, LICENCIAS, SITIO } from './sitio';

let contenedor: AstroContainer | undefined;

async function html(articulo: Articulo): Promise<string> {
  contenedor ??= await AstroContainer.create({ renderers: await loadRenderers([rendererMDX()]) });
  const { Content } = await render(articulo);
  const cuerpo = await contenedor.renderToString(Content, { props: { components: bloquesPortables } });
  const original = new URL(urlArticulo(articulo), SITIO.url).href;
  const licencia = LICENCIAS[articulo.data.licencia];
  const atribucion = licencia.url
    ? `<p><em>Publicado originalmente en <a href="${original}">${SITIO.nombre}</a> con licencia <a href="${licencia.url}">${licencia.nombre}</a>.</em></p>`
    : `<p><em>Publicado originalmente en <a href="${original}">${SITIO.nombre}</a>.</em></p>`;
  return (
    atribucion +
    cuerpo
      // Rutas relativas → absolutas, para lectores de RSS y republicación
      .replace(/(src|href)="\/(?!\/)/g, `$1="${SITIO.url}/`)
      .replace(/\sdata-astro-[\w-]+(="[^"]*")?/g, '')
  );
}

export async function feed(opciones: { titulo: string; descripcion: string; articulos: Articulo[]; ruta: string }) {
  const items = await Promise.all(
    opciones.articulos.slice(0, 50).map(async (a) => ({
      title: a.data.titulo,
      link: urlArticulo(a),
      pubDate: a.data.fecha,
      description: a.data.entradilla || a.data.descripcion,
      categories: [CATEGORIAS[a.data.categoria].nombre, ...a.data.temas],
      content: await html(a),
    })),
  );
  return rss({
    title: opciones.titulo,
    description: opciones.descripcion,
    site: SITIO.url,
    items,
    customData: `<language>es</language><copyright>Salvo indicación, CC BY-SA 4.0 · ${SITIO.nombre}</copyright>`,
    stylesheet: false,
    trailingSlash: true,
  });
}
