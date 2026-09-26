import { collection, config, fields } from '@keystatic/core';
import { block, inline, wrapper } from '@keystatic/core/content-components';

/**
 * Gestor editorial de macaronesico.
 *
 * En producción (y en local con PUBLIC_KEYSTATIC_MODO=github) cada cambio se
 * guarda como un commit en GofioDesign/macaronesico. En local, sin esa variable,
 * edita directamente los archivos del disco.
 */
const usarGithub =
  import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_MODO === 'github';

const CATEGORIAS = [
  { label: 'Canarias', value: 'canarias' },
  { label: 'Costa norafricana', value: 'costa-norafricana' },
  { label: 'Macaronesia', value: 'macaronesia' },
  { label: 'Internacional', value: 'internacional' },
  { label: 'Editorial', value: 'editorial' },
];

const LICENCIAS = [
  { label: 'CC BY-SA 4.0 (se puede republicar y adaptar compartiendo igual)', value: 'cc-by-sa' },
  { label: 'CC BY-NC-ND 4.0 (republicar sin cambios ni uso comercial)', value: 'cc-by-nc-nd' },
  { label: 'Todos los derechos reservados (no republicable)', value: 'reservados' },
];

const TERRITORIOS = [
  { label: 'Canarias', value: 'canarias' },
  { label: 'El Hierro', value: 'el-hierro' },
  { label: 'La Palma', value: 'la-palma' },
  { label: 'La Gomera', value: 'la-gomera' },
  { label: 'Tenerife', value: 'tenerife' },
  { label: 'Gran Canaria', value: 'gran-canaria' },
  { label: 'Fuerteventura', value: 'fuerteventura' },
  { label: 'Lanzarote', value: 'lanzarote' },
  { label: 'La Graciosa', value: 'la-graciosa' },
  { label: 'Madeira', value: 'madeira' },
  { label: 'Azores', value: 'azores' },
  { label: 'Islas Salvajes', value: 'salvajes' },
  { label: 'Cabo Verde', value: 'cabo-verde' },
  { label: 'Macaronesia (conjunto)', value: 'macaronesia' },
  { label: 'Costa africana', value: 'costa-africana' },
  { label: 'Atlántico / otros', value: 'otros' },
];

/* ---------- Bloques que se pueden insertar en los artículos ---------- */

const bloques = {
  Cifra: block({
    label: 'Cifra destacada',
    description: 'Un número grande con su frase de contexto.',
    schema: {
      valor: fields.text({ label: 'Valor', description: 'Por ejemplo: 27%', validation: { isRequired: true } }),
      texto: fields.text({ label: 'Texto', multiline: true }),
      fuente: fields.text({ label: 'Fuente (opcional)' }),
    },
  }),

  TablaDatos: block({
    label: 'Tabla de datos',
    description: 'Tabla ordenable a partir de un conjunto de datos.',
    schema: {
      datos: fields.relationship({ label: 'Conjunto de datos', collection: 'datos', validation: { isRequired: true } }),
      columnas: fields.text({
        label: 'Columnas a mostrar (opcional)',
        description: 'Nombres separados por comas, tal como aparecen en la cabecera del CSV. Vacío = todas.',
      }),
      resaltar: fields.text({ label: 'Columna a resaltar (opcional)', description: 'Por ejemplo: Brecha (puntos)' }),
      orden: fields.text({
        label: 'Orden inicial (opcional)',
        description: 'Columna seguida de :asc o :desc. Por ejemplo: Brecha (puntos):desc',
      }),
      pie: fields.text({ label: 'Pie de tabla', multiline: true }),
    },
  }),

  Grafico: block({
    label: 'Gráfico',
    description: 'Gráfico de puntos o barras a partir de un conjunto de datos.',
    schema: {
      datos: fields.relationship({ label: 'Conjunto de datos', collection: 'datos', validation: { isRequired: true } }),
      tipo: fields.select({
        label: 'Tipo',
        options: [
          { label: 'Puntos enfrentados (comparar dos grupos)', value: 'puntos' },
          { label: 'Barras horizontales', value: 'barras' },
        ],
        defaultValue: 'puntos',
      }),
      titulo: fields.text({ label: 'Título del gráfico' }),
      etiqueta: fields.text({ label: 'Columna de etiquetas', description: 'Por ejemplo: Afirmación' }),
      series: fields.text({
        label: 'Columnas a representar',
        description: 'Separadas por comas. Para "puntos", exactamente dos. Por ejemplo: 18-34 años, 55 y más',
      }),
      orden: fields.text({ label: 'Orden (opcional)', description: 'Columna:asc o columna:desc' }),
      unidad: fields.text({ label: 'Unidad', defaultValue: '%' }),
      pie: fields.text({ label: 'Pie del gráfico', multiline: true }),
    },
  }),

  Examen: block({
    label: 'Aprobados y suspensos',
    description:
      'Cuadrícula: cada fila una afirmación, cada columna un grupo. La casilla se rellena si el porcentaje supera el umbral, y arriba se cuentan los aprobados.',
    schema: {
      datos: fields.relationship({ label: 'Conjunto de datos', collection: 'datos', validation: { isRequired: true } }),
      titulo: fields.text({ label: 'Título' }),
      series: fields.text({ label: 'Columnas (grupos)', description: 'Separadas por comas. Vacío: todas las numéricas.' }),
      umbral: fields.integer({ label: 'Umbral de aprobado (%)', defaultValue: 50 }),
      pie: fields.text({ label: 'Pie', multiline: true }),
    },
  }),

  Explorador: block({
    label: 'Explorador de encuesta',
    description:
      'Una fila por pregunta y un selector por rasgo (edad, sexo…): resalta el grupo elegido frente a la media y a los demás grupos. El conjunto de datos necesita las columnas Entrevistas y Peso.',
    schema: {
      datos: fields.relationship({ label: 'Conjunto de datos', collection: 'datos', validation: { isRequired: true } }),
      dimensiones: fields.text({
        label: 'Columnas de los selectores',
        description: 'Separadas por comas. Por ejemplo: Edad, Ingresos del hogar, Sexo, Nacimiento',
        validation: { length: { min: 1 } },
      }),
      titulo: fields.text({ label: 'Título' }),
      pie: fields.text({ label: 'Pie', multiline: true }),
    },
  }),

  NotaMetodologica: wrapper({
    label: 'Nota metodológica',
    description: 'Recuadro plegable con método, muestra y márgenes de error.',
    schema: {
      titulo: fields.text({ label: 'Título', defaultValue: 'Nota metodológica' }),
    },
  }),

  PasoAPaso: wrapper({
    label: 'Paso a paso',
    description: 'Recuadro plegable que explica, en una lista numerada, cómo se llegó a las cifras de una tabla o un gráfico.',
    schema: {
      titulo: fields.text({ label: 'Título', defaultValue: 'Paso a paso: cómo llegamos a estas cifras' }),
      datos: fields.relationship({ label: 'Conjunto de datos (para el enlace de descarga)', collection: 'datos' }),
    },
  }),

  Fuentes: wrapper({
    label: 'Fuentes',
    description: 'Lista de fuentes del artículo. Escribe dentro una lista con enlaces.',
    schema: {},
  }),

  Destacado: wrapper({
    label: 'Cita destacada',
    description: 'Frase destacada dentro del texto.',
    schema: {},
  }),

  Cita: inline({
    label: 'Cita bibliográfica',
    description: 'Cita una referencia de la Biblioteca: (Autoría, año).',
    schema: {
      clave: fields.relationship({ label: 'Referencia', collection: 'biblioteca', validation: { isRequired: true } }),
      paginas: fields.text({ label: 'Páginas (opcional)' }),
    },
  }),

  Pieza: block({
    label: 'Pieza a medida',
    description: 'Inserta una pieza interactiva HTML alojada en /public/piezas/.',
    schema: {
      src: fields.text({ label: 'Ruta', description: 'Por ejemplo: /piezas/mapa-vivienda/index.html', validation: { isRequired: true } }),
      titulo: fields.text({ label: 'Título accesible', validation: { isRequired: true } }),
      alto: fields.integer({ label: 'Alto en píxeles', defaultValue: 600 }),
    },
  }),
};

/* ---------- Artículos (una colección por idioma) ---------- */

function articulos(idioma: 'es' | 'pt' | 'en', etiqueta: string) {
  return collection({
    label: etiqueta,
    slugField: 'titulo',
    path: `src/content/articulos/${idioma}/*/`,
    format: { contentField: 'contenido' },
    entryLayout: 'content',
    columns: ['titulo', 'fecha', 'estado'],
    schema: {
      titulo: fields.slug({
        name: { label: 'Título', validation: { isRequired: true } },
        slug: { label: 'Dirección (slug)', description: 'Forma parte de la URL. No la cambies una vez publicado.' },
      }),
      entradilla: fields.text({
        label: 'Entradilla',
        description: 'Dos o tres frases que resumen el artículo. Aparece bajo el título y en portada.',
        multiline: true,
      }),
      descripcion: fields.text({
        label: 'Descripción para buscadores',
        description: 'Entre 120 y 160 caracteres. Es lo que Google muestra bajo el título.',
        validation: { length: { max: 170 } },
      }),
      fecha: fields.date({ label: 'Fecha de publicación', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
      actualizado: fields.date({ label: 'Última actualización (opcional)' }),
      categoria: fields.select({ label: 'Sección', options: CATEGORIAS, defaultValue: 'canarias' }),
      temas: fields.array(fields.relationship({ label: 'Tema', collection: 'temas' }), {
        label: 'Temas',
        itemLabel: (p) => p.value ?? 'Tema',
      }),
      autoria: fields.array(fields.relationship({ label: 'Persona', collection: 'autoria' }), {
        label: 'Autoría',
        itemLabel: (p) => p.value ?? 'Persona',
      }),
      portada: fields.image({
        label: 'Imagen de portada',
        description: 'Horizontal, idealmente 1600×900 o mayor. Se optimiza sola.',
        directory: `src/assets/articulos/${idioma}`,
        publicPath: `../../../../assets/articulos/${idioma}/`,
      }),
      portadaAlt: fields.text({ label: 'Texto alternativo de la portada', description: 'Describe la imagen para quien no la ve.' }),
      estado: fields.select({
        label: 'Estado',
        options: [
          { label: 'Borrador (solo visible en vistas previas)', value: 'borrador' },
          { label: 'Publicado', value: 'publicado' },
        ],
        defaultValue: 'borrador',
      }),
      destacado: fields.checkbox({ label: 'Destacar en portada' }),
      serie: fields.text({ label: 'Serie (opcional)', description: 'Por ejemplo: Cómo no ser parte de la maquinaria extractivista' }),
      licencia: fields.select({ label: 'Licencia', options: LICENCIAS, defaultValue: 'cc-by-sa' }),
      referencias: fields.array(fields.relationship({ label: 'Referencia', collection: 'biblioteca' }), {
        label: 'Bibliografía',
        description: 'Referencias de la Biblioteca que se listan al final del artículo.',
        itemLabel: (p) => p.value ?? 'Referencia',
      }),
      ...(idioma !== 'es'
        ? {
            traduccionDe: fields.relationship({
              label: 'Traducción de',
              description: 'El artículo original en español.',
              collection: 'articulos',
            }),
          }
        : {}),
      contenido: fields.mdx({
        label: 'Contenido',
        options: {
          image: {
            directory: `src/assets/articulos/${idioma}`,
            publicPath: `../../../../assets/articulos/${idioma}/`,
          },
        },
        components: bloques,
      }),
    },
  });
}

export default config({
  storage: usarGithub
    ? { kind: 'github', repo: 'GofioDesign/macaronesico', branchPrefix: 'contenido/' }
    : { kind: 'local' },

  ui: {
    brand: { name: 'macaronesico' },
    navigation: {
      Revista: ['articulos', 'articulos_pt', 'articulos_en'],
      Datos: ['datos', 'biblioteca'],
      Organización: ['autoria', 'temas', 'paginas'],
    },
  },

  collections: {
    articulos: articulos('es', 'Artículos'),
    articulos_pt: articulos('pt', 'Artigos (português)'),
    articulos_en: articulos('en', 'Articles (English)'),

    datos: collection({
      label: 'Conjuntos de datos',
      slugField: 'titulo',
      path: 'src/content/datos/*',
      format: 'yaml',
      columns: ['titulo', 'fecha'],
      schema: {
        titulo: fields.slug({ name: { label: 'Título', validation: { isRequired: true } } }),
        descripcion: fields.text({ label: 'Descripción', multiline: true }),
        fuente: fields.text({ label: 'Fuente', description: 'Organismo o autoría de los datos originales.' }),
        url: fields.url({ label: 'Enlace a la fuente' }),
        fecha: fields.date({ label: 'Fecha de extracción' }),
        licencia: fields.text({ label: 'Licencia de los datos', defaultValue: 'CC BY 4.0' }),
        notas: fields.text({ label: 'Notas y método', multiline: true }),
        dimensiones: fields.text({
          label: 'Columnas para el explorador (opcional)',
          description:
            'Si el conjunto sirve para el Explorador de encuesta, escribe aquí las columnas de los selectores separadas por comas. Se publicará también a pantalla completa en /explorador/.',
        }),
        csv: fields.text({
          label: 'Datos (CSV)',
          description:
            'Pega aquí el CSV: primera fila con los nombres de columna, separado por comas, decimales con punto. Usa comillas si un texto contiene comas.',
          multiline: true,
          validation: { isRequired: true },
        }),
      },
    }),

    biblioteca: collection({
      label: 'Biblioteca',
      slugField: 'titulo',
      path: 'src/content/biblioteca/*',
      format: 'yaml',
      columns: ['titulo', 'anio', 'estado'],
      schema: {
        titulo: fields.slug({
          name: { label: 'Título de la obra', validation: { isRequired: true } },
          slug: { label: 'Clave', description: 'Por ejemplo: garcia-2021-turismo' },
        }),
        autores: fields.array(fields.text({ label: 'Autor/a', description: 'Apellidos, Nombre' }), {
          label: 'Autoría',
          itemLabel: (p) => p.value || 'Autor/a',
        }),
        anio: fields.integer({ label: 'Año', description: 'Vacío si aún no se conoce (se muestra «s. f.»).' }),
        tipo: fields.select({
          label: 'Tipo',
          options: [
            { label: 'Artículo de revista', value: 'articulo' },
            { label: 'Libro', value: 'libro' },
            { label: 'Capítulo de libro', value: 'capitulo' },
            { label: 'Tesis', value: 'tesis' },
            { label: 'Informe', value: 'informe' },
            { label: 'Conjunto de datos', value: 'datos' },
            { label: 'Otro', value: 'otro' },
          ],
          defaultValue: 'articulo',
        }),
        revista: fields.text({ label: 'Revista / libro que la contiene' }),
        volumen: fields.text({ label: 'Volumen' }),
        numero: fields.text({ label: 'Número' }),
        paginas: fields.text({ label: 'Páginas' }),
        editorial: fields.text({ label: 'Editorial / institución' }),
        doi: fields.text({ label: 'DOI', description: 'Solo el identificador, por ejemplo 10.1016/j.annals.2020.102898' }),
        url: fields.url({ label: 'URL' }),
        idioma: fields.select({
          label: 'Idioma de la obra',
          options: [
            { label: 'Español', value: 'es' },
            { label: 'Portugués', value: 'pt' },
            { label: 'Inglés', value: 'en' },
            { label: 'Francés', value: 'fr' },
            { label: 'Otro', value: 'otro' },
          ],
          defaultValue: 'es',
        }),
        acceso: fields.select({
          label: 'Acceso',
          options: [
            { label: 'Abierto', value: 'abierto' },
            { label: 'Cerrado', value: 'cerrado' },
            { label: 'Desconocido', value: 'desconocido' },
          ],
          defaultValue: 'desconocido',
        }),
        pdf: fields.url({ label: 'Enlace al PDF en acceso abierto (opcional)' }),
        territorios: fields.multiselect({ label: 'Territorios', options: TERRITORIOS, defaultValue: ['canarias'] }),
        temas: fields.array(fields.relationship({ label: 'Tema', collection: 'temas' }), {
          label: 'Temas',
          itemLabel: (p) => p.value ?? 'Tema',
        }),
        resumen: fields.text({ label: 'Resumen propio', description: 'Qué dice, en palabras de la revista.', multiline: true }),
        importancia: fields.text({ label: 'Por qué importa', multiline: true }),
        estado: fields.select({
          label: 'Estado editorial',
          options: [
            { label: 'Pendiente de leer', value: 'pendiente' },
            { label: 'Leída', value: 'leida' },
            { label: 'Reseñada', value: 'resenada' },
            { label: 'Usada en artículo', value: 'usada' },
          ],
          defaultValue: 'pendiente',
        }),
        verificada: fields.checkbox({
          label: 'Datos bibliográficos verificados',
          description: 'Desmárcalo si autoría, año o revista están sin comprobar (fichas importadas de listados).',
          defaultValue: true,
        }),
      },
    }),

    autoria: collection({
      label: 'Autoría',
      slugField: 'nombre',
      path: 'src/content/autoria/*',
      format: 'yaml',
      schema: {
        nombre: fields.slug({ name: { label: 'Nombre', validation: { isRequired: true } } }),
        bio: fields.text({ label: 'Biografía breve', multiline: true }),
        web: fields.url({ label: 'Web o perfil' }),
      },
    }),

    temas: collection({
      label: 'Temas',
      slugField: 'nombre',
      path: 'src/content/temas/*',
      format: 'yaml',
      schema: {
        nombre: fields.slug({ name: { label: 'Nombre', validation: { isRequired: true } } }),
        descripcion: fields.text({
          label: 'Texto introductorio',
          description: 'Aparece en la página del tema. Ayuda mucho al posicionamiento.',
          multiline: true,
        }),
      },
    }),

    paginas: collection({
      label: 'Páginas',
      slugField: 'titulo',
      path: 'src/content/paginas/*/',
      format: { contentField: 'contenido' },
      entryLayout: 'content',
      schema: {
        titulo: fields.slug({ name: { label: 'Título', validation: { isRequired: true } } }),
        descripcion: fields.text({ label: 'Descripción para buscadores' }),
        contenido: fields.mdx({ label: 'Contenido' }),
      },
    }),
  },
});
