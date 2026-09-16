# Synapse Dashboard

Front dinámico de Synapse: un **renderizador puro de React** que no tiene ninguna
pantalla escrita. El backend manda el layout, el catálogo y los datos; el front
los dibuja.

## Cadena de autoridad

| Fuente | Define |
|---|---|
| `synaspse_dashboard/nuevo-desarrollo.md` | **Normativo.** Arquitectura del front |
| `synaspse_dashboard/tareas-front-back.md` | El desglose en tareas B*/F* |
| `contracts/synapse-api.yaml` | **El contrato, y su casa.** `src/api/generated.ts` sale de acá con `npm run gen:api` |
| `../design/design.md` | Reglas duras de producto |
| `../handoff/parametros-front.md` | Tokens, grilla, anatomía de panel |

## Stack

- React 19 + TypeScript strict (sin excepciones)
- Vite · React Router 7
- **Tailwind CSS v4** sobre los 57 tokens del `.pen`
- TanStack Query para datos de servidor
- Oxlint + Prettier

## Inicio rápido

```bash
npm install
cp .env.example .env
npm run dev            # Vite en :5173
```

### Con el backend

**Es un solo servicio.** `AntPack-dev/synapse-api-go` sirve `/auth/*`,
`/config/*` y `/admin/*` desde el mismo binario, bajo el mismo `/api/v1`. En
local levanta en **:4010**, y `vite.config.ts` proxea `/api/v1` entero hacia
ahí — no hace falta configurar nada.

```bash
# en el repo del backend, rama feature/dynamic-dashboard-backend
DB_AUTO_MIGRATE=true make run     # la primera vez: migra y siembra
make run                          # después
```

El seed deja un layout publicado con doce paneles y tres roles —`user`,
`planner`, `admin`—, así que la consola tiene qué pintar sin tocar Snowflake.

Si el servicio corre en otro lado:

```bash
API_ORIGIN=http://otro-host:4010 npm run dev
```

**Lo que todavía no anda contra el servicio real**: el front habla el vocabulario
del contrato y el servicio habla otro. La traducción es el adaptador de
`src/api/` — tareas F1.32–F1.41 del plan. El análisis está en
`docs/PLAN-INTEGRACION-2026-09-11.md`.

## Los tres objetos que el front consume

1. **Layout** — `GET /config/tabs/{tabId}` · dónde va cada panel. Sin datos.
2. **Catálogo** — `GET /config/catalog` · qué es cada métrica. Ya filtrado por rol.
3. **Payload** — `POST /config/panels:batch` · los valores del período.

Cambiar de período **no** vuelve a pedir el layout. Esa separación es la que hace
que el dashboard se recomponga por tenant y por rol sin un deploy.

## Estructura

Ver [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md).
