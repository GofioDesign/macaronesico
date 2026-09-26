# Puesta en marcha

Pasos, en orden, para pasar macaronesico.com de WordPress a este repositorio.
Todo se hace desde el navegador y con planes gratuitos. Hasta el paso 5 la web
actual en Ductiva sigue funcionando sin cambios.

## 1. Comprobar que el sitio compila

En GitHub, pestaña **Actions**: el flujo **Compilar** debe aparecer en verde.
El flujo **Migrar desde WordPress** se ejecuta solo la primera vez y añade al
repositorio las portadas de los artículos y las páginas legales (aviso legal,
privacidad, cookies). Si alguno falla, abre el registro y copia el error.

## 2. Conectar Cloudflare Pages

1. Cloudflare → **Workers & Pages** → **Create** → pestaña **Pages** →
   **Connect to Git**.
2. Autoriza GitHub y elige `GofioDesign/macaronesico`.
3. Configuración de compilación:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Production branch: `main`
4. En **Environment variables** añade `NODE_VERSION` = `22`.
5. **Save and Deploy**. Al terminar, la web nueva estará en
   `https://macaronesico.pages.dev` (o un nombre parecido que indique
   Cloudflare). Revísala a fondo.
6. En el proyecto → **Settings** → **Runtime** → **Compatibility flags**,
   añade `nodejs_compat` en Production y en Preview.

Cada rama que no sea `main` genera su propia vista previa, con los borradores
visibles. `main` es lo publicado.

## 3. Activar el gestor (Keystatic)

El gestor vive en `/keystatic` (o `/admin`). Para que pueda guardar en GitHub
necesita una GitHub App propia, gratuita.

1. GitHub → organización **GofioDesign** → **Settings** → **Developer
   settings** → **GitHub Apps** → **New GitHub App**.
2. Rellena:
   - **GitHub App name**: `macaronesico-gestor` (si está cogido, otro parecido).
   - **Homepage URL**: la dirección de Pages, por ejemplo
     `https://macaronesico.pages.dev`.
   - **Callback URL** (añade las tres con «Add Callback URL»):
     - `https://macaronesico.pages.dev/api/keystatic/github/oauth/callback`
     - `https://macaronesico.com/api/keystatic/github/oauth/callback`
     - `http://127.0.0.1:4321/api/keystatic/github/oauth/callback`
   - Deja marcado **Expire user authorization tokens**.
   - **Webhook**: desmarca **Active**.
   - **Repository permissions**: **Contents** → Read and write;
     **Pull requests** → Read and write. (Metadata queda en Read-only.)
   - **Where can this GitHub App be installed?** → Only on this account.
3. **Create GitHub App**. En la página de la app:
   - Copia el **Client ID**.
   - Pulsa **Generate a new client secret** y cópialo (solo se ve una vez).
   - El **slug** es la última parte de la dirección pública de la app
     (`github.com/apps/<slug>`).
4. En el menú de la app, **Install App** → GofioDesign → **Only select
   repositories** → `macaronesico`.
5. En Cloudflare Pages → **Settings** → **Variables and secrets**, añade para
   Production y Preview:

   | Nombre | Valor | Tipo |
   |---|---|---|
   | `KEYSTATIC_GITHUB_CLIENT_ID` | Client ID | Text |
   | `KEYSTATIC_GITHUB_CLIENT_SECRET` | Client secret | Secret |
   | `KEYSTATIC_SECRET` | Una cadena aleatoria larga (40+ caracteres) | Secret |
   | `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Slug de la app | Text |

6. **Deployments** → último despliegue → **Retry deployment** para que tome
   las variables.
7. Abre `https://macaronesico.pages.dev/keystatic`, entra con GitHub y
   prueba a editar algo.

Para dar acceso a un colaborador: invítalo al repositorio en GitHub con
permiso de escritura. Entrará al gestor con su cuenta. Para trabajar sin
tocar lo publicado, que cree una rama desde el propio gestor: se guarda con el
prefijo `contenido/` y Cloudflare le genera una vista previa.

## 4. Revisar antes del cambio

- [ ] Las cinco URL de los artículos responden igual que en WordPress.
- [ ] Las páginas legales están y dicen lo correcto (sin WordPress ya no hay
      cookies de terceros; revisa la política de cookies).
- [ ] Las portadas se ven y tienen texto alternativo.
- [ ] El artículo de la encuesta está en **borrador**: publícalo desde el
      gestor cuando quieras.
- [ ] `/feed.xml`, `/sitemap-index.xml` y `/robots.txt` responden.

## 5. Cambiar el dominio (Porkbun → Cloudflare)

El dominio sigue registrado y pagado en Porkbun; solo cambia quién responde
las consultas DNS.

1. En Cloudflare, zona **macaronesico.com** → **DNS** → **Records**: compara
   con las entradas de Porkbun. Asegúrate de que están las de **correo** (MX,
   y TXT de SPF/DKIM/DMARC) si el dominio tiene buzones.
2. En Cloudflare Pages → proyecto → **Custom domains** → **Set up a domain**
   → `macaronesico.com`. Repite con `www.macaronesico.com`. Cloudflare
   sustituirá la entrada que apunta a Ductiva.
3. En Porkbun → dominio → **Authoritative Nameservers**: cambia los de
   Porkbun por los dos que indica Cloudflare en la ficha de la zona.
4. Espera la activación (minutos u horas). Cloudflare avisa por correo.
5. Si algo sale mal, basta con volver a poner en Porkbun sus servidores
   de nombres originales.

## 6. Buscadores y analítica

1. [Google Search Console](https://search.google.com/search-console): añade
   la propiedad de dominio `macaronesico.com` (verificación por TXT en
   Cloudflare) y envía `https://macaronesico.com/sitemap-index.xml`.
2. [Bing Webmaster Tools](https://www.bing.com/webmasters): importa desde
   Search Console.
3. Cloudflare Pages → proyecto → **Metrics** → activa **Web Analytics**
   (sin cookies, no necesita banner).

## 7. Retirar WordPress

Deja el WordPress de Ductiva sin tocar un mes como copia de seguridad
(descarga antes una exportación completa: Herramientas → Exportar, y una copia
de la carpeta `wp-content/uploads`). Después, da de baja el alojamiento.
