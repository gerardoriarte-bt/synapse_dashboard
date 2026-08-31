# Synapse Dashboard

Frontend React con arquitectura limpia, componentes reutilizables y organizacion por features.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Oxlint + Prettier

## Inicio rapido

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run preview` | Preview del build |
| `npm run lint` | Linter (Oxlint) |

## Estructura del proyecto

Consulta la guia completa en [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md).

```
src/
├── app/           # Providers, router, App root
├── components/    # UI primitivos + layout
├── features/      # Modulos por funcionalidad
├── pages/         # Vistas por ruta
├── hooks/         # Hooks globales
├── services/      # API e integraciones
├── lib/           # Utilidades y constantes
├── types/         # Tipos compartidos
└── styles/        # CSS global y tokens
```

## Convenciones

Las reglas de desarrollo para Cursor AI estan en [`.cursorrules`](./.cursorrules).

Principios clave:

- Componentes UI presentacionales en `components/ui/`
- Logica de negocio agrupada en `features/`
- Imports absolutos con alias `@/`
- TypeScript strict mode
- Design tokens en Tailwind (`@theme`)
