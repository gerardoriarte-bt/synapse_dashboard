/** El adaptador del resultado de validación · `adaptarValidacion`
 *
 *  ── POR QUÉ EXISTE ESTE ARCHIVO · UN LAYOUT VÁLIDO NO SE PODÍA PUBLICAR ─────
 *
 *  **El fixture es una captura, no memoria.** Medido el 2026-10-01 contra
 *  `:4010`, validando el borrador `19562d07` del tenant `e65f81ae`:
 *
 *      {"success":true,"data":{"valid":true,"errors":null}}
 *
 *  `errors` llega **`null` cuando no hay ninguno**, no `[]` — es un slice de Go
 *  sin inicializar. El cable declaraba `type: array` y el adaptador, escrito
 *  desde ese yaml, hacía `w.errors.map(...)`: **el camino del ÉXITO reventaba**
 *  con `Cannot read properties of null (reading 'map')`, y la barra de publicar
 *  lo mostraba como «NO SE PUDO VALIDAR», que se lee como «tu composición está
 *  mal» cuando el servicio acababa de decir que está bien.
 *
 *  **Es la cuarta vez que la distinción `null`-contra-vacío cobra acá** —A5, A1,
 *  el historial de publicaciones— y la primera en el camino feliz, que es por
 *  qué sobrevivió: la pantalla se prueba con problemas, porque es el caso que
 *  tiene algo que mostrar.
 *
 *  Y por qué va en un archivo de adaptador y no en la pantalla: las pruebas de
 *  pantalla construyen el tipo a mano, así que la frontera con el cable queda
 *  sin cubrir. Es la misma lección que `publicaciones.test.ts` encabeza.
 */
import { describe, expect, it } from 'vitest'
import { adaptarValidacion } from '@/api/admin'

describe('adaptarValidacion · la frontera con el cable', () => {
  it('`errors: null` es CERO problemas, no una excepción', () => {
    // La captura literal del servicio.
    const r = adaptarValidacion({ valid: true, errors: null })

    expect(r.valido).toBe(true)
    expect(r.problemas).toEqual([])
  })

  it('`errors: []` da lo mismo · el servicio podría mandar cualquiera de los dos', () => {
    expect(adaptarValidacion({ valid: true, errors: [] }).problemas).toEqual([])
  })

  it('con problemas, cada uno dice DÓNDE y POR QUÉ', () => {
    // «Composición inválida» no sirve: la diferencia es entre «arreglá esto» y
    // «buscá cuál de los doce». Por eso se afirman los cuatro campos.
    const r = adaptarValidacion({
      valid: false,
      errors: [
        { tab_id: 't-1', panel_id: 'p-9', field: 'col_span', message: 'colSpan fuera de rango' },
      ],
    })

    expect(r.valido).toBe(false)
    expect(r.problemas).toEqual([
      { tabId: 't-1', panelId: 'p-9', campo: 'col_span', mensaje: 'colSpan fuera de rango' },
    ])
  })

  it('un problema SIN ubicación no se pierde · cae a `null` y a campo vacío', () => {
    // `tab_id`, `panel_id` y `field` son opcionales en el cable: un problema del
    // layout entero no tiene panel. Lo que no puede pasar es que se descarte.
    const r = adaptarValidacion({ valid: false, errors: [{ message: 'el layout no tiene pestañas' }] })

    expect(r.problemas).toEqual([
      { tabId: null, panelId: null, campo: '', mensaje: 'el layout no tiene pestañas' },
    ])
  })
})
