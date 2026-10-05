# Para el equipo de backend · desplegar el front en QA · 2026-10-05

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `526997c` el 2026-10-05** · de nuestro lado, la imagen levantada
contra la API de QA de verdad; de ustedes, `c8b9247` levantado acá y las rutas de
QA sondeadas una por una.

**Dos pedidos, los dos de despliegue.**

---

## 1 · Subir el front a `qa-synapse.lobueno.co`

**Decisión nuestra: reemplaza lo que hoy sirve ese nombre.**

La imagen está probada contra su API de QA. Son tres comandos y **una** variable:

```
git clone https://github.com/gerardoriarte-bt/synapse_dashboard.git
cd synapse_dashboard
docker build -t synapse-front .
docker run -p 8080:8080 -e API_ORIGIN=https://qa-synapse-api.lobueno.co synapse-front
```

El repositorio es público y la rama por defecto ya lo trae — no hace falta `-b`.

| | |
|---|---|
| Imagen final | **79 MB** · `nginx:alpine` sirviendo estáticos, sin Node adentro |
| Puerto | **8080**, no 80 · corre como **no-root** (uid 101) |
| Variables | **`API_ORIGIN`** y nada más. `NGINX_PORT` si necesitan otro puerto |
| Healthcheck | `GET /` · a propósito **no** mira la API, para que un backend caído no reinicie el front |

**Si usan raíz de sólo lectura**, hay que montar `/var/cache/nginx` y `/tmp` como
volúmenes efímeros. Está en `deploy/README.md`.

### Qué se probó, corriendo

| | |
|---|---|
| `GET /` y `GET /admin` | **200** los dos |
| `POST /api/v1/auth/login` | **200** por el proxy |
| `GET /api/v1/config/me` con token | **200** · tenant `Synapse UA HTML` |
| `GET /api/v1/config/tabs/{tabId}` | **200** · sus paneles |
| Lo mismo con `Host: qa-synapse.lobueno.co` | **401** sin token · el Host del front no les molesta |
| Construido desde un clone limpio de la rama por defecto | ✓ |

**La API va por el mismo origen**, así que no hay CORS que configurar de su lado.

## 2 · Redesplegar la API de QA · está en un binario anterior a `c8b9247`

No es código que falte: es código suyo que no está arriba.

**Cómo lo medimos** —sin endpoint de versión, por superficie, donde un 401 dice
que la ruta existe y un 404 que no—:

| Ruta | QA |
|---|---|
| `GET /config/panels/{panelId}/drilldown/dimensions` | **401** |
| `GET /config/plots` | **404** |

**Qué nos destraba:** tres paneles de UA declaran gráfico —`radial` y
`smallmult`— y sin el repertorio el front no puede resolverlos, así que los
publicamos **sin** gráfico. Con `/config/plots` sirviendo, los reponemos nosotros
en una línea.

Y de paso llegan las cuatro métricas nuevas y el `t` en ISO.

## 3 · Lo ya pedido que sigue abierto · una línea

El `tzdata` de su imagen: el tenant de QA está en `locale es-MX` con
`timezone: America/Bogota`, remedido hoy. Está en
`MENSAJE-2026-10-02-backend-tzdata-en-la-imagen.md`.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Subir la imagen a `qa-synapse.lobueno.co` | **Ustedes** |
| 2 | Redesplegar la API a `c8b9247` o posterior | **Ustedes** |
| 3 | `tzdata` · ya pedido | Ustedes |
| — | Reponer los tres gráficos cuando `/config/plots` sirva | Nosotros |
