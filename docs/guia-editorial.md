# Guía editorial del gestor

El gestor está en **macaronesico.com/keystatic**. Se entra con la cuenta de
GitHub. Cada vez que guardas, el cambio queda registrado en el historial del
repositorio y la web se vuelve a publicar sola en uno o dos minutos.

## Escribir un artículo

1. **Artículos** → **Add**.
2. Rellena título, entradilla, **descripción para buscadores** (120-160
   caracteres), sección, temas, autoría y portada con su texto alternativo.
3. Deja el **Estado** en *Borrador* mientras trabajas. Los borradores solo se
   ven en las vistas previas, nunca en macaronesico.com.
4. Escribe el texto. Con el botón **+** o escribiendo `/` insertas bloques.
5. Cuando esté listo, cambia el estado a *Publicado* y guarda.

La **dirección (slug)** forma parte de la URL. No la cambies después de
publicar.

### Trabajar en equipo

En la barra superior del gestor puedes crear una **rama**. Todo lo que
guardes en ella queda aparte de lo publicado, con su propia vista previa en
Cloudflare. Cuando esté revisado, se abre una *pull request* y se fusiona en
`main`.

## Bloques disponibles

| Bloque | Para qué |
|---|---|
| **Cifra destacada** | Un número grande con su frase: «27,2% de los jóvenes…» |
| **Tabla de datos** | Tabla ordenable a partir de un conjunto de datos. Se puede resaltar una columna y fijar el orden inicial |
| **Gráfico** | *Puntos enfrentados* para comparar dos grupos por fila (con la diferencia a la derecha) o *barras horizontales* |
| **Nota metodológica** | Recuadro plegable con el método, la muestra y los márgenes de error |
| **Fuentes** | Lista final de fuentes con enlaces |
| **Cita destacada** | Una frase grande en mitad del texto |
| **Cita bibliográfica** | (Autoría, año) enlazado a la ficha de la Biblioteca |
| **Pieza a medida** | Una pieza interactiva propia (mapa, simulador) guardada en `public/piezas/` |

Las tablas y gráficos no guardan los números dentro del artículo: los leen de
un **conjunto de datos**. Así una corrección en los datos se aplica en todos
los artículos que los usan.

## Conjuntos de datos

**Datos** → **Conjuntos de datos** → **Add**. Pega el CSV en el campo *Datos*:

- Primera fila: nombres de las columnas. Esos nombres son los que se escriben
  en los bloques («18-34 años», «Brecha (puntos)»).
- Separador: coma. Decimales: **punto** (58.8). La web los muestra con coma.
- Si un texto contiene comas, va entre comillas: `"Consume agua, energía o suelo"`.

Rellena siempre fuente, enlace, fecha y notas de método: se publican en
`/datos/` con descarga en CSV y ayudan a que Google los indexe como datos.

## Biblioteca

Cada referencia científica es una ficha con sus datos bibliográficos,
territorios, temas, un **resumen propio** y **por qué importa**.

- Alta a mano: **Biblioteca** → **Add**.
- Alta por lotes: sube a `scripts/biblioteca/entrada/` un `.txt` con una
  referencia por línea (`doi:`, `titulo:`, `isbn:` o `buscar:`). GitHub la
  procesa sola: busca cada obra en Crossref o por ISBN, crea las fichas y deja
  un informe en `scripts/biblioteca/informes/`. Lo que no puede verificar lo
  crea como ficha **provisional** (casilla *verificada* desmarcada) para
  completarla en el gestor. Se puede pedir a Claude que prepare el listado.
- Para citar dentro de un artículo usa el bloque **Cita bibliográfica**, y
  añade la referencia al campo **Bibliografía** del artículo para que salga en
  la lista final en formato APA.
- El estado editorial (*pendiente → leída → reseñada → usada en artículo*)
  sirve para planificar qué artículos escribir a partir de la Biblioteca.

## Republicación

Si la licencia del artículo es Creative Commons, al final aparece el botón
**Republica este artículo**, que da el HTML listo para pegar en WordPress con
la atribución y la URL canónica. Las tablas y gráficos se convierten en
tablas simples. El RSS (`/feed.xml` y `/{sección}/feed.xml`) lleva el texto
completo con la misma atribución.

## Traducciones

Las colecciones **Artigos (português)** y **Articles (English)** funcionan
igual que la española. En el campo **Traducción de** se elige el original:
la web enlaza ambas versiones y avisa a Google de que son la misma pieza en
otro idioma. La dirección de una traducción será `/pt/{sección}/{slug}/`.

## Buenas prácticas SEO

- Descripción para buscadores propia en cada artículo.
- Texto alternativo en todas las imágenes.
- Enlaza al menos a otro artículo de la revista y, si procede, a la Biblioteca.
- Usa los temas existentes antes de crear uno nuevo, y escribe su texto
  introductorio en **Temas**.
