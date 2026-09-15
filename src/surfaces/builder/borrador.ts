/** El borrador de pestañas · F4.8
 *
 *  Funciones puras sobre `TabParaGuardar[]`, que es **exactamente lo que el PUT
 *  toma**. Que el borrador tenga la forma del cuerpo y no una intermedia es la
 *  decisión que sostiene todo lo demás: no hay una segunda traducción donde
 *  perder un campo.
 *
 *  ── LA TRAMPA, Y POR QUÉ ESTE ARCHIVO EXISTE ────────────────────────────────
 *
 *  **`PUT /admin/layouts/{id}` es un REEMPLAZO COMPLETO**: se manda el layout
 *  entero y lo que no venga **se borra**. Un editor que solo conoce nombre,
 *  pregunta y orden —que es lo que §7.2 le pide a F4.8— produciría un cuerpo sin
 *  `role_ids` y sin `panels`, y **renombrar una pestaña borraría sus paneles y
 *  su asignación de roles**. Sin error, sin aviso: el PUT devuelve 200.
 *
 *  Por eso el borrador **arrastra los campos que no edita**. `sembrar` los copia
 *  del detalle y ninguna de las funciones de edición los toca.
 *
 *  **Y la segunda mitad de la trampa es `id`.** Una pestaña sin `id` en el cuerpo
 *  **genera una nueva** en vez de editar la existente — la diferencia entre
 *  editar y duplicar, que el servicio no avisa. Así que acá `id` ausente no
 *  significa «no sé»: significa «creá una», y solo `agregar` lo produce.
 */
import type { LayoutDetalle, TabParaGuardar } from '../../api/admin'

/** Del detalle al borrador, arrastrando lo que el editor no toca. */
export function sembrar(detalle: LayoutDetalle): TabParaGuardar[] {
  return [...detalle.tabs]
    .sort((a, b) => a.tab.orden - b.tab.orden)
    .map(({ tab, panels }) => ({
      id: tab.id,
      nombre: tab.nombre,
      pregunta: tab.pregunta,
      orden: tab.orden,
      // Los dos que el editor no muestra y el PUT borraría.
      roles: [...tab.roles],
      panels: panels.map((p) => ({
        id: p.id,
        metricId: p.metricId,
        tipo: p.tipo,
        colStart: p.colStart,
        colSpan: p.colSpan,
        rowSpan: p.rowSpan,
        ...(p.opciones === undefined ? {} : { opciones: p.opciones }),
      })),
    }))
}

type Editable = 'nombre' | 'pregunta'

export function editar(
  tabs: readonly TabParaGuardar[],
  indice: number,
  campo: Editable,
  valor: string,
): TabParaGuardar[] {
  return tabs.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t))
}

/** **Sin `id`, a propósito.** Es lo que le dice al servicio que la cree.
 *
 *  Y nace con la pregunta vacía, que es lo que la deja inválida desde el primer
 *  render: el producto dice que una pestaña que no contesta una pregunta no se
 *  compone, así que la pantalla tiene que pedirla, no aceptarla en blanco. */
export function agregar(tabs: readonly TabParaGuardar[]): TabParaGuardar[] {
  return [
    ...tabs,
    { nombre: 'Pestaña nueva', pregunta: '', orden: tabs.length + 1, roles: [], panels: [] },
  ]
}

/** **Quitar renumera.** El `sort_order` que llegue en 0 lo reemplaza el servicio
 *  por el índice del arreglo + 1, así que dejar un hueco —1, 3, 4— funcionaría
 *  hoy y dependería de un default ajeno. Se renumera acá, que es donde se ve. */
export function quitar(tabs: readonly TabParaGuardar[], indice: number): TabParaGuardar[] {
  return tabs.filter((_, i) => i !== indice).map((t, i) => ({ ...t, orden: i + 1 }))
}

/** Mover una posición. `direccion` es −1 arriba, +1 abajo. Fuera de rango no
 *  hace nada: un botón deshabilitado y una función que no se defiende es cómo se
 *  pierde el primer elemento. */
export function mover(
  tabs: readonly TabParaGuardar[],
  indice: number,
  direccion: -1 | 1,
): TabParaGuardar[] {
  const destino = indice + direccion
  if (destino < 0 || destino >= tabs.length) return [...tabs]
  const copia = [...tabs]
  const [movida] = copia.splice(indice, 1)
  copia.splice(destino, 0, movida as TabParaGuardar)
  return copia.map((t, i) => ({ ...t, orden: i + 1 }))
}

/** Lo que impide componer, por pestaña. Vacío = se puede componer.
 *
 *  **La pregunta operativa es la regla dura**, no una validación de formulario:
 *  §7.2 y el contrato la escriben igual —«una pestaña que no contesta una
 *  pregunta no se compone»— y el cable la deja pasar como cadena vacía. La
 *  diferencia entre el backend y el producto se sostiene acá. */
export function problemas(tab: TabParaGuardar): string[] {
  const lista: string[] = []
  if (tab.nombre.trim() === '') lista.push('Sin nombre')
  if (tab.pregunta.trim() === '')
    lista.push('Sin pregunta operativa · una pestaña que no contesta una pregunta no se compone')
  return lista
}

/** ¿Cambió algo respecto del servidor? Compara contra la semilla, no contra un
 *  contador de pulsaciones: escribir una letra y borrarla deja el borrador
 *  limpio, y un indicador que dijera «sin guardar» ahí enseñaría a ignorarlo. */
export function sucio(actual: readonly TabParaGuardar[], semilla: readonly TabParaGuardar[]): boolean {
  return JSON.stringify(actual) !== JSON.stringify(semilla)
}
