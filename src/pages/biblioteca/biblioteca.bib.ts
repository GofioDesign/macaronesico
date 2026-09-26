import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { aBibtex } from '../../lib/biblioteca';

export const GET: APIRoute = async () => {
  const refs = await getCollection('biblioteca');
  return new Response(refs.map(aBibtex).join('\n\n') + '\n', {
    headers: { 'Content-Type': 'application/x-bibtex; charset=utf-8' },
  });
};
