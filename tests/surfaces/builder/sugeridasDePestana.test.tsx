// @vitest-environment jsdom

/** Las preguntas sugeridas del chat, escritas desde el builder · F5.33, 2026-10-19
 *
 *  El cable las tenía y no había dónde escribirlas, así que el chat de pestaña
 *  arrancaba vacío. Que viajen en el `PUT` lo fija `tests/api/admin.test.tsx`;
 *  acá se prueba que el campo DISPARA con los renglones.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TabInspector } from '@/surfaces/builder/TabInspector'
import { fijarSugerencias } from '@/surfaces/builder/borrador'
import type { TabParaGuardar } from '@/api/admin'

const tab: TabParaGuardar = {
  id: 'tab-1', clave: 'resumen', nombre: 'Resumen', pregunta: '¿Cómo vamos?', orden: 1,
  roles: [], icono: '', sugerencias: [], panels: [],
}

function montar(t: TabParaGuardar = tab) {
  const onSugerencias = vi.fn()
  render(
    <TabInspector
      tab={t} indice={0} total={1} roles={[]} problemas={[]}
      onEditar={vi.fn()} onRoles={vi.fn()} onSugerencias={onSugerencias} onMover={vi.fn()} onQuitar={vi.fn()}
    />,
  )
  return onSugerencias
}

describe('el campo de sugeridas', () => {
  it('escribir DISPARA con una pregunta por renglón', () => {
    const onSugerencias = montar()
    fireEvent.change(screen.getByLabelText('Preguntas sugeridas para el chat'), {
      target: { value: '¿Qué rindió más?\n¿Qué se frenó?' },
    })
    expect(onSugerencias).toHaveBeenCalledWith(['¿Qué rindió más?', '¿Qué se frenó?'])
  })

  it('con más de ocho avisa que así no se guarda', () => {
    montar({ ...tab, sugerencias: Array.from({ length: 9 }, (_, i) => `Pregunta ${String(i)}`) })
    expect(screen.getByText(/Son 9; el chat ofrece hasta 8/)).toBeInTheDocument()
  })

  it('fijarSugerencias cambia sólo esa pestaña', () => {
    const otra = { ...tab, id: 'tab-2', nombre: 'Otra' }
    const r = fijarSugerencias([tab, otra], 1, ['¿Y esto?'])
    expect(r[0]?.sugerencias).toEqual([])
    expect(r[1]?.sugerencias).toEqual(['¿Y esto?'])
  })
})
