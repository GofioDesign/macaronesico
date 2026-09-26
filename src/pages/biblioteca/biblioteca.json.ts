import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { aCSL } from '../../lib/biblioteca';

export const GET: APIRoute = async () => {
  const refs = await getCollection('biblioteca');
  return new Response(JSON.stringify(refs.map(aCSL), null, 2), {
    headers: { 'Content-Type': 'application/vnd.citationstyles.csl+json; charset=utf-8' },
  });
};
