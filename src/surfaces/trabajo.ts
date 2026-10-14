/** Las opciones de TRABAJO · el menú hamburguesa · 2026-10-07
 *
 *  **Decisión humana del 2026-10-07**: separar en el header lo que es de la
 *  persona de lo que es del trabajo. El nombre despliega la información del
 *  usuario —quién es, su rol, su cliente, el tema, cerrar sesión—; un menú
 *  hamburguesa despliega lo que es de administración y de construcción de
 *  dashboards, **con acceso directo a cada pantalla**. Y un acceso rápido para
 *  volver al dashboard.
 *
 *  Reemplaza la sección «IR A» del punto de identidad, que es lo que se decidió
 *  y se dibujó el 2026-09-28 —«todo vive dentro del punto de identidad»—. La
 *  propuesta para que diseño lo lleve al `.pen` está en
 *  `docs/PROPUESTA-2026-10-07-header-usuario-y-trabajo.md`.
 *
 *  **Es un dato y no un render**, igual que los dos registros de pantallas de
 *  los que sale: así una prueba verifica qué se ofrece sin montar nada, y una
 *  pantalla nueva aparece en el menú sin tocarlo.
 */
import { SUPERFICIES } from './superficies'
import type { Superficie } from './superficies'
import { PANTALLAS as DE_ADMIN } from './admin/pantallas'
import { PANTALLAS as DEL_BUILDER } from './builder/pantallas'

export type EntradaDeTrabajo = { ruta: string; nombre: string }

export type GrupoDeTrabajo = {
  superficie: Exclude<Superficie['id'], 'consola'>
  titulo: string
  entradas: readonly EntradaDeTrabajo[]
}

/** **El builder ofrece sólo las pantallas con pestaña** —`enNav`—: las otras
 *  tres viven dentro del editor (el gráfico y la métrica se eligen tocando un
 *  panel) o se abren desde él (la vista previa), y entrar a ellas en frío las
 *  deja sin nada que mostrar. */
const GRUPOS: readonly GrupoDeTrabajo[] = [
  {
    superficie: 'admin',
    titulo: SUPERFICIES.find((s) => s.id === 'admin')?.nombre ?? 'Administración',
    entradas: DE_ADMIN.map((p) => ({ ruta: p.ruta, nombre: p.nombre })),
  },
  {
    superficie: 'builder',
    titulo: 'Construcción de dashboards',
    entradas: DEL_BUILDER.filter((p) => p.enNav).map((p) => ({ ruta: p.ruta, nombre: p.nombre })),
  },
]

/** Lo que el menú ofrece a quien tenga este rol · **vacío para quien no
 *  administra**: las dos superficies piden rol admin, y un acceso que devuelve
 *  403 es peor que uno ausente. Ocultar no es permitir — el permiso lo aplica
 *  el servidor. */
export function gruposDeTrabajo(esAdmin: boolean): readonly GrupoDeTrabajo[] {
  return esAdmin ? GRUPOS : []
}

/** La ruta del dashboard · el acceso rápido «Volver al dashboard». La consola
 *  abre el dashboard activo del usuario, que es el que resuelve el servicio. */
export const RUTA_DEL_DASHBOARD = SUPERFICIES.find((s) => s.id === 'consola')?.ruta ?? '/'
