#!/usr/bin/env node
/**
 * Migración única desde el WordPress de macaronesico.com.
 *
 *  - Descarga la imagen destacada de cada artículo y la enlaza en su ficha.
 *  - Importa las páginas fijas (aviso legal, privacidad, cookies) como MDX.
 *  - Descarga el favicon.
 *
 * Es idempotente: si algo ya existe, no lo toca. Se ejecuta sola en GitHub
 * Actions (.github/workflows/migrar-wordpress.yml) o a mano:
 *   npm run migracion:wordpress
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGEN = process.env.WP_ORIGEN ?? 'https://macaronesico.com';
const RAIZ = path.resolve(import.meta.dirname, '../..');
const informe = [];

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'macaronesico-migracion' } });
  if (!r.ok) throw new Error(`${r.status} al pedir ${url}`);
  return r.json();
}

async function descargar(url, destino) {
  if (existsSync(destino)) return false;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} al descargar ${url}`);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, Buffer.from(await r.arrayBuffer()));
  return true;
}

const entidades = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»' };
function decodificar(t) {
  return t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => entidades[n.toLowerCase()] ?? m);
}

/** Conversor HTML → Markdown suficiente para páginas de texto de WordPress */
function aMarkdown(html) {
  const seguro = (t) => t.replace(/[{}]/g, (c) => `\\${c}`).replace(/<(?=[a-zA-Z/])/g, '&lt;');
  let md = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/\r/g, '')
    .replace(/<br\s*\/?>/gi, '\\\n')
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, texto) => {
      const url = href.startsWith(ORIGEN) ? href.slice(ORIGEN.length) || '/' : href;
      return `[${texto}](${url})`;
    })
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${'#'.repeat(Math.max(2, Number(n)))} ${t.trim()}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${t.replace(/<\/?p[^>]*>/gi, '').trim()}`)
    .replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n\n')
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) =>
      `\n\n${t.replace(/<\/?p[^>]*>/gi, '\n').trim().split('\n').map((l) => `> ${l}`).join('\n')}\n\n`,
    )
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<\/?[a-z][^>]*>/gi, '');
  md = decodificar(md)
    .split('\n')
    .map((l) => seguro(l).replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return md + '\n';
}

function yamlTexto(t) {
  return JSON.stringify(t ?? '');
}

async function portadas() {
  const posts = await json(`${ORIGEN}/wp-json/wp/v2/posts?per_page=100&_embed=wp:featuredmedia`);
  for (const post of posts) {
    const mdx = path.join(RAIZ, 'src/content/articulos/es', post.slug, 'index.mdx');
    if (!existsSync(mdx)) {
      informe.push(`· Sin MDX para "${post.slug}": no se enlaza su portada.`);
      continue;
    }
    const medio = post._embedded?.['wp:featuredmedia']?.[0];
    if (!medio?.source_url) {
      informe.push(`· "${post.slug}" no tiene imagen destacada.`);
      continue;
    }
    const ext = path.extname(new URL(medio.source_url).pathname).toLowerCase() || '.jpg';
    const relativa = `../../../../assets/articulos/es/${post.slug}/portada${ext}`;
    const destino = path.join(RAIZ, 'src/assets/articulos/es', post.slug, `portada${ext}`);
    const nueva = await descargar(medio.source_url, destino);

    let texto = await readFile(mdx, 'utf8');
    if (!/^portada:/m.test(texto)) {
      const alt = decodificar(medio.alt_text || medio.title?.rendered || '');
      texto = texto.replace(/^(categoria: .*)$/m, `$1\nportada: ${relativa}\nportadaAlt: ${yamlTexto(alt)}`);
      await writeFile(mdx, texto);
    }
    informe.push(`· Portada de "${post.slug}": ${nueva ? 'descargada' : 'ya existía'}.`);
  }
}

async function paginas() {
  const lista = await json(`${ORIGEN}/wp-json/wp/v2/pages?per_page=100`);
  for (const p of lista) {
    const destino = path.join(RAIZ, 'src/content/paginas', p.slug, 'index.mdx');
    if (existsSync(destino)) {
      informe.push(`· Página "${p.slug}" ya existía.`);
      continue;
    }
    const titulo = decodificar(p.title.rendered);
    const cuerpo = aMarkdown(p.content.rendered);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, `---\ntitulo: ${yamlTexto(titulo)}\ndescripcion: ''\n---\n\n${cuerpo}`);
    informe.push(`· Página "${p.slug}" importada. Revísala: puede mencionar WordPress o cookies que ya no existen.`);
  }
}

async function iconos() {
  const nuevo = await descargar(
    `${ORIGEN}/wp-content/uploads/2026/01/macaronesico-favicon-m-190.png`,
    path.join(RAIZ, 'public/favicon-wordpress.png'),
  ).catch((e) => {
    informe.push(`· No se pudo descargar el favicon: ${e.message}`);
    return false;
  });
  if (nuevo) informe.push('· Favicon original guardado en public/favicon-wordpress.png');
}

for (const [nombre, paso] of [
  ['portadas', portadas],
  ['páginas', paginas],
  ['iconos', iconos],
]) {
  try {
    await paso();
  } catch (e) {
    informe.push(`✗ Error en ${nombre}: ${e.message}`);
    process.exitCode = 1;
  }
}

console.log(`Migración desde ${ORIGEN}\n${informe.join('\n')}`);
