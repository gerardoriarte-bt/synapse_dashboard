# Synapse · el front dinámico
#
# Dos etapas: se construye con Node y se sirve con nginx. La imagen final **no
# lleva Node ni `node_modules`** — son 888 KB de estático y nada más.
#
#   docker build -t synapse-front .
#   docker run -p 8080:8080 -e API_ORIGIN=http://synapse-api:8080 synapse-front
#
# Ver `deploy/README.md` para lo que hay que decidir antes de desplegarlo.

# ── ETAPA 1 · construir ───────────────────────────────────────────────────────
#
# **Node 22 y no 20**: Vite 8 pide 20.19+ o 22.12+. Se fija la mayor porque es la
# que se usa para desarrollar —medido: `v22.18.0`— y una diferencia de mayor entre
# lo que se prueba y lo que se despliega es una clase de bug que nadie busca.
FROM node:22-alpine AS build

WORKDIR /app

# **El lockfile primero, y solo, a propósito.** Copiar todo el repo acá haría que
# cualquier cambio de código invalide la capa de dependencias y `npm ci` corra de
# nuevo en cada build. Con esto se reinstala sólo cuando cambia el lockfile.
COPY package.json package-lock.json ./

# `npm ci` y no `npm install`: instala exactamente el lockfile y falla si
# `package.json` no coincide con él, en vez de resolverlo en silencio.
RUN npm ci

COPY . .

# ── LAS TRES VARIABLES DE BUILD, Y POR QUÉ LAS TRES ESTÁN VACÍAS ──────────────
#
# Vite las hornea en el bundle, así que lo que se ponga acá queda fijo en el
# artefacto. **Vacías es el default deliberado**, no un olvido:
#
#   VITE_API_URL   sin ella, el cliente usa `/api/v1` relativo · y como nginx
#                  sirve la API en el mismo origen, funciona en todos los
#                  ambientes con UNA sola imagen. Ponerla obliga a construir una
#                  imagen por ambiente, que es lo que esto evita.
#   VITE_BUDGET    `=1` enciende el presupuesto de render en consola. Sólo para
#                  diagnosticar; en un ambiente de pruebas normal va apagada.
#
# **Sólo se ponen si la API NO puede servirse en el mismo origen.**
#
# **`VITE_AUTH_URL` existe en el código y NO se expone acá**, a propósito: es de
# cuando `/auth` y `/config` eran dos servicios, hoy es uno solo, y su fallback a
# `VITE_API_URL` ya hace lo correcto. Exponerla agregaba una perilla que nadie
# necesita y, además, `docker build` la marca como secreto por el nombre — una
# advertencia permanente sobre algo que es una URL.
ARG VITE_API_URL=""
ARG VITE_BUDGET=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_BUDGET=$VITE_BUDGET

# `npm run build` es `tsc -b && vite build`: **el typecheck es parte del build**,
# así que una imagen que se construye es una que tipa. No se saltea.
RUN npm run build

# ── ETAPA 2 · servir ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS serve

# La imagen oficial corre `envsubst` sobre `/etc/nginx/templates/*.template` al
# arrancar y escribe el resultado en `/etc/nginx/conf.d/`. Por eso el destino es
# ese y no `conf.d` directo.
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

# **`DOLLAR` existe para protegerse de `envsubst`**, que reemplaza TODO lo que
# parezca `$algo`. Sin esto, `$uri` y `$host` se sustituyen por vacío y nginx
# arranca sirviendo cualquier cosa sin dar un error claro.
ENV DOLLAR='$' \
    NGINX_PORT=8080 \
    API_ORIGIN=http://synapse-api:8080

# ── CORRE COMO NO-ROOT, Y ESO NO SALE SOLO ────────────────────────────────────
#
# **8080 y no 80** porque abajo de 1024 hace falta `NET_BIND_SERVICE`. Pero el
# puerto sólo lo PERMITE: hasta el 2026-09-28 este archivo decía «para poder
# correr como no-root» y la imagen **no podía** — se probó con `--user 101:101` y
# nginx muere con `mkdir() "/var/cache/nginx/client_temp" failed (13: Permission
# denied)`.
#
# Era una capacidad afirmada y no verificada, igual que la del buffering. Ahora
# está puesta: los directorios que nginx escribe se crean y se le dan al uid 101,
# que es el usuario `nginx` de la imagen oficial.
#
# **Importa para AWS**: muchas cuentas exigen tarea no-root, y con
# `readonlyRootFilesystem` hay que montar `/var/cache/nginx` y `/tmp` como
# volúmenes efímeros.
RUN set -eux; \
    mkdir -p /var/cache/nginx /var/run/nginx; \
    chown -R 101:101 /var/cache/nginx /var/run/nginx /etc/nginx/conf.d /usr/share/nginx/html; \
    sed -i 's!^pid .*!pid /var/run/nginx/nginx.pid;!' /etc/nginx/nginx.conf

USER 101:101

EXPOSE 8080

# El chequeo mira `/`, que `try_files` resuelve siempre a `index.html`. **No
# apunta a `/api/v1`** a propósito: el front está sano aunque el backend no lo
# esté, y si el healthcheck dependiera de la API, un backend caído reiniciaría el
# front en un bucle sin arreglar nada.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1
