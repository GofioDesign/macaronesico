// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

const categorias = ['canarias', 'costa-norafricana', 'macaronesia', 'internacional', 'taller', 'editorial'];

export default defineConfig({
  site: 'https://macaronesico.com',

  // El sitio es estático. Solo el gestor (/keystatic y /api/keystatic) se ejecuta
  // en el servidor, en Cloudflare, para poder autenticarse con GitHub.
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
  }),

  integrations: [
    react(),
    mdx(),
    keystatic(),
    sitemap({
      filter: (pagina) => !pagina.includes('/keystatic') && !pagina.includes('/republicar/'),
    }),
  ],

  // Rutas antiguas de WordPress y atajos
  redirects: {
    '/admin': '/keystatic',
    '/feed': '/feed.xml',
    '/macaronesia/macaronesico': '/editorial/macaronesico/',
    // «Cómo no ser parte de la maquinaria extractivista (I)» pasó de Canarias a Taller y se rehízo como «Retrato de la máquina extractivista»
    '/canarias/como-no-ser-parte-de-la-maquinaria-extractivista-01': '/taller/retrato-de-la-maquina-extractivista/',
    '/taller/como-no-ser-parte-de-la-maquinaria-extractivista-01': '/taller/retrato-de-la-maquina-extractivista/',
    ...Object.fromEntries(categorias.map((c) => [`/${c}/feed`, `/${c}/feed.xml`])),
  },

  vite: {
    resolve: {
      // React 19 en Cloudflare Workers necesita la versión "edge" del renderizador
      // (afecta solo a las rutas del gestor).
      // @ts-ignore
      alias: import.meta.env.PROD ? { 'react-dom/server': 'react-dom/server.edge' } : {},
    },
  },
});
