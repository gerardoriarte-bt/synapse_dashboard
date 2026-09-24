// @vitest-environment jsdom

/** El grano que no aplica se APAGA, y con su razón · F1.7 · §PEN:C1
 *
 *  **El hueco que cierra, y cómo apareció.** `periodGrain.test.ts` cubre el
 *  helper —qué grano exige una pestaña— y cita la decisión del 2026-08-19
 *  entera: «la métrica lo declara y **el selector deshabilita** lo que no
 *  aplica, **con la razón visible**». Pero prueba la primera mitad y ninguna
 *  prueba montaba el selector, así que la segunda vivía sin aserción.
 *
 *  Lo encontró una mutación al pasar del riel al desplegable el 2026-09-24:
 *  cambiar `disabled={!usable}` por `disabled={false}` dejó las 18 pruebas en
 *  verde. Un desplegable que ofrece los doce períodos cuando tres granos no se
 *  pueden contestar **se ve exactamente igual** que uno correcto hasta que
 *  alguien elige una semana y la pestaña sale vacía.
 *
 *  Es el mismo modo de falla que el botón muerto: lo que hay que verificar no es
 *  que el grupo exista, es que esté apagado y que diga por qué.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PeriodPicker } from '@/surfaces/console/PeriodPicker'
import type { Metric, Period } from '@/api/types'

const periodo = (id: string, grano: Period['grano']): Period => ({ id, etiqueta: id, grano })

const metrica = (granoMinimo: Metric['granoMinimo']) => ({ granoMinimo }) as Metric

/** Los tres granos presentes, para que el apagado se pueda distinguir del
 *  ausente: un grano que no viene en `periods` no aparece, y eso no es lo que
 *  estas pruebas miran. */
const LOS_TRES = [
  periodo('2026-09', 'mes'),
  periodo('2026-W38', 'semana'),
  periodo('2026-09-23', 'dia'),
]

const montar = (metrics: readonly Metric[]) =>
  render(
    <PeriodPicker periods={LOS_TRES} activeId="2026-09" metrics={metrics} onSelect={vi.fn()} />,
  )

describe('una pestaña MENSUAL apaga semanas y días', () => {
  it('el grupo del grano que no aplica está DESHABILITADO', () => {
    montar([metrica('mes')])

    expect(screen.getByRole('group', { name: /semanas/i })).toBeDisabled()
    expect(screen.getByRole('group', { name: /días/i })).toBeDisabled()
  })

  it('y el que SÍ aplica no lo está · apagar todo es el otro error', () => {
    // La mutación simétrica: `disabled={true}` deja la pantalla sin selector
    // usable, y sin esta aserción se leería como «apaga bien».
    montar([metrica('mes')])
    expect(screen.getByRole('group', { name: /^meses$/i })).toBeEnabled()
  })

  it('el grupo apagado dice POR QUÉ, en su propio rótulo', () => {
    // Un control deshabilitado sin explicación no distingue un permiso de un
    // error de un dato que no existe. La razón nombra el grano que lo obliga.
    montar([metrica('mes')])

    expect(
      screen.getByRole('group', { name: /semanas · no aplica, alguna métrica se mide por mes/i }),
    ).toBeInTheDocument()
  })

  it('y la razón también se lee SIN abrir el desplegable', () => {
    // Adentro sólo se ve al abrirlo. Quien no lo abre no se entera de que hay
    // granos apagados, que es la mitad de la advertencia.
    montar([metrica('mes')])

    expect(
      screen.getByText(/algún grano no aplica · alguna métrica se mide por mes/i),
    ).toBeVisible()
  })
})

describe('el ámbito · no se apaga lo que sí se puede contestar', () => {
  it('con todas las métricas diarias, los tres granos quedan habilitados', () => {
    montar([metrica('dia'), metrica('dia')])

    for (const nombre of [/^meses$/i, /semanas/i, /días/i]) {
      expect(screen.getByRole('group', { name: nombre })).toBeEnabled()
    }
  })

  it('sin granos apagados, la línea de razón NO está', () => {
    // Dejarla siempre la vuelve decoración, que es como se deja de leer una
    // advertencia. Mismo criterio que la línea del período en curso.
    const { container } = montar([metrica('dia')])
    expect(container.textContent).not.toMatch(/algún grano no aplica/i)
  })

  it('la métrica MÁS restrictiva manda · una mensual entre diarias apaga igual', () => {
    // Es la regla de `coarsestRequired` llegando a la pantalla: alcanza una
    // métrica mensual para que la pestaña entera no pueda contestar una semana.
    montar([metrica('dia'), metrica('mes'), metrica('dia')])

    expect(screen.getByRole('group', { name: /semanas/i })).toBeDisabled()
    expect(screen.getByRole('group', { name: /^meses$/i })).toBeEnabled()
  })
})
