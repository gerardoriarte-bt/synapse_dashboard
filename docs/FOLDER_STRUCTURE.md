# Estructura de carpetas — Synapse Dashboard

Este documento describe la organizacion del frontend y que debe ir en cada carpeta.
Consultalo antes de crear archivos nuevos para mantener el proyecto limpio y escalable.

## Arbol general

```
synapse-dashboard/
├── public/                  # Assets estaticos servidos tal cual (favicon, robots.txt)
├── src/
│   ├── app/                 # Configuracion y shell de la aplicacion
│   ├── assets/              # Recursos estaticos importados desde codigo
│   ├── components/          # Componentes compartidos (UI + layout)
│   ├── features/            # Modulos por funcionalidad de negocio
│   ├── hooks/               # Custom hooks globales
│   ├── lib/                 # Utilidades y constantes
│   ├── pages/               # Vistas asociadas a rutas
│   ├── services/            # Integraciones externas (API, auth, analytics)
│   ├── styles/              # Estilos globales y design tokens
│   ├── types/               # Tipos TypeScript compartidos
│   └── main.tsx             # Punto de entrada
├── docs/                    # Documentacion del proyecto
├── .cursorrules             # Reglas para Cursor AI
├── .env.example             # Variables de entorno de ejemplo
└── package.json
```

---

## `public/`

**Que va aqui:** archivos que no pasan por el bundler y se sirven con la misma URL.

| Archivo | Descripcion |
|---------|-------------|
| `favicon.svg` | Icono del sitio |
| `robots.txt` | Reglas para crawlers |
| `manifest.json` | PWA (si aplica) |

**Que NO va aqui:** imagenes que necesitan optimizacion o import desde componentes (usar `src/assets/`).

---

## `src/app/`

**Que va aqui:** todo lo relacionado con el arranque y la estructura global de la app.

```
app/
├── App.tsx              # Componente raiz que compone providers + layout + router
├── providers/
│   └── AppProviders.tsx # Context providers (Router, Theme, QueryClient, etc.)
└── router/
    ├── routes.tsx       # Definicion de rutas (RouteObject[])
    └── AppRouter.tsx    # Componente que renderiza rutas con useRoutes()
```

**Reglas:**
- No poner logica de negocio aqui.
- Los providers se apilan en `AppProviders`.
- Las rutas apuntan a componentes de `src/pages/`.

---

## `src/assets/`

**Que va aqui:** recursos importados en el codigo (Vite los procesa y optimiza).

```
assets/
├── images/     # PNG, JPG, WebP, SVG usados en componentes
├── fonts/      # Fuentes locales (.woff2, .ttf)
└── icons/      # SVGs como componentes o archivos importables
```

**Ejemplo de uso:**
```tsx
import logo from '@/assets/images/logo.svg'
```

---

## `src/components/`

Componentes **compartidos** entre multiples features. Divididos en dos subcarpetas:

### `components/ui/` — Primitivos de UI

**Que va aqui:** botones, inputs, modales, badges, cards, spinners, etc.

**Estructura por componente:**
```
ui/
└── Button/
    ├── Button.tsx        # Implementacion
    ├── Button.types.ts   # Props e interfaces (opcional si son pocas)
    └── index.ts          # Re-export publico
```

**Caracteristicas:**
- Sin estado de negocio ni llamadas a API.
- Altamente reutilizables y configurables via props.
- Variantes (`primary`, `secondary`) y tamanos (`sm`, `md`, `lg`).
- Siempre exportar desde `components/ui/index.ts`.

**Componentes incluidos de ejemplo:** `Button`, `Card`, `Input`.

### `components/layout/` — Estructura de pagina

**Que va aqui:** Header, Footer, Sidebar, MainLayout, PageContainer.

**Caracteristicas:**
- Definen la estructura visual, no el contenido de negocio.
- Reciben `children` para composicion.
- Pueden usar componentes de `ui/`.

**Componentes incluidos de ejemplo:** `Header`, `MainLayout`.

---

## `src/features/`

**Que va aqui:** modulos completos agrupados por funcionalidad de negocio.
Cada feature es autocontenido.

```
features/
└── dashboard/
    ├── components/     # Componentes especificos del feature (MetricCard)
    ├── hooks/          # Hooks del feature (useDashboardMetrics)
    ├── api/            # Funciones que llaman al backend del feature
    ├── types/          # Tipos del dominio (DashboardMetric)
    ├── utils/          # Helpers solo usados en este feature (opcional)
    └── index.ts        # API publica del feature (lo unico que se importa desde fuera)
```

**Reglas:**
- Importar desde fuera solo via `@/features/dashboard` (barrel export).
- No importar directamente archivos internos de otro feature.
- Si algo se usa en 2+ features, moverlo a `components/`, `hooks/` o `lib/`.

**Cuando crear un feature nuevo:**
- Cuando hay logica de negocio, estado y componentes propios de un dominio (auth, users, settings, etc.).

---

## `src/pages/`

**Que va aqui:** componentes que representan una **ruta/vista completa**.

```
pages/
└── HomePage/
    ├── HomePage.tsx    # Vista de la pagina
    └── index.ts        # Re-export
```

**Reglas:**
- Una carpeta por pagina.
- Componen features + componentes UI; poca logica propia.
- No crear componentes reutilizables aqui — extraerlos.
- Conectar con el router en `src/app/router/routes.tsx`.

**Paginas incluidas de ejemplo:** `HomePage`, `NotFoundPage`.

---

## `src/hooks/`

**Que va aqui:** custom hooks **globales** usados en multiples partes de la app.

| Hook | Proposito |
|------|-----------|
| `useDebounce` | Retrasar actualizaciones (busqueda, filtros) |
| `useMediaQuery` | Detectar breakpoints responsive |

**Reglas:**
- Hooks especificos de un feature van en `features/<name>/hooks/`.
- Nombrar siempre con prefijo `use`.
- Exportar desde `hooks/index.ts`.

---

## `src/lib/`

**Que va aqui:** utilidades puras, helpers y constantes globales.

| Archivo | Proposito |
|---------|-----------|
| `cn.ts` | Combinar clases Tailwind (`clsx` + `tailwind-merge`) |
| `constants.ts` | Constantes globales (`APP_NAME`, `ROUTES`) |
| `formatDate.ts` | Formateo de fechas (cuando se necesite) |

**Reglas:**
- Funciones puras sin efectos secundarios.
- Sin dependencias de React (excepto helpers muy genericos).

---

## `src/services/`

**Que va aqui:** capa de comunicacion con el mundo exterior.

```
services/
└── api/
    ├── client.ts      # Cliente HTTP base (fetch wrapper)
    ├── endpoints.ts   # Constantes de URLs/endpoints
    └── index.ts       # Re-export
```

**Tambien puede incluir (segun crezca el proyecto):**
- `services/auth/` — login, logout, refresh token
- `services/analytics/` — tracking de eventos
- `services/storage/` — localStorage/sessionStorage wrappers

**Reglas:**
- Toda llamada HTTP pasa por `apiClient`.
- No hacer `fetch` directo en componentes o hooks de UI.

---

## `src/styles/`

**Que va aqui:** estilos globales y design system.

| Archivo | Proposito |
|---------|-----------|
| `globals.css` | Reset, Tailwind import, design tokens (`@theme`) |

**Reglas:**
- Tokens de diseno (colores, radios, fuentes) en `@theme`.
- No agregar estilos por componente aqui — usar Tailwind en el JSX.

---

## `src/types/`

**Que va aqui:** tipos TypeScript compartidos entre modulos.

| Tipo | Proposito |
|------|-----------|
| `ApiError` | Formato estandar de error de API |
| `PaginatedResponse<T>` | Respuestas paginadas |
| `Nullable<T>` | Utilidad generica |

**Reglas:**
- Tipos especificos de un feature van en `features/<name>/types/`.
- Solo tipos realmente compartidos van aqui.

---

## `src/main.tsx`

Punto de entrada: monta React en el DOM e importa estilos globales.
No agregar logica de negocio aqui.

---

## Flujo de decision: donde poner un archivo nuevo

```
¿Es un primitivo visual reutilizable sin logica de negocio?
  → src/components/ui/

¿Es estructura de pagina (header, sidebar, layout)?
  → src/components/layout/

¿Pertenece a una funcionalidad especifica (auth, dashboard, users)?
  → src/features/<feature>/

¿Es una vista completa conectada a una ruta?
  → src/pages/

¿Es un hook usado en toda la app?
  → src/hooks/

¿Es una llamada HTTP o integracion externa?
  → src/services/

¿Es una funcion pura o constante?
  → src/lib/

¿Es un tipo compartido entre modulos?
  → src/types/
```

---

## Ejemplo de importaciones correctas

```tsx
// En una pagina
import { Button, Card } from '@/components/ui'
import { MetricCard, useDashboardMetrics } from '@/features/dashboard'
import { ROUTES } from '@/lib/constants'

// En un componente UI
import { cn } from '@/lib/cn'
import type { ButtonProps } from './Button.types'

// En un hook de feature
import { apiClient } from '@/services/api'
import type { DashboardMetric } from '../types'
```

---

## Mantenimiento

- Revisar periodicamente si componentes en `features/` deberian subir a `components/ui/`.
- Eliminar codigo muerto y exports no usados.
- Mantener barrel exports (`index.ts`) actualizados.
- Documentar features complejos con un README local si es necesario.
