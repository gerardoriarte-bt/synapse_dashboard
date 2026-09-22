// @vitest-environment jsdom

/** El desglose de composición por rol · A2 §9 · §PEN:A2
 *
 *  El `.pen` dibuja `ROLES Y COMPOSICIÓN` con una tarjeta por rol: cuántos
 *  paneles ve, en cuántas pestañas, y una fila por pestaña con su pregunta
 *  operativa. Estas pruebas fijan las tres cosas que ese desglose puede decir
 *  mal **viéndose bien**.
 */
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RoleCard } from '@/surfaces/admin/RoleCard'
import type { PestanaDeRol } from '@/surfaces/admin/RoleCard'
import type { Rol } from '@/api/admin'

const PESTANAS: PestanaDeRol[] = [
  { id: 't1', nombre: 'eCommerce Overview', pregunta: '¿Cómo va el negocio?', paneles: 12 },
  { id: 't2', nombre: 'Brand Momentum', pregunta: '¿La marca crece o solo pauta?', paneles: 4 },
  { id: 't3', nombre: 'Product Sales', pregunta: '¿Qué producto empuja?', paneles: 4 },
  { id: 't4', nombre: 'Inventory & Shopping', pregunta: '¿Qué frena la venta?', paneles: 8 },
]

/** El fixture se escribe desde el tipo, no de memoria: `Rol` pide los siete
 *  campos y `tenantId` y `overrides` **no son opcionales** —lo dijo `typecheck`
 *  después de que vitest pasara en verde, que es el hueco que las pruebas solas
 *  no tapan—. El parche excluye esos dos porque ninguna prueba los varía. */
const rol = (parche: Partial<Omit<Rol, 'tenantId' | 'overrides'>> = {}): Rol => ({
  id: 'r1',
  tenantId: 'tn1',
  nombre: 'CEO',
  pestanas: [],
  metricasOcultas: [],
  overrides: {},
  usuarios: 0,
  ...parche,
})

const montar = (r: Rol, props: Partial<Parameters<typeof RoleCard>[0]> = {}) =>
  render(
    <RoleCard
      rol={r}
      pestanas={PESTANAS}
      nombreDeMetrica={(id) => ({ m1: 'Inversión', m2: 'Retorno por plataforma' })[id] ?? id}
      onEditar={() => {}}
      onBorrar={() => {}}
      {...props}
    />,
  )

describe('vacío significa TODAS, y acá es aritmética', () => {
  it('un rol sin pestañas elegidas suma los paneles de TODAS', () => {
    // **Es la aserción que sostiene la regla.** `pestanas: []` es «ve todas», y
    // un desglose que lo leyera como «ninguna» pintaría «0 paneles · 0
    // pestañas» — se vería perfecto y diría lo contrario de lo que pasa.
    const { container } = montar(rol({ pestanas: [] }))

    expect(container.textContent).toContain('28')
    expect(screen.getByText('Paneles · 4 pestaña(s)')).toBeInTheDocument()
    expect(screen.getByText('eCommerce Overview')).toBeInTheDocument()
    expect(screen.getByText('Inventory & Shopping')).toBeInTheDocument()
  })

  it('y lo dice, además de contarlo', () => {
    montar(rol({ pestanas: [] }))
    expect(screen.getByText(/Ve TODAS las pestañas/)).toBeInTheDocument()
  })

  it('un rol acotado suma SOLO las suyas', () => {
    const { container } = montar(rol({ nombre: 'Planner', pestanas: ['t3', 't4'] }))

    expect(container.textContent).toContain('12')
    expect(screen.getByText('Paneles · 2 pestaña(s)')).toBeInTheDocument()
    // Y las que no le tocan no se listan: el desglose es de lo que VE.
    expect(screen.queryByText('eCommerce Overview')).toBeNull()
    expect(screen.queryByText(/Ve TODAS las pestañas/)).toBeNull()
  })
})

describe('la pregunta operativa, que es lo que vuelve legible el nombre', () => {
  it('cada pestaña va con la suya', () => {
    montar(rol({ pestanas: ['t1'] }))
    expect(screen.getByText('eCommerce Overview')).toBeInTheDocument()
    expect(screen.getByText('¿Cómo va el negocio?')).toBeInTheDocument()
    expect(screen.getByText('12 paneles')).toBeInTheDocument()
  })
})

describe('lo que el cable no manda no se inventa', () => {
  it('no dice nada de heredados ni de plantilla', () => {
    // El `.pen` dibuja «11 HEREDADOS» por pestaña y «11 HEREDADOS DE PLANTILLA»
    // en el resumen. No hay noción de plantilla en el cable. **Esta prueba
    // atestigua la ausencia**: borrarla el día que alguien invente el número no
    // avisaría nada.
    const { container } = montar(rol({ pestanas: [] }))
    expect(container.textContent).not.toMatch(/heredad|plantilla/i)
  })

  it('no inventa una descripción del rol', () => {
    // El `.pen` la dibuja bajo el nombre —«Ve el negocio completo, incluida la
    // inversión de medios.»— y el cable no la trae.
    const { container } = montar(rol())
    expect(container.textContent).not.toMatch(/Ve el negocio completo/)
  })
})

describe('las métricas que un rol no recibe', () => {
  it('se nombran, y la nota dura va con ellas', () => {
    montar(rol({ metricasOcultas: ['m1', 'm2'] }))

    expect(screen.getByText('No recibe · 2 métrica(s)')).toBeInTheDocument()
    expect(screen.getByText('Inversión')).toBeInTheDocument()
    expect(screen.getByText('Retorno por plataforma')).toBeInTheDocument()
    // §3.3, literal del `.pen`: es una regla, no un dato.
    expect(screen.getByText(/ocultar no es permitir/i)).toBeInTheDocument()
  })

  it('sin métricas ocultas el bloque no está', () => {
    const { container } = montar(rol({ metricasOcultas: [] }))
    expect(container.textContent).not.toMatch(/No recibe/)
  })

  it('el enlace al catálogo DISPARA · no alcanza con que exista', () => {
    // La regla del spread condicional: `onVerCatalogo` viaja por
    // `{...(x === undefined ? {} : { x })}` y una prop mal nombrada compila.
    // Un botón muerto se ve igual que uno que funciona.
    const ir = vi.fn()
    montar(rol({ metricasOcultas: ['m1'] }), { onVerCatalogo: ir })

    screen.getByRole('button', { name: /ver en el catálogo/i }).click()
    expect(ir).toHaveBeenCalledTimes(1)
  })

  it('sin manejador el enlace NO se pinta', () => {
    montar(rol({ metricasOcultas: ['m1'] }))
    expect(screen.queryByRole('button', { name: /ver en el catálogo/i })).toBeNull()
  })
})

describe('borrar sigue dependiendo de los usuarios', () => {
  it('con usuarios asignados no hay botón, y se dice por qué', () => {
    const { container } = montar(rol({ usuarios: 3 }))
    expect(screen.queryByRole('button', { name: /borrar/i })).toBeNull()
    expect(container.textContent).toMatch(/reasignalos primero/)
  })

  it('sin usuarios el botón DISPARA', () => {
    const borrar = vi.fn()
    montar(rol({ usuarios: 0 }), { onBorrar: borrar })
    screen.getByRole('button', { name: 'Borrar CEO' }).click()
    expect(borrar).toHaveBeenCalledTimes(1)
  })
})

describe('el resumen de la cabecera · en RoleEditor', () => {
  it('la cifra grande lleva su rótulo pegado · ningún número desnudo', () => {
    const { container } = montar(rol({ pestanas: ['t1'] }))
    const cifra = within(container).getByText('12')
    // El rótulo es el hermano inmediato, que es lo que el `.pen` dibuja: la
    // cifra arriba y «PANELES · N PESTAÑAS» debajo.
    expect(cifra.parentElement?.textContent).toContain('Paneles')
  })
})
