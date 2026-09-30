globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BWUI_cjF.mjs';
import { manifest } from './manifest_CBo374hR.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/api/keystatic/_---params_.astro.mjs');
const _page3 = () => import('./pages/autoria/_autor_.astro.mjs');
const _page4 = () => import('./pages/biblioteca/biblioteca.bib.astro.mjs');
const _page5 = () => import('./pages/biblioteca/biblioteca.json.astro.mjs');
const _page6 = () => import('./pages/biblioteca/_clave_.astro.mjs');
const _page7 = () => import('./pages/biblioteca.astro.mjs');
const _page8 = () => import('./pages/datos/_id_.csv.astro.mjs');
const _page9 = () => import('./pages/datos/_id_.astro.mjs');
const _page10 = () => import('./pages/datos.astro.mjs');
const _page11 = () => import('./pages/en/_seccion_/_slug_.astro.mjs');
const _page12 = () => import('./pages/explorador/_id_.astro.mjs');
const _page13 = () => import('./pages/feed.xml.astro.mjs');
const _page14 = () => import('./pages/keystatic/_---params_.astro.mjs');
const _page15 = () => import('./pages/pt/_seccion_/_slug_.astro.mjs');
const _page16 = () => import('./pages/robots.txt.astro.mjs');
const _page17 = () => import('./pages/tema/_tema_.astro.mjs');
const _page18 = () => import('./pages/_seccion_/feed.xml.astro.mjs');
const _page19 = () => import('./pages/_seccion_/_slug_/republicar.astro.mjs');
const _page20 = () => import('./pages/_seccion_/_slug_.astro.mjs');
const _page21 = () => import('./pages/_seccion_.astro.mjs');
const _page22 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/404.astro", _page1],
    ["node_modules/@keystatic/astro/internal/keystatic-api.js", _page2],
    ["src/pages/autoria/[autor]/index.astro", _page3],
    ["src/pages/biblioteca/biblioteca.bib.ts", _page4],
    ["src/pages/biblioteca/biblioteca.json.ts", _page5],
    ["src/pages/biblioteca/[clave]/index.astro", _page6],
    ["src/pages/biblioteca/index.astro", _page7],
    ["src/pages/datos/[id].csv.ts", _page8],
    ["src/pages/datos/[id]/index.astro", _page9],
    ["src/pages/datos/index.astro", _page10],
    ["src/pages/en/[seccion]/[slug]/index.astro", _page11],
    ["src/pages/explorador/[id].astro", _page12],
    ["src/pages/feed.xml.ts", _page13],
    ["node_modules/@keystatic/astro/internal/keystatic-astro-page.astro", _page14],
    ["src/pages/pt/[seccion]/[slug]/index.astro", _page15],
    ["src/pages/robots.txt.ts", _page16],
    ["src/pages/tema/[tema]/index.astro", _page17],
    ["src/pages/[seccion]/feed.xml.ts", _page18],
    ["src/pages/[seccion]/[slug]/republicar.astro", _page19],
    ["src/pages/[seccion]/[slug]/index.astro", _page20],
    ["src/pages/[seccion]/index.astro", _page21],
    ["src/pages/index.astro", _page22]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
