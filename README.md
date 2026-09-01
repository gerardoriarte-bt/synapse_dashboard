# Synapse Dashboard

Front dinámico de Synapse: un **renderizador puro de React** que no tiene ninguna
pantalla escrita. El backend manda el layout, el catálogo y los datos; el front
los dibuja.

## Cadena de autoridad

| Fuente | Define |
|---|---|
| `synaspse_dashboard/nuevo-desarrollo.md` | **Normativo.** Arquitectura del front |
| `synaspse_dashboard/tareas-front-back.md` | El desglose en tareas B*/F* |
| `../contracts/synapse-api.yaml` | El contrato. `src/api/generated.ts` sale de acá |
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
npm run dev
```

## Los tres objetos que el front consume

1. **Layout** — `GET /config/tabs/{tabId}` · dónde va cada panel. Sin datos.
2. **Catálogo** — `GET /config/catalog` · qué es cada métrica. Ya filtrado por rol.
3. **Payload** — `POST /config/panels:batch` · los valores del período.

Cambiar de período **no** vuelve a pedir el layout. Esa separación es la que hace
que el dashboard se recomponga por tenant y por rol sin un deploy.

## Estructura

Ver [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md).
