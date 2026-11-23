// @vitest-environment jsdom

/** Un panel no desborda su celda · 2026-11-23.
 *
 *  Visto en QA con datos reales: la prosa de «Decisions» (12 × 4) pintaba su
 *  última recomendación por debajo de la tarjeta, con «HIGHER = BETTER» y
 *  «PREGUNTAR» encima del texto; y el KPI degradado de un mes cerrado dejaba
 *  «VS MES ANTERIOR» fuera. La altura es `96·N − 16` y no se toca, así que lo
 *  que no entra scrollea DENTRO del cuerpo.
 *
 *  **jsdom no hace layout**, así que lo que se puede afirmar es la estructura
 *  que lo garantiza en el navegador: el cuerpo vive en un contenedor que puede
 *  achicarse (`min-h-0`) y que contiene lo que sobra (`overflow-auto`), y el pie
 *  y la limitación del degradado quedan FUERA de ese contenedor —si quedaran
 *  adentro, se irían con la rueda—. Que se vea bien se miró en `dev:mock`.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel } from '@/render/Panel/Panel'
import { ProseBody } from '@/render/bodies/ProseBody'
import { KpiBody } from '@/render/bodies/KpiBody'
import { createFormat } from '@/render/format'
import type { Metric, Payload, Value } from '@/api/types'

const format = createFormat('es-MX')
const now = new Date('2026-11-23T12:00:00Z')

const metric = {
  id: 'm-1',
  key: 'decisions',
  nombre: 'Decisions',
  forma: 'prosa',
  familia: 'cliente',
  capa: 'GOLD',
  fuente: 'Snowflake',
  ventana: 'Mes',
  base: 'Mes cerrado',
  estado: 'DISPONIBLE',
  direccionSemantica: 'HIGHER = BETTER',
  catalogVersion: 1,
} as Metric

/** Una prosa que no entra en 12 × 4: la de QA tenía cinco recomendaciones. */
const larga = {
  forma: 'prosa',
  titular: 'Reasignar inversión. '.repeat(60),
  pilares: [1, 2, 3].map((i) => ({
    label: `Recomendación ${String(i)}`,
    valor: 'Mover presupuesto. '.repeat(20),
  })),
} as unknown as Extract<Value, { forma: 'prosa' }>

const conCifra = (valor: Value, estado: 'DISPONIBLE' | 'DEGRADADO' = 'DISPONIBLE') =>
  ({
    estado,
    valor,
    base: 'Mes cerrado',
    capa: 'GOLD',
    fuente: 'Snowflake',
    frescura: '2026-11-23T08:00:00Z',
    catalogVersion: 1,
    ...(estado === 'DEGRADADO'
      ? { razon: 'El mes está cerrado y su cifra puede cambiar', desbloqueaCon: 'La recarga del mes' }
      : {}),
  }) as unknown as Payload

function slotDe(texto: string): HTMLElement {
  const slot = screen.getAllByText(texto, { exact: false })[0]!.closest<HTMLElement>('[data-slot="cuerpo"]')
  expect(slot, 'el cuerpo no está dentro del slot del shell').not.toBeNull()
  return slot!
}

describe('el cuerpo contiene lo que no entra · el pie no se tapa', () => {
  it('la prosa larga vive en un slot que se achica y scrollea', () => {
    const span = { colStart: 1, colSpan: 12, rowSpan: 4 }
    render(
      <Panel metric={metric} payload={conCifra(larga)} placement={span} format={format} now={now} onChat={() => undefined}>
        <ProseBody value={larga} params={{}} span={span} family="cliente" format={format} metric="Decisions" />
      </Panel>,
    )
    const slot = slotDe('Reasignar inversión.')
    expect(slot.className.split(' ')).toEqual(expect.arrayContaining(['flex-1', 'min-h-0', 'overflow-auto']))

    // El pie es hermano del slot, no hijo: queda fijo abajo mientras el cuerpo
    // scrollea. «HIGHER = BETTER» y «Preguntar» eran lo que tapaba el texto.
    const pie = screen.getByRole('button', { name: /Preguntar sobre Decisions/ }).closest('footer')
    expect(pie).not.toBeNull()
    expect(slot.contains(pie)).toBe(false)
    expect(slot.contains(screen.getByText('HIGHER = BETTER'))).toBe(false)
    expect(slot.parentElement).toBe(pie!.parentElement)
  })

  it('el KPI degradado: la limitación queda a la vista, la cifra y el comparativo en el slot', () => {
    const span = { colStart: 1, colSpan: 3, rowSpan: 3 }
    const escalar = { forma: 'escalar', v: 4280000 } as Extract<Value, { forma: 'escalar' }>
    render(
      <Panel
        metric={{ ...metric, nombre: 'Ingresos', forma: 'escalar' } as Metric}
        payload={conCifra(escalar, 'DEGRADADO')}
        placement={span}
        format={format}
        now={now}
      >
        <KpiBody
          value={escalar}
          params={{}}
          span={span}
          family="cliente"
          format={format}
          metric="Ingresos"
          presentation={{
            label: 'USD · Total',
            medidor: { label: 'Meta', porcentaje: 61 },
            comparativo: [{ label: 'vs mes anterior', delta: 59.7 }],
          }}
        />
      </Panel>,
    )
    const slot = slotDe('vs mes anterior')
    expect(slot.className.split(' ')).toEqual(expect.arrayContaining(['min-h-0', 'overflow-auto']))
    // §8: la razón se declara, y una razón que se va con la rueda no se declara.
    expect(slot.contains(screen.getByText(/Qué lo desbloquea/))).toBe(false)
  })
})
