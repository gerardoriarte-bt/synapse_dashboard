// @vitest-environment jsdom

/** Los cuerpos · F1.13g.
 *
 *  Una prueba por regla que el cuerpo sostiene, no una por componente. Lo que se
 *  verifica son las reglas duras y los defectos que v2 encontró **en el render**,
 *  que son los que ninguna prueba veía.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BarsBody } from '@/render/bodies/BarsBody'
import { BlockedBody } from '@/render/bodies/BlockedBody'
import { DistributionBody } from '@/render/bodies/DistributionBody'
import { ForecastBody } from '@/render/bodies/ForecastBody'
import { ProseBody } from '@/render/bodies/ProseBody'
import { RecoBody } from '@/render/bodies/RecoBody'
import { SeriesBody } from '@/render/bodies/SeriesBody'
import { GaugeBody } from '@/render/bodies/GaugeBody'
import { ListBody } from '@/render/bodies/ListBody'
import { CompositionBody } from '@/render/bodies/CompositionBody'
import { TableBody } from '@/render/bodies/TableBody'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const base = { span: { colStart: 1, colSpan: 5, rowSpan: 4 }, family: 'inventario', format } as const

describe('ListBody · un ranking ya viene rankeado', () => {
  /** El defecto que v2 encontró EN EL RENDER: ordenar por `v` invierte la lista
   *  en cuanto la métrica es «más bajo = más urgente» —la reposición
   *  prioritaria se mide en días de cobertura— y mostraba el menos urgente
   *  primero, con el número 4 al lado. */
  const value = {
    forma: 'ranking',
    items: [
      { etiqueta: 'Urgente', v: 2, posicion: 1 },
      { etiqueta: 'Media', v: 9, posicion: 2 },
      { etiqueta: 'Baja', v: 30, posicion: 3 },
    ],
  } as unknown as Extract<Value, { forma: 'ranking' }>

  it('respeta `posicion` por defecto, no el valor', () => {
    render(<ListBody {...base} value={value} params={{}} metric="Días de cobertura" />)
    const filas = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(filas[0]).toContain('Urgente')
    expect(filas[2]).toContain('Baja')
  })

  it('la posición que se pinta es la del dato, no el índice de la fila', () => {
    render(
      <ListBody {...base} value={value} params={{ tope: 2, orden: 'desc' }} metric="Cobertura" />,
    )
    // Con `orden: desc` la primera fila es «Baja», y su número tiene que seguir
    // siendo el 3: pintar el índice diría 1 y mentiría sobre el ranking.
    expect(screen.getAllByRole('listitem')[0]?.textContent).toContain('3')
  })

  it('el label del lector es la MÉTRICA, no la etiqueta de la fila', () => {
    // Repetir la etiqueta decía «Nike Air, Nike Air» y nunca el número.
    render(<ListBody {...base} value={value} params={{ tope: 1 }} metric="Días de cobertura" />)
    expect(screen.getByText('Días de cobertura')).toBeInTheDocument()
  })
})

describe('CompositionBody · la rampa tiene cinco escalones', () => {
  const parts = Array.from({ length: 9 }, (_, i) => ({
    etiqueta: `Parte ${i + 1}`,
    v: 10 - i,
    porcentaje: 100 / 9,
  }))
  const value = { forma: 'composicion', partes: parts } as unknown as Extract<
    Value,
    { forma: 'composicion' }
  >

  it('agrupa en «Otros» a partir de la quinta parte', () => {
    // No es estética: una sexta parte repetiría un escalón y dos partes
    // distintas se verían iguales.
    render(<CompositionBody {...base} value={value} params={{}} metric="Mix" />)
    expect(screen.getByText(/5 partes agrupadas/)).toBeInTheDocument()
  })

  it('con cinco o menos no agrupa nada', () => {
    const pocas = { forma: 'composicion', partes: parts.slice(0, 4) } as unknown as typeof value
    render(<CompositionBody {...base} value={pocas} params={{}} metric="Mix" />)
    expect(screen.queryByText(/partes agrupadas/)).toBeNull()
  })
})

describe('ForecastBody · regla dura 6, sin banda no se publica', () => {
  it('con `escalarConIntervalo` el intervalo va en texto, pero va', () => {
    const value = {
      forma: 'escalarConIntervalo',
      v: 4280000,
      lo: 4100000,
      hi: 4460000,
      nivel: 0.9,
    } as unknown as Extract<Value, { forma: 'escalarConIntervalo' }>

    render(<ForecastBody {...base} value={value} params={{}} metric="Ventas" unit="USD" />)
    expect(screen.getByText(/Intervalo 90%/)).toBeInTheDocument()
  })

  it('los extremos del intervalo NO se abrevian', () => {
    // «4.2M – 4.3M» esconde cuánto mide el intervalo, que es justo lo que el
    // intervalo comunica.
    const value = {
      forma: 'escalarConIntervalo',
      v: 4280000,
      lo: 4100000,
      hi: 4460000,
      nivel: 0.9,
    } as unknown as Extract<Value, { forma: 'escalarConIntervalo' }>

    render(<ForecastBody {...base} value={value} params={{}} metric="Ventas" />)
    const texto = screen.getByText(/Intervalo 90%/).textContent ?? ''
    expect(texto).toContain('4,100,000')
    expect(texto).toContain('4,460,000')
  })
})

describe('GaugeBody · un medidor sin máximo no es un medidor', () => {
  const value = { forma: 'escalar', v: 72 } as unknown as Extract<Value, { forma: 'escalar' }>

  it('sin `maximo` lo dice y no dibuja el arco', () => {
    // Lo que falta es la BASE, y §1.3 no deja inventarla: 72 sobre qué.
    const { container } = render(<GaugeBody {...base} value={value} params={{}} metric="Avance" />)
    expect(screen.getByText(/Sin máximo declarado/)).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('con `maximo` en cero tampoco divide', () => {
    render(<GaugeBody {...base} value={value} params={{ maximo: 0 }} metric="Avance" />)
    expect(screen.getByText(/Sin máximo declarado/)).toBeInTheDocument()
  })
})

describe('TableBody · la columna se formatea entera, no celda por celda', () => {
  const value = {
    forma: 'tabular',
    columnas: [
      { clave: 'canal', titulo: 'Canal', numerica: false },
      { clave: 'roas', titulo: 'ROAS', numerica: true },
    ],
    filas: [
      { canal: 'Search', roas: 4.2 },
      { canal: 'Social', roas: 3 },
    ],
  } as unknown as Extract<Value, { forma: 'tabular' }>

  it('una columna con decimales los conserva en TODAS las celdas', () => {
    // Sin esto la columna sale «4.2 · 3»: el punto deja de alinearse y la
    // columna se lee mal aunque cada celda esté bien.
    render(<TableBody {...base} value={value} params={{}} metric="ROAS" />)
    expect(screen.getByText('4.2')).toBeInTheDocument()
    expect(screen.getByText('3.0')).toBeInTheDocument()
  })

  it('el encabezado lleva scope y la celda no repite su nombre', () => {
    render(<TableBody {...base} value={value} params={{}} metric="ROAS" />)
    // La celda hereda el nombre de la columna: un label propio la haría decir
    // el nombre dos veces.
    expect(screen.getByText('ROAS').closest('th')?.getAttribute('scope')).toBe('col')
    expect(screen.getAllByText('ROAS')).toHaveLength(1)
  })

  it('no muta el arreglo del payload al ordenar', () => {
    // El payload vive en la cache de TanStack Query: ordenarlo en el lugar
    // cambia lo que ve el próximo lector de esa entrada.
    const original = [...value.filas]
    render(
      <TableBody
        {...base}
        value={value}
        params={{ orden: { columna: 'roas', direccion: 'desc' } }}
        metric="ROAS"
      />,
    )
    expect(value.filas).toEqual(original)
  })
})

/* ── Los seis que faltaban · F5.5, 2026-09-04 ──────────────────────────────
 *
 *  La auditoría de Fase 5 encontró que seis de los doce cuerpos no tenían una
 *  sola prueba. Van desde la regla que cada uno sostiene: los tres que dibujan
 *  un plot se verifican por lo que le PASAN al plot —ordenar, recortar,
 *  normalizar— porque el SVG en jsdom no tiene tamaño y no dibuja nada.
 */

describe('BarsBody · el orden y el tope son del panel, no del dato', () => {
  const value = {
    forma: 'categorica',
    items: [
      { etiqueta: 'Media', v: 50 },
      { etiqueta: 'Alta', v: 90 },
      { etiqueta: 'Baja', v: 10 },
    ],
  } as unknown as Extract<Value, { forma: 'categorica' }>

  it('NO muta el arreglo del payload al ordenar', () => {
    // El payload vive en la cache de TanStack Query: ordenarlo en el lugar
    // cambia lo que ve el próximo lector de esa entrada. Es el mismo defecto
    // que TableBody ya tenía cubierto.
    const original = [...value.items]
    render(<BarsBody {...base} value={value} params={{ orden: 'asc' }} metric="Cobertura" />)
    expect(value.items).toEqual(original)
  })

  it('con `orden: natural` respeta el orden del backend', () => {
    // Un backend que ya ordenó por criterio de negocio no se puede reordenar
    // por magnitud: es el defecto que ListBody encontró en v2.
    //
    // Se compara el ORDEN de las etiquetas, no su presencia: las tres están en
    // los tres casos. Y en mayúsculas, que es como el plot las escribe.
    const orden = (params: { orden: 'natural' | 'desc' }) => {
      const { container, unmount } = render(
        <BarsBody {...base} value={value} params={params} metric="Cobertura" />,
      )
      const texto = container.textContent ?? ''
      const posiciones = ['MEDIA', 'ALTA', 'BAJA'].map((e) => [e, texto.indexOf(e)] as const)
      unmount()
      return posiciones.sort((a, b) => a[1] - b[1]).map(([e]) => e)
    }

    expect(orden({ orden: 'natural' })).toEqual(['MEDIA', 'ALTA', 'BAJA'])
    // Y con el defecto sí reordena, que es lo que prueba que `natural` hace algo.
    expect(orden({ orden: 'desc' })).toEqual(['ALTA', 'MEDIA', 'BAJA'])
  })

  it('el `tope` recorta DESPUÉS de ordenar, no antes', () => {
    // Recortar antes daría «las tres primeras del arreglo» en vez de «las tres
    // más grandes», que es lo que un tope significa.
    const cuatro = {
      forma: 'categorica',
      items: [
        { etiqueta: 'D', v: 1 },
        { etiqueta: 'A', v: 100 },
        { etiqueta: 'B', v: 80 },
        { etiqueta: 'C', v: 60 },
      ],
    } as unknown as Extract<Value, { forma: 'categorica' }>
    const { container } = render(
      <BarsBody {...base} value={cuatro} params={{ tope: 2 }} metric="Ventas" />,
    )
    expect(container.textContent).toContain('A')
    expect(container.textContent).not.toContain('D')
  })
})

describe('SeriesBody · base 100 y el primer punto en cero', () => {
  const serie = (puntos: number[]) =>
    ({
      forma: 'serieTemporal',
      puntos: puntos.map((v, i) => ({ t: `2026-0${i + 1}`, v })),
    }) as unknown as Extract<Value, { forma: 'serieTemporal' }>

  it('un primer punto en CERO no se normaliza · dividir por él borra la serie', () => {
    // Sin la guarda, `v / 0` da Infinity y la serie desaparece del área de
    // dibujo sin avisar: la pantalla queda vacía y nada dice por qué.
    const { container } = render(
      <SeriesBody
        {...base}
        value={serie([0, 50, 100])}
        params={{ normalizacion: 'base100' }}
        metric="Ventas"
      />,
    )
    expect(container.innerHTML).not.toContain('Infinity')
    expect(container.innerHTML).not.toContain('NaN')
  })

  it('sin normalización tampoco toca los valores', () => {
    const value = serie([10, 20])
    const antes = JSON.stringify(value.puntos)
    render(<SeriesBody {...base} value={value} params={{}} metric="Ventas" />)
    expect(JSON.stringify(value.puntos)).toBe(antes)
  })
})

describe('DistributionBody · dibuja los cortes que le llegan', () => {
  it('no inventa bins cuando el payload no los trae', () => {
    // Los cortes los calcula el backend. Un bin inventado en el front sería una
    // agregación que nadie declaró.
    const value = {
      forma: 'distribucion',
      cortes: [
        { desde: 0, hasta: 10, n: 4 },
        { desde: 10, hasta: 20, n: 9 },
      ],
    } as unknown as Extract<Value, { forma: 'distribucion' }>
    const { container } = render(
      <DistributionBody {...base} value={value} params={{}} metric="Tickets" />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })
})

describe('ProseBody · el titular y sus pilares', () => {
  const value = {
    forma: 'prosa',
    titular: 'El inventario cubre 31 días.',
    // `label` y `valor` son los dos `required` del contrato. El primer intento
    // escribió `etiqueta` de memoria: el rótulo salía vacío y la prueba pasaba
    // igual, porque solo miraba el `valor`. Por eso ahora se verifican los dos.
    pilares: [
      { label: 'Cobertura', valor: '31 d' },
      { label: 'Quiebre', valor: '4 SKU' },
      { label: 'Exceso', valor: '12 SKU' },
      { label: 'Cuarto', valor: 'no debería verse' },
    ],
  } as unknown as Extract<Value, { forma: 'prosa' }>

  it('muestra tres pilares por defecto · por encima compiten con el titular', () => {
    render(<ProseBody {...base} value={value} params={{}} metric="Inventario" />)
    expect(screen.getByText('El inventario cubre 31 días.')).toBeInTheDocument()
    // El rótulo Y la cifra. Verificar solo la cifra dejaba pasar un pilar con
    // el rótulo vacío, que es lo que pasó al escribir el fixture de memoria.
    expect(screen.getByText('Cobertura')).toBeInTheDocument()
    expect(screen.getByText('31 d')).toBeInTheDocument()
    expect(screen.queryByText('Cuarto')).toBeNull()
    expect(screen.queryByText('no debería verse')).toBeNull()
  })

  it('las cifras del pilar se pintan TAL CUAL · ya vienen formateadas', () => {
    // Es el único cuerpo donde no reformatear es lo correcto: el pilar cita una
    // cifra que ya aparece en el titular, y reformatearla podría hacer que las
    // dos digan distinto.
    render(<ProseBody {...base} value={value} params={{}} metric="Inventario" />)
    expect(screen.getByText('4 SKU')).toBeInTheDocument()
  })

  it('sin pilares dibuja el titular igual · no se rompe', () => {
    const solo = { forma: 'prosa', titular: 'Sin desglose.' } as unknown as Extract<
      Value,
      { forma: 'prosa' }
    >
    render(<ProseBody {...base} value={solo} params={{}} metric="Inventario" />)
    expect(screen.getByText('Sin desglose.')).toBeInTheDocument()
  })
})

describe('BlockedBody · el único tipo que no dibuja su valor', () => {
  const value = { forma: 'escalar', v: 42 } as unknown as Extract<Value, { forma: 'escalar' }>

  it('NO pinta la cifra, aunque el payload la traiga', () => {
    // La diferencia con el estado BLOQUEADO es de duración —el estado es de
    // hoy, el tipo es del panel— pero la regla de no mostrar aproximaciones es
    // la misma.
    const { container } = render(
      <BlockedBody {...base} value={value} params={{ razon: 'Falta identidad en la orden' }} metric="Recompra" />,
    )
    expect(container.textContent).not.toContain('42')
    expect(container.textContent).toContain('Falta identidad en la orden')
  })

  it('sin razón declarada dice algo, no queda mudo', () => {
    const { container } = render(
      <BlockedBody {...base} value={value} params={{}} metric="Recompra" />,
    )
    expect(container.textContent).toMatch(/no está disponible/i)
  })
})

describe('RecoBody · una acción sin quien la apruebe no ofrece botón', () => {
  const value = {
    forma: 'prosa',
    titular: 'Tres acciones para esta semana.',
    pilares: [{ label: 'Reponer talla M', valor: 'Alta', ref: 'r-1' }],
  } as unknown as Extract<Value, { forma: 'prosa' }>

  it('sin `actions` no se pinta APROBAR · un botón que devuelve 403 es peor que ninguno', () => {
    render(<RecoBody {...base} value={value} params={{}} metric="Recomendaciones" />)
    expect(screen.queryByRole('button', { name: /aprobar/i })).toBeNull()
  })

  it('con permiso y manejador, APROBAR dispara con el `ref` y no con el índice', async () => {
    // `Acciones` está keyeado por `ref` y no por índice, y el contrato explica
    // por qué: `tope` recorta los pilares antes de pintarlos, así que el ítem 2
    // del cuerpo no es el ítem 2 del payload. Un `acciones[i]` posicional
    // pondría el botón sobre la recomendación equivocada, en silencio y solo
    // con cierta configuración.
    const respondio = vi.fn()
    render(
      <RecoBody
        {...base}
        value={value}
        params={{}}
        metric="Recomendaciones"
        actions={{
          porRef: { 'r-1': { accionableId: 'a-1', estado: 'propuesto', puedeResponder: true } },
        } as never}
        onRespond={respondio}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /aprobar/i }))

    // Sale el `accionableId` y NO el `ref`, y es lo correcto: quien lo recibe
    // llama a `POST /config/accionables/{id}/respuesta`. El `ref` solo sirve
    // para atar la acción a su ítem, que es lo que hace `porRef`.
    //
    // El tipo decía `(ref: string, ...)` y entregaba el id desde siempre. Se
    // corrigió el nombre al escribir esta prueba: un tipo que promete una cosa
    // y entrega otra es cómo alguien pasa el `ref` un día y el 404 aparece en
    // producción.
    expect(respondio).toHaveBeenCalledWith('a-1', 'aceptado')
  })

  it('con `puedeResponder: false` el botón NO se pinta · lo decide el servidor', () => {
    render(
      <RecoBody
        {...base}
        value={value}
        params={{}}
        metric="Recomendaciones"
        actions={{
          porRef: { 'r-1': { accionableId: 'a-1', estado: 'propuesto', puedeResponder: false } },
        } as never}
        onRespond={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /aprobar/i })).toBeNull()
  })
})
