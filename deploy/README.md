# Desplegar el front

Dos archivos y una decisión. **Todo lo de acá se corrió el 2026-09-28**, no se
dedujo: la imagen se construyó, se levantó y se midió.

```bash
docker build -t synapse-front .
docker run -p 8080:8080 -e API_ORIGIN=http://synapse-api:8080 synapse-front
```

| | |
|---|---|
| `Dockerfile` | Dos etapas · construye con Node 22 y sirve con nginx. **La imagen final no lleva Node** |
| `deploy/nginx.conf.template` | Se resuelve con `envsubst` al **arrancar** el contenedor, no al construirlo |
| Peso medido | **77,3 MB** · de los cuales el bundle son 888 KB |

## La única decisión · dónde vive la API

**`VITE_API_URL` se hornea EN EL BUILD.** Vite la resuelve al compilar, así que lo
que se ponga queda fijo en el artefacto.

| | Cuándo | Costo |
|---|---|---|
| **Mismo origen** · recomendado | nginx proxea `/api/v1` al backend | **Una sola imagen para todos los ambientes.** Y **no hay CORS que configurar** |
| `VITE_API_URL` al construir | La API vive en otro dominio y no se puede proxear | Una imagen por ambiente, y CORS del lado del backend |

Con la primera, el default relativo `/api/v1` del cliente ya funciona y lo único
que cambia por ambiente es `API_ORIGIN`, **que es de arranque**.

## Las variables

| | Cuándo | Default |
|---|---|---|
| `API_ORIGIN` | **Arranque** · a dónde va `/api/v1` | `http://synapse-api:8080` |
| `NGINX_PORT` | Arranque | `8080` |
| `DOLLAR` | Arranque · **no se toca** · ver abajo | `$` |
| `VITE_API_URL` | **Build** · sólo si la API no es del mismo origen | vacío |
| `VITE_BUDGET` | Build · `=1` enciende el presupuesto de render en consola | vacío |

## Las cuatro cosas que se verificaron corriendo

### 1 · `try_files` · **y se comprobó rompiéndolo**

`AppProviders` monta `BrowserRouter`. Sin el fallback a `index.html`, entrar
directo a una ruta o apretar F5 devuelve **404 del servidor**.

Medido con la línea puesta y con la línea rota:

| | Con `try_files … /index.html` | Con `… =404` |
|---|---|---|
| `/` | **200** | **200** |
| `/admin` | **200** | **404** |
| `/builder` | **200** | **404** |

**La raíz sigue en 200 en los dos casos**, y por eso esto no se nota probando
desde el login. Se nota cuando alguien comparte un enlace.

### 2 · El proxy llega, y devuelve lo mismo

`POST /api/v1/auth/login` a través del contenedor → **200**, con el mismo usuario
que responde el servicio directo.

### 3 · `envsubst` no se comió las variables de nginx

Es el modo de falla del mecanismo: `envsubst` reemplaza **todo** lo que parezca
`$algo`, así que sin protección `$uri` y `$host` quedan vacíos y nginx arranca
sirviendo cualquier cosa **sin un error claro**.

Por eso van como `${DOLLAR}uri` en el template y `DOLLAR='$'` en la imagen.
Comprobado leyendo el conf **renderizado dentro del contenedor**: `$uri`, `$host`
y `$remote_addr` intactos, cero `${}` sin resolver, y `nginx -t` en verde.

### 4 · Las cabeceras de cache

| | Medido |
|---|---|
| `/assets/*` | `max-age=31536000` · el nombre lleva hash de contenido |
| `/` | `no-cache, no-store, must-revalidate` |

**La segunda importa más que la primera.** Un `index.html` cacheado apunta a
assets con hash que el deploy siguiente ya borró: pantalla en blanco, sin un solo
error visible.

### 5 · El SSE del chat · **corrido contra Cortex real, y corrigió una afirmación**

Se ejercitó de verdad: dos preguntas al agente a través del contenedor, midiendo
**cuándo** llega cada trozo, que es lo único que distingue un stream de un
volcado.

| | Trozos | Reparto entre el primero y el último |
|---|---|---|
| `proxy_buffering off` | 79 | **20,87 s** |
| `proxy_buffering on` | 119 | **18,03 s** |

Los cuatro frames llegaron en los dos casos —`thread_info`, `thinking`, `delta`,
`done`—.

**Y eso desmiente lo que este archivo decía.** La versión anterior afirmaba que
sin `proxy_buffering off` el chat «se ve COLGADO y al final vuelca todo junto».
**Se midió y es falso**: con el buffer puesto llega incremental igual.

La razón: la respuesta entera son ~6-8 KB, **entra en los buffers por default**
—8 × 4k—, y aun así nginx la reenvía a medida que la lee, porque con el cliente
siguiendo el ritmo no espera a completarla.

**`off` se deja igual, con la razón correcta:** quita la dependencia del tamaño de
los buffers y del ritmo del cliente. Una respuesta más larga o un cliente lento sí
harían que nginx bufferee —incluso a disco—, y ahí el modo de falla descrito
aparecería. **`off` lo vuelve imposible en vez de improbable.**

Lo que no se puede decir es que sea lo que hace andar el chat: **anda sin esto.**
Es una garantía, no un arreglo.

## Tres cosas que sorprenden, y están puestas a propósito

- **Escucha en 8080, no en 80**, para poder correr sin privilegios y como usuario
  no-root sin pedir `NET_BIND_SERVICE`.
- **El `HEALTHCHECK` mira `/`, no la API.** Si dependiera del backend, un backend
  caído reiniciaría el front en bucle sin arreglar nada.
- **`tests/` y `dev/` SÍ entran al contexto de build**, y la primera versión de
  `.dockerignore` los excluía. Es falso que el build no los toque: `npm run build`
  es `tsc -b` y el `tsconfig.json` raíz referencia cuatro proyectos. **Lo encontró
  construir la imagen.** Los mocks no llegan al bundle igual, porque `vite build`
  sólo empaqueta lo alcanzable desde `index.html` y `mocks-fuera` lo verifica.

## Lo que este despliegue NO resuelve

- **TLS.** Va detrás de un balanceador o un ingress que lo termine.
- **El backend.** Esto sirve el front; `API_ORIGIN` tiene que apuntar a algo.
- **Autenticación de la imagen.** El token vive en `localStorage` del navegador,
  que es lo que el front ya hacía.
