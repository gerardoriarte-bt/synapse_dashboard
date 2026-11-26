import { lazy, Suspense } from 'react'
import { SurfaceMessage } from '../../surfaces/console/SurfaceMessage'

/** ── ADMINISTRACIÓN Y BUILDER SE BAJAN APARTE · 2026-11-26 ──────────────────
 *
 *  Mejora #1 de `docs/AUDITORIA-2026-11-25-calidad-de-codigo.md`: importadas
 *  arriba, las dos superficies de plataforma viajaban en el chunk principal y
 *  todo usuario de consola bajaba unos 200 KB de código que no usa. Medido con
 *  `npm run build` sobre `aa330ea` el 2026-11-26: el chunk principal pasó de
 *  666,17 KB (191,02 KB gzip) a 455,93 KB (138,06 KB gzip), con `Admin`
 *  (114,29 KB) y `Builder` (87,05 KB) en chunks propios.
 *
 *  Los módulos exportan con nombre y `lazy()` pide un `default`: por eso el
 *  `.then`. **La consola y el login no se difieren**: son la primera pantalla
 *  de casi todos, y diferirlas sólo agrega un viaje antes de pintar.
 *
 *  **Vive acá y no en `routes.tsx`** porque un archivo que exporta la tabla de
 *  rutas y además declara componentes rompe el refresco en caliente de Vite —
 *  lo marca `only-export-components` en el lint—.
 */
const Admin = lazy(() => import('../../surfaces/admin/Admin').then((m) => ({ default: m.Admin })))
const Builder = lazy(() =>
  import('../../surfaces/builder/Builder').then((m) => ({ default: m.Builder })),
)

const SUPERFICIES = {
  admin: { nombre: 'Administración', Componente: Admin },
  builder: { nombre: 'Builder', Componente: Builder },
} as const

/** Una superficie diferida, con lo que se pinta mientras llega su chunk.
 *
 *  **Es el mismo mensaje de superficie que pinta `AuthGuard` mientras verifica
 *  la sesión**: la carga del código reemplaza la pantalla entera igual que
 *  aquella, así que no es un estado de panel —no hay métrica ni BASE que
 *  nombrar—. Si la descarga falla, el `ErrorBoundary` de `App` la recibe como
 *  cualquier otro error de render.
 *
 *  Un solo componente con la superficie por prop, y no uno por superficie:
 *  §4 regla 3 pide un componente por archivo. */
export function SuperficieDiferida({ superficie }: { superficie: keyof typeof SUPERFICIES }) {
  const { nombre, Componente } = SUPERFICIES[superficie]
  return (
    <Suspense fallback={<SurfaceMessage title={`Cargando ${nombre}`} detail="Synapse" />}>
      <Componente />
    </Suspense>
  )
}
