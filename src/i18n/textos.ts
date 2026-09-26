import type { Idioma } from '../lib/sitio';

/** Textos de la interfaz. Añade aquí las traducciones cuando se active un idioma. */
export const TEXTOS = {
  es: {
    inicio: 'Inicio',
    biblioteca: 'Biblioteca',
    datos: 'Datos',
    saltar: 'Saltar al contenido',
    leer: 'Leer',
    minutos: 'min de lectura',
    por: 'Por',
    actualizado: 'Actualizado el',
    temas: 'Temas',
    bibliografia: 'Bibliografía',
    republicar: 'Republica este artículo',
    licenciaTexto: 'Este artículo se publica bajo licencia',
    otrosIdiomas: 'Leer en',
    borrador: 'Borrador: no visible en producción',
    masEn: 'Más en',
    serie: 'Serie',
  },
  pt: {
    inicio: 'Início',
    biblioteca: 'Biblioteca',
    datos: 'Dados',
    saltar: 'Saltar para o conteúdo',
    leer: 'Ler',
    minutos: 'min de leitura',
    por: 'Por',
    actualizado: 'Atualizado em',
    temas: 'Temas',
    bibliografia: 'Bibliografia',
    republicar: 'Republique este artigo',
    licenciaTexto: 'Este artigo é publicado sob a licença',
    otrosIdiomas: 'Ler em',
    borrador: 'Rascunho: não visível em produção',
    masEn: 'Mais em',
    serie: 'Série',
  },
  en: {
    inicio: 'Home',
    biblioteca: 'Library',
    datos: 'Data',
    saltar: 'Skip to content',
    leer: 'Read',
    minutos: 'min read',
    por: 'By',
    actualizado: 'Updated',
    temas: 'Topics',
    bibliografia: 'References',
    republicar: 'Republish this article',
    licenciaTexto: 'This article is published under a',
    otrosIdiomas: 'Read in',
    borrador: 'Draft: not visible in production',
    masEn: 'More in',
    serie: 'Series',
  },
} satisfies Record<Idioma, Record<string, string>>;

export function t(idioma: Idioma) {
  return TEXTOS[idioma];
}
