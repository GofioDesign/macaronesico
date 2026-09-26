import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const getStaticPaths = (async () => {
  const conjuntos = await getCollection('datos');
  return conjuntos.map((c) => ({ params: { id: c.id }, props: { csv: c.data.csv } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response('﻿' + String(props.csv).trim() + '\n', {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  });
