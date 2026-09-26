# macaronesico

Revista de análisis crítico y pensamiento decolonial desde Canarias, la
Macaronesia y otros márgenes del sistema: [macaronesico.com](https://macaronesico.com).

Este repositorio es la revista entera: textos, datos, biblioteca, diseño y
código. Se publica como sitio estático con [Astro](https://astro.build) en
Cloudflare Pages, y se edita desde un gestor web
([Keystatic](https://keystatic.com)) que guarda cada cambio aquí.

- **Poner en marcha la web y el dominio:** [docs/puesta-en-marcha.md](docs/puesta-en-marcha.md)
- **Escribir y publicar:** [docs/guia-editorial.md](docs/guia-editorial.md)

## Estructura

```
src/content/
  articulos/es/{slug}/index.mdx   artículos (pt/ y en/ para traducciones)
  datos/*.yaml                    conjuntos de datos (CSV + fuente + método)
  biblioteca/*.yaml               referencias científicas
  autoria/  temas/  paginas/
src/assets/articulos/             portadas e imágenes de los artículos
src/components/bloques/           bloques insertables en los artículos
src/components/portable/          su versión en HTML limpio (RSS y republicación)
src/pages/                        rutas del sitio
scripts/
  migracion/                      importación única desde WordPress
  biblioteca/                     alta por DOI (Crossref) e importación de listados
  istac/                          descarga de los datos originales del ISTAC
keystatic.config.ts               modelo de contenido del gestor
```

## Rutas principales

| Ruta | Contenido |
|---|---|
| `/{sección}/{slug}/` | Artículo (mismas URL que en WordPress) |
| `/{sección}/{slug}/republicar/` | HTML listo para republicar |
| `/{sección}/` | Portada de sección |
| `/tema/{tema}/` · `/autoria/{persona}/` | Archivo por tema y por autoría |
| `/biblioteca/` · `/biblioteca/{clave}/` | Biblioteca con buscador y fichas |
| `/biblioteca/biblioteca.bib` · `.json` | Exportación BibTeX y CSL-JSON |
| `/datos/` · `/datos/{id}/` · `/datos/{id}.csv` | Datos abiertos |
| `/feed.xml` · `/{sección}/feed.xml` | RSS con texto completo |
| `/keystatic` (o `/admin`) | Gestor |

## Trabajar en local (opcional)

Requiere Node 22.

```sh
npm install
npm run dev          # http://127.0.0.1:4321 y el gestor en /keystatic
npm run build        # compila en dist/
```

En local el gestor edita los archivos del disco. Con
`PUBLIC_KEYSTATIC_MODO=github` en `.env` edita GitHub como en producción.

## Scripts

```sh
npm run biblioteca:doi -- 10.1016/j.annals.2020.102898     # alta por DOI
npm run biblioteca:importar -- listado.csv                  # importa todos los DOI de un archivo
npm run istac:descargar                                      # guarda los datos originales del ISTAC
npm run migracion:wordpress                                  # portadas y páginas desde WordPress
```

## Licencias

Los textos se publican con la licencia Creative Commons indicada en cada
artículo (por defecto CC BY-SA 4.0). Los datos del ISTAC, con su licencia
original. El código, MIT.
