/** El borrador de pestañas · F4.8 · las funciones puras
 *
 *  **La que sostiene la tarea es la primera**: `PUT /admin/layouts/{id}` es un
 *  reemplazo completo, así que un borrador que no arrastre roles y paneles hace
 *  que renombrar una pestaña **los borre**, con 200 y sin aviso.
 */
import { describe, expect, it } from 'vitest'
import {
  agregar,
  agregarPanel,
  cambiarTipo,
  editar,
  editarPanel,
  mover,
  problemas,
  quitar,
  quitarPanel,
  sembrar,
  sucio,
} from '@/surfaces/builder/borrador'
import type { LayoutDetalle } from '@/api/admin'

const detalle: LayoutDetalle = {
  layout: { id: 'l-1', tenantId: 't-1', estado: 'borrador', versionId: 'v1', publicadoEn: null },
  tabs: [
    {
      // A propósito fuera de orden: `sembrar` ordena por `orden`, no por el
      // arreglo — confiar en el arreglo es confiar en el servidor.
      tab: { id: 'tab-b', nombre: 'Inventario', pregunta: '¿Hay stock?', orden: 2, roles: ['r-1'] },
      panels: [
        { id: 'p-1', tipo: 'kpi', metricId: 'm-1', colStart: 1, colSpan: 3, rowSpan: 4 },
      ],
    },
    {
      tab: { id: 'tab-a', nombre: 'Resumen', pregunta: '¿Cómo vamos?', orden: 1, roles: [] },
      panels: [
        { id: 'p-2', tipo: 'series', metricId: 'm-2', colStart: 1, colSpan: 6, rowSpan: 4 },
        { id: 'p-3', tipo: 'table', metricId: 'm-3', colStart: 7, colSpan: 6, rowSpan: 4 },
      ],
    },
  ],
}

describe('sembrar · lo que el editor no toca igual viaja', () => {
  it('arrastra roles y paneles', () => {
    // **La trampa.** El PUT borra lo que no venga. Un borrador de tres campos
    // convierte «renombrar» en «vaciar», y el servicio devuelve 200.
    const tabs = sembrar(detalle)
    expect(tabs.map((t) => t.nombre)).toEqual(['Resumen', 'Inventario'])
    expect(tabs[0]?.panels.map((p) => p.id)).toEqual(['p-2', 'p-3'])
    expect(tabs[1]?.roles).toEqual(['r-1'])
  })

  it('sigue arrastrándolos después de editar el nombre', () => {
    const tabs = editar(sembrar(detalle), 1, 'nombre', 'Inventario y reposición')
    expect(tabs[1]?.nombre).toBe('Inventario y reposición')
    expect(tabs[1]?.roles).toEqual(['r-1'])
    expect(tabs[1]?.panels).toHaveLength(1)
  })

  it('copia, no comparte · editar el borrador no muta el detalle', () => {
    const tabs = sembrar(detalle)
    tabs[1]?.roles.push('r-2')
    expect(detalle.tabs[0]?.tab.roles).toEqual(['r-1'])
  })

  it('ordena por `orden` y no por el arreglo', () => {
    expect(sembrar(detalle).map((t) => t.orden)).toEqual([1, 2])
  })
})

describe('agregar · sin `id` es «creá una»', () => {
  it('la nueva NO lleva id', () => {
    // Una pestaña sin `id` en el cuerpo genera una nueva; con un `id` existente
    // conserva el id al reemplazar. Es la diferencia entre editar y duplicar.
    const nueva = agregar(sembrar(detalle)).at(-1)
    expect(nueva?.id).toBeUndefined()
  })

  it('nace inválida, con la pregunta vacía', () => {
    // No es un descuido: el producto dice que una pestaña que no contesta una
    // pregunta no se compone, así que la pantalla tiene que pedirla.
    const nueva = agregar(sembrar(detalle)).at(-1)
    expect(problemas(nueva!)).toHaveLength(1)
  })
})

describe('quitar y mover · el orden se renumera', () => {
  it('quitar no deja huecos en `orden`', () => {
    // `sort_order` en 0 lo reemplaza el servicio por el índice + 1. Dejar 1, 3
    // funcionaría hoy y dependería de un default ajeno.
    const tabs = quitar(sembrar(detalle), 0)
    expect(tabs.map((t) => t.orden)).toEqual([1])
    expect(tabs[0]?.nombre).toBe('Inventario')
  })

  it('mover renumera y conserva el contenido', () => {
    const tabs = mover(sembrar(detalle), 0, 1)
    expect(tabs.map((t) => t.nombre)).toEqual(['Inventario', 'Resumen'])
    expect(tabs.map((t) => t.orden)).toEqual([1, 2])
    expect(tabs[1]?.panels).toHaveLength(2)
  })

  it('mover fuera de rango no REORDENA · hacen falta tres para verlo', () => {
    // **Con dos pestañas esta prueba no demuestra nada, y la mutación lo
    // encontró.** Sin la guarda, `mover(tabs, 0, -1)` hace `splice(0,1)` y
    // después `splice(-1, 0, …)`, que inserta antes del último: con dos
    // elementos eso devuelve el mismo arreglo. Con tres, devuelve [B, A, C].
    const tres = agregar(agregar(sembrar(detalle)))
    const nombres = (xs: { nombre: string }[]) => xs.map((x) => x.nombre)

    expect(nombres(mover(tres, 0, -1))).toEqual(nombres(tres))
    expect(nombres(mover(tres, tres.length - 1, 1))).toEqual(nombres(tres))
    // Y adentro del rango sí mueve, para que la guarda no sea un `return` a secas.
    expect(nombres(mover(tres, 0, 1))[0]).toBe(nombres(tres)[1])
  })
})

describe('problemas · la regla dura', () => {
  it('la pregunta vacía impide componer', () => {
    const tabs = editar(sembrar(detalle), 0, 'pregunta', '')
    expect(problemas(tabs[0]!)[0]).toMatch(/no se compone/)
  })

  it('solo espacios tampoco es una pregunta', () => {
    const tabs = editar(sembrar(detalle), 0, 'pregunta', '   ')
    expect(problemas(tabs[0]!)).toHaveLength(1)
  })

  it('una pestaña completa no tiene problemas', () => {
    expect(problemas(sembrar(detalle)[0]!)).toEqual([])
  })
})

describe('sucio · contra la semilla, no contra las pulsaciones', () => {
  it('escribir y deshacer deja el borrador limpio', () => {
    // Un indicador que dijera «sin guardar» después de escribir una letra y
    // borrarla enseña a ignorarlo.
    const semilla = sembrar(detalle)
    const ida = editar(semilla, 0, 'nombre', 'Resumen ejecutivo')
    const vuelta = editar(ida, 0, 'nombre', 'Resumen')
    expect(sucio(ida, semilla)).toBe(true)
    expect(sucio(vuelta, semilla)).toBe(false)
  })
})

describe('paneles · F4.10', () => {
  it('el panel nuevo NO lleva id y nace sin métrica', () => {
    // Sin `id` el servicio lo crea. Sin `metricId` no se ancla a nada, y §4 dice
    // que un panel se ancla a un metricId: la pantalla tiene que pedirlo.
    const tabs = agregarPanel(sembrar(detalle), 0, 'kpi', 3, 4)
    const nuevo = tabs[0]?.panels.at(-1)
    expect(nuevo?.id).toBeUndefined()
    expect(nuevo?.metricId).toBe('')
  })

  it('nace con los MÍNIMOS del tipo, no con un default inventado', () => {
    // `col_span` en 0 lo reemplaza el servicio por 3, y 3 puede estar fuera del
    // rango del tipo. El mínimo del bloque es el único número afirmable.
    const nuevo = agregarPanel(sembrar(detalle), 0, 'gauge', 4, 5)[0]?.panels.at(-1)
    expect(nuevo?.colSpan).toBe(4)
    expect(nuevo?.rowSpan).toBe(5)
  })

  it('agregar a una pestaña no toca las otras', () => {
    const tabs = agregarPanel(sembrar(detalle), 0, 'kpi', 3, 4)
    expect(tabs[1]?.panels).toHaveLength(1)
  })

  it('quitar saca solo ese panel', () => {
    const tabs = quitarPanel(sembrar(detalle), 0, 0)
    expect(tabs[0]?.panels.map((p) => p.id)).toEqual(['p-3'])
  })

  it('editar la métrica conserva el id del panel', () => {
    // Perderlo convertiría «editar» en «borrar y crear», que es la misma trampa
    // que con las pestañas y acá se ve menos.
    const tabs = editarPanel(sembrar(detalle), 0, 0, { metricId: 'm-9' })
    expect(tabs[0]?.panels[0]?.id).toBe('p-2')
    expect(tabs[0]?.panels[0]?.metricId).toBe('m-9')
  })
})

describe('cambiarTipo · recorta los spans y BORRA las opciones', () => {
  const conOpciones = editarPanel(sembrar(detalle), 0, 0, {
    colSpan: 12,
    rowSpan: 9,
    opciones: { maximo: 100 },
  })

  it('recorta al rango del tipo nuevo', () => {
    const tabs = cambiarTipo(conOpciones, 0, 0, 'kpi', 3, 4, 3, 4)
    expect(tabs[0]?.panels[0]?.colSpan).toBe(4)
    expect(tabs[0]?.panels[0]?.rowSpan).toBe(4)
  })

  it('sube al mínimo cuando el span era más chico', () => {
    const chico = editarPanel(sembrar(detalle), 0, 0, { colSpan: 1, rowSpan: 1 })
    const tabs = cambiarTipo(chico, 0, 0, 'table', 6, 12, 4, 10)
    expect(tabs[0]?.panels[0]?.colSpan).toBe(6)
    expect(tabs[0]?.panels[0]?.rowSpan).toBe(4)
  })

  it('BORRA las opciones · son por tipo', () => {
    // `maximo` es de `gauge`. Conservarlo al pasar a `kpi` deja en el cuerpo del
    // PUT un param que el tipo nuevo no lee: `validateParams` lo descartaría al
    // leerlo de vuelta, pero entre medio se guarda y se publica basura.
    const tabs = cambiarTipo(conOpciones, 0, 0, 'kpi', 3, 4, 3, 4)
    expect(tabs[0]?.panels[0]?.opciones).toBeUndefined()
  })

  it('conserva id y métrica', () => {
    const tabs = cambiarTipo(conOpciones, 0, 0, 'kpi', 3, 4, 3, 4)
    expect(tabs[0]?.panels[0]?.id).toBe('p-2')
    expect(tabs[0]?.panels[0]?.metricId).toBe('m-2')
  })
})
