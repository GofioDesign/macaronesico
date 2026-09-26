# macaronesico: notas para trabajar en este repositorio

- Revista en español (Canarias). Todo el código, nombres, comentarios y
  mensajes de commit en español.
- Astro 5 estático + adaptador de Cloudflare solo para el gestor Keystatic
  (`/keystatic`, `/api/keystatic`). No añadir rutas de servidor sin necesidad.
- El modelo de contenido vive en DOS sitios que deben coincidir:
  `keystatic.config.ts` (gestor) y `src/content.config.ts` (esquema de Astro).
  Los bloques MDX también: `keystatic.config.ts` → `bloques`,
  `src/components/bloques/index.ts` y `src/components/portable/index.ts`.
- Artículos: `src/content/articulos/{idioma}/{slug}/index.mdx`. El id de Astro
  es `{idioma}/{slug}`. URL: `/{categoria}/{slug}/` (español sin prefijo).
- Los bloques de datos leen de `src/content/datos/*.yaml` (campo `csv`,
  decimales con punto). Nunca pegar números de tablas dentro del MDX.
- Estados: `borrador` solo se ve en dev y ramas distintas de `main`
  (`CF_PAGES_BRANCH`).
- Sin tipografías ni scripts externos: coste cero y rendimiento.
- Colores de gráficos: `--serie-1` / `--serie-2` validados para daltonismo en
  claro y oscuro. No añadir series sin validar la paleta.
- Comprobar siempre con `npm run build` antes de subir.
