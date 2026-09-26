export const SITIO = {
  nombre: 'macaronesico',
  lema: 'Entender las islas para decidir sobre ellas',
  descripcion:
    'Revista de análisis sobre Canarias y la Macaronesia: derechos, sostenibilidad y humanidad contados con datos, contexto y una mirada creativa.',
  url: 'https://macaronesico.com',
  idioma: 'es',
  repositorio: 'https://github.com/GofioDesign/macaronesico',
};

export const CATEGORIAS = {
  canarias: {
    nombre: 'Canarias',
    descripcion: 'Territorio, turismo, vivienda, memoria y poder en el archipiélago canario.',
  },
  'costa-norafricana': {
    nombre: 'Costa norafricana',
    descripcion: 'La orilla vecina: Sáhara Occidental, Marruecos, Mauritania y las relaciones atlánticas.',
  },
  macaronesia: {
    nombre: 'Macaronesia',
    descripcion: 'Canarias, Madeira, Azores, Salvajes y Cabo Verde: pensar desde el conjunto de archipiélagos.',
  },
  internacional: {
    nombre: 'Internacional',
    descripcion: 'El orden global leído desde los márgenes: geopolítica, extractivismo y derecho internacional.',
  },
} as const;

export type Categoria = keyof typeof CATEGORIAS;

export const LICENCIAS = {
  'cc-by-sa': {
    nombre: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
    republicable: true,
  },
  'cc-by-nc-nd': {
    nombre: 'CC BY-NC-ND 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es',
    republicable: true,
  },
  reservados: {
    nombre: 'Todos los derechos reservados',
    url: '',
    republicable: false,
  },
} as const;

export const IDIOMAS = {
  es: { nombre: 'Español', locale: 'es-ES', prefijo: '' },
  pt: { nombre: 'Português', locale: 'pt-PT', prefijo: '/pt' },
  en: { nombre: 'English', locale: 'en-GB', prefijo: '/en' },
} as const;

export type Idioma = keyof typeof IDIOMAS;
