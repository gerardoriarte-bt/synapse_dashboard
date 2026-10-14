// @vitest-environment jsdom

/** El mapa de calor · `heatmap` · §PEN:Plot/MAPA DE CALOR · Venta por día y hora
 *
 *  **La primera prueba es aritmética pura sobre `levels()`**, por la misma razón
 *  que la del treemap lo es sobre `squarify`: un tablero se ve igual de prolijo
 *  cuantizando bien y cuantizando mal. Lo único que un mapa de calor promete es
 *  que el color sea monótono en el valor, y eso no se ve en el dibujo.
 *
 *  Las que montan el SVG miran lo que el frame fija y lo que el contrato manda:
 *  la rampa de ocho niveles con sus dos escalones de 0.8, el `GAP` de 4 y el
 *  radio de 2, los catorce rótulos en mono 9, la cifra sólo en los dos niveles
 *  más calientes, y **`null` dibujado como contorno sin relleno** — que es la
 *  decisión que el contrato encabeza: una hora sin ventas registradas no es una
 *  hora con cero ventas.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlotHeatmap, levels } from '@/render/plots/PlotHeatmap'
import { MONO_ADVANCE } from '@/render/plots/core/axisGeometry'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const number = (v: number) => format.number(v, { abbreviate: true })

/** Los rótulos del frame, tal cual. */
const DIAS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const HORAS = ['06 H', '09 H', '12 H', '15 H', '18 H', '21 H', '00 H']

/** El doble de `ResizeObserver` de `tests/setup.ts` informa 600 × 300. De ahí
 *  sale la caja útil: 62 de canaleta + 530 de rejilla + 8 de `MARGIN.r`. */
const RESERVE = 62

/** El mínimo de alto que el componente exige para imprimir una cifra mono 10. */
const CIFRA_MIN_H_ESPERADO = 14

/** La banda de cabecera del componente: la primera celda arranca en y = 20 y los
 *  rótulos de columna viven arriba de ahí. Es lo que los distingue de los de
 *  fila sin agregarle al SVG un atributo que existe sólo para la prueba. */
const HEADER = 20

const matriz = (
  filas: readonly string[],
  columnas: readonly string[],
  celdas: readonly (readonly (number | null)[])[],
) => ({ forma: 'matriz', filas, columnas, celdas }) as Extract<Value, { forma: 'matriz' }>

const rects = (c: HTMLElement) => Array.from(c.querySelectorAll('rect'))
const textos = (c: HTMLElement) => Array.from(c.querySelectorAll('text'))
const num = (el: Element, a: string) => Number.parseFloat(el.getAttribute(a) ?? 'NaN')
const par = (r: Element) => `${r.getAttribute('fill')}/${r.getAttribute('fill-opacity') ?? '—'}`

/** Las cifras de celda son mono 10; los rótulos de eje, mono 9. Es lo que
 *  distingue una de otra sin agregarle al componente un atributo que existe sólo
 *  para la prueba. */
const cifras = (c: HTMLElement) => textos(c).filter((t) => t.getAttribute('style')?.includes('font-size: 10px'))
const rotulos = (c: HTMLElement) => textos(c).filter((t) => t.getAttribute('style')?.includes('font-size: 9px'))

/** Una rejilla con gradiente creciente por columna: la fila `r` y la columna `c`
 *  valen `1000 · (c + 1) + 10 · r`, así que las columnas de la derecha son las
 *  calientes — la lectura del frame: la hora muerta pálida, la hora pico
 *  profunda. */
const GRADIENTE = DIAS.map((_, r) => HORAS.map((__, c) => 1000 * (c + 1) + 10 * r))

/* ══ La cuantización, sin montar un SVG ══════════════════════════════════════ */

describe('`levels` · el nivel es monótono, usa la rampa entera y no se sale', () => {
  it('la celda mínima da 0, la máxima da 7, y el orden se respeta', () => {
    // **Valores NO equiespaciados y con el mínimo LEJOS de cero**, que es lo que
    // hace fallar el dominio anclado en cero: con `[0, max]` el 150 caería en el
    // nivel 6 en vez del 0.
    const nv = levels([[150, 160, 175, 200]], 8)[0] as (number | null)[]

    expect(nv[0]).toBe(0)
    expect(nv[3]).toBe(7) // y no 8: sin el `Math.min` la celda se pinta sin color
    for (let i = 1; i < nv.length; i++) {
      expect(nv[i] as number).toBeGreaterThanOrEqual(nv[i - 1] as number)
    }
  })

  it('`null` no entra en el rango y no consume nivel', () => {
    // El mínimo presente está POR ENCIMA de cero a propósito: con el mínimo en
    // cero, `v ?? 0` y `[min, max]` darían el mismo resultado y la prueba no
    // distinguiría nada.
    const nv = levels(
      [
        [null, 10],
        [20, 30],
      ],
      8,
    )

    expect(nv[0]?.[0]).toBeNull()
    expect(nv[0]?.[1]).toBe(0) // la presente más fría sigue siendo la más pálida
    expect(nv[1]?.[1]).toBe(7)
  })

  it('con un solo valor distinto nadie es el más caliente: todas al nivel medio', () => {
    const nv = levels(
      [
        [7, 7],
        [7, null],
      ],
      8,
    )

    // Ni 0 ni 7: mandarlas a un extremo afirma un piso o un techo que el dato no
    // tiene. Y sin la guarda, `(v - min) / (max - min)` es `NaN`.
    expect(nv.flat()).toEqual([3, 3, 3, null])
  })
})

/* ══ La rampa del frame ══════════════════════════════════════════════════════ */

describe('la rampa es la del frame y no una aplanada', () => {
  it('los ocho niveles son los ocho pares medidos, en ese orden', () => {
    // Ocho valores equiespaciados caen uno por nivel. `cliente` tiene cinco
    // escalones: con `externo`, que tiene dos, `familyVar` hace `step % largo` y
    // el escalón 2 vuelve al 0 — la rampa colapsa y taparía esta aserción.
    const { container } = render(
      <PlotHeatmap
        value={matriz(['A', 'B'], ['c1', 'c2', 'c3', 'c4'], [
          [10, 20, 30, 40],
          [50, 60, 70, 80],
        ])}
        family="cliente"
        format={number}
      />,
    )

    expect(rects(container).map(par)).toEqual([
      'var(--color-fam-cliente-0)/0.4',
      'var(--color-fam-cliente-0)/0.5',
      'var(--color-fam-cliente-1)/0.6',
      'var(--color-fam-cliente-1)/0.7',
      // Los dos 0.8 se distinguen POR ESCALÓN, que es lo que impide que la
      // escalera se aplane justo en el medio.
      'var(--color-fam-cliente-1)/0.8',
      'var(--color-fam-cliente-2)/0.8',
      'var(--color-fam-cliente-2)/0.9',
      'var(--color-fam-cliente-2)/1',
    ])
  })
})

describe('el color sale de la familia que llegó por prop', () => {
  it('ni `acc`, ni ámbar, ni un hex literal · y la familia es la de la prop', () => {
    // `medios` y no `demanda`: el frame está pintado en `demanda`, así que
    // cablear el literal del dibujo es la mutación que el dibujo invita — y con
    // `demanda` pasaría.
    const { container } = render(
      <PlotHeatmap
        value={matriz(DIAS, HORAS, GRADIENTE.map((f, r) => (r === 0 ? [null, ...f.slice(1)] : f)))}
        family="medios"
        format={number}
      />,
    )

    for (const r of rects(container)) {
      const fill = r.getAttribute('fill')
      expect(fill === 'none' || /^var\(--color-fam-medios-[0-2]\)$/.test(fill ?? '')).toBe(true)
    }
    expect(container.innerHTML).not.toContain('--color-acc')
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

/* ══ La celda sin dato ═══════════════════════════════════════════════════════ */

describe('`null` no es cero · lo que el contrato encabeza', () => {
  it('sale como contorno sin relleno y no corre la escala', () => {
    const { container } = render(
      <PlotHeatmap
        value={matriz(['A', 'B'], ['c1', 'c2'], [
          [null, 10],
          [20, 30],
        ])}
        family="demanda"
        format={number}
      />,
    )

    const [vacia, frio] = rects(container)
    expect(vacia?.getAttribute('fill')).toBe('none')
    expect(vacia?.getAttribute('stroke')).toBe('var(--color-c-grid)')
    expect(vacia?.getAttribute('stroke-width')).toBe('1')
    // Y la presente más fría sigue siendo la más pálida: con `v ?? 0` el hueco se
    // pinta como el peor valor y todos los niveles se corren.
    expect(par(frio as Element)).toBe('var(--color-fam-demanda-0)/0.4')
  })

  it('la leyenda aparece sólo cuando hay una celda vacía', () => {
    const conVacia = render(
      <PlotHeatmap
        value={matriz(['A', 'B'], ['c1', 'c2'], [
          [null, 10],
          [20, 30],
        ])}
        family="demanda"
        format={number}
      />,
    )
    expect(conVacia.container.textContent).toContain('CONTORNO SIN RELLENO = SIN DATO CARGADO')

    const llena = render(
      <PlotHeatmap
        value={matriz(['A', 'B'], ['c1', 'c2'], [
          [5, 10],
          [20, 30],
        ])}
        family="demanda"
        format={number}
      />,
    )
    expect(llena.container.textContent).not.toContain('CONTORNO SIN RELLENO')
  })
})

/* ══ La cifra de celda ═══════════════════════════════════════════════════════ */

describe('la cifra va sólo en los dos niveles más calientes', () => {
  it('las celdas con cifra son exactamente las de nivel ≥ 6', () => {
    const { container } = render(
      <PlotHeatmap value={matriz(DIAS, HORAS, GRADIENTE)} family="demanda" format={number} />,
    )

    const esperadas = levels(GRADIENTE, 8)
      .flat()
      .filter((n) => n !== null && n >= 6).length

    expect(esperadas).toBeGreaterThan(0)
    // Imprimirlas todas convierte el mapa de calor en una tabla; bajar el umbral
    // a ≥ 5 agrega una columna entera.
    expect(cifras(container)).toHaveLength(esperadas)
  })

  it('y desaparece cuando no entra, aunque siga habiendo celdas calientes', () => {
    const veinticuatro = Array.from({ length: 24 }, (_, c) => `${c}H`)
    const { container } = render(
      <PlotHeatmap
        value={matriz(DIAS, veinticuatro, DIAS.map((_, r) => veinticuatro.map((__, c) => 1000 * (c + 1) + r)))}
        family="demanda"
        format={number}
      />,
    )

    // Mono 10 en una celda de ~18px desborda, que es el defecto que
    // `PlotTreemap` declara no copiar.
    expect(cifras(container)).toHaveLength(0)
    expect(rects(container).map(par)).toContain('var(--color-fam-demanda-2)/1')
  })

  it('la cifra es `$bg` sobre celda caliente · DIVERGENCIA DE CONTRASTE REGISTRADA', () => {
    // **3,23:1 en tema oscuro contra el umbral de 4,5** —2,82 con la opacidad 0.9
    // del frame— mientras `$ink` en ese par da 4,94. En tema claro se invierte:
    // `$bg` 6,64 y `$ink` 2,30. Se implementa como el frame lo dibuja y queda
    // pendiente de diseño, igual que los 4,17 de `DegradedBadge`; clavado acá
    // para que el día que se resuelva la prueba avise en vez de pasar callado.
    const { container } = render(
      <PlotHeatmap value={matriz(DIAS, HORAS, GRADIENTE)} family="demanda" format={number} />,
    )

    for (const t of cifras(container)) {
      expect(t.getAttribute('style')).toContain('fill: var(--color-bg)')
    }
  })
})

/* ══ Ningún número desnudo, tampoco para un lector de pantalla ═══════════════ */

describe('cada celda dice qué es', () => {
  it('`<title>` con fila, columna y la cifra FORMATEADA · y `sin dato` en la vacía', () => {
    const { container } = render(
      <PlotHeatmap
        value={matriz(['LUN', 'MAR'], ['21 H', '00 H'], [
          [29000, null],
          [12000, 34000],
        ])}
        family="demanda"
        format={number}
      />,
    )

    const titulos = rects(container).map((r) => r.querySelector('title')?.textContent)
    expect(titulos).toEqual([
      'LUN · 21 H · 29K',
      'LUN · 00 H · sin dato',
      'MAR · 21 H · 12K',
      'MAR · 00 H · 34K',
    ])
    // Y el crudo NO aparece: `String(v)` en vez de `format(v)` es lo que un
    // `toString` accidental produce, y sólo muere si se afirma la ausencia.
    expect(container.textContent).not.toContain('29000')
  })

  it('el `aria-label` nombra el mapa de calor y sus dimensiones', () => {
    const { container } = render(
      <PlotHeatmap value={matriz(DIAS, HORAS, GRADIENTE)} family="demanda" format={number} />,
    )

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    // Distinto del «N categorías» de `PlotBars` y del «en mosaico» del treemap:
    // es lo que hace afirmable CUÁL se montó.
    expect(svg?.getAttribute('aria-label')).toBe('7 × 7 celdas en mapa de calor')
  })
})

/* ══ Los dos ejes ════════════════════════════════════════════════════════════ */

describe('los ejes están donde el frame los pone, y en mono 9', () => {
  it('las horas arriba y centradas en su celda; los días a la izquierda', () => {
    const { container } = render(
      <PlotHeatmap value={matriz(DIAS, HORAS, GRADIENTE)} family="demanda" format={number} />,
    )

    const primeraFila = rects(container).slice(0, HORAS.length)
    const arriba = rotulos(container).filter((t) => HORAS.includes(t.textContent ?? ''))
    const izquierda = rotulos(container).filter((t) => DIAS.includes(t.textContent ?? ''))
    expect(arriba).toHaveLength(HORAS.length)
    expect(izquierda).toHaveLength(DIAS.length)

    arriba.forEach((t, i) => {
      const r = primeraFila[i] as Element
      // El centro EXACTO de la celda, leído del `rect` y no copiado.
      expect(num(t, 'x')).toBeCloseTo(num(r, 'x') + num(r, 'width') / 2, 6)
      // Y por encima de la primera fila: rendido abajo, `06 H` se iría al pie.
      expect(num(t, 'y')).toBeLessThan(num(r, 'y'))
    })

    izquierda.forEach((t, i) => {
      const r = rects(container)[i * HORAS.length] as Element
      expect(t.getAttribute('text-anchor')).toBe('end')
      expect(num(t, 'x')).toBeLessThan(num(r, 'x'))
      expect(num(t, 'y')).toBeCloseTo(num(r, 'y') + num(r, 'height') / 2, 6)
    })
  })

  it('los catorce en mono 9, 0.12em y `dim`', () => {
    const { container } = render(
      <PlotHeatmap value={matriz(DIAS, HORAS, GRADIENTE)} family="demanda" format={number} />,
    )

    const ejes = rotulos(container)
    // Mono 9 es el tamaño de nota de §2.3 y el que el frame escribe: dejar el
    // `size` por defecto de `AxisText` los pintaría en 10.
    expect(ejes).toHaveLength(DIAS.length + HORAS.length)
    for (const t of ejes) {
      const style = t.getAttribute('style') ?? ''
      expect(style).toContain('font-size: 9px')
      expect(style).toContain('letter-spacing: 0.12em')
      expect(style).toContain('fill: var(--color-dim)')
    }
  })
})

/* ══ La canaleta de rótulos de fila ══════════════════════════════════════════ */

describe('la reserva de rótulos tiene el piso del frame y crece', () => {
  it('con `LUN…DOM` la rejilla arranca en 62, como el frame', () => {
    const { container } = render(
      <PlotHeatmap value={matriz(DIAS, HORAS, GRADIENTE)} family="demanda" format={number} />,
    )

    // Sin el piso de 50 la reserva sale de `LUN` —19,4 en mono 9— y la rejilla
    // arrancaría en ~31.
    expect(num(rects(container)[0] as Element, 'x')).toBeCloseTo(RESERVE, 6)
  })

  it('con un rótulo largo la reserva crece y el rótulo se recorta con `…`', () => {
    const largo = 'DOMINGO DE PASCUA Y CARNAVALES'
    const { container } = render(
      <PlotHeatmap
        value={matriz([largo, 'MAR'], ['c1', 'c2'], [
          [10, 20],
          [30, 40],
        ])}
        family="demanda"
        format={number}
      />,
    )

    // Las dos mitades hacen falta: con un 62 fijo el rótulo se mete debajo de las
    // celdas, y sin recorte se sale del dibujo.
    expect(num(rects(container)[0] as Element, 'x')).toBeGreaterThan(RESERVE)
    const rotulo = rotulos(container).find((t) => (t.textContent ?? '').startsWith('DOMINGO'))
    expect(rotulo?.textContent).toMatch(/…$/)
  })
})

/* ══ La matriz rala ══════════════════════════════════════════════════════════ */

describe('un hueco de PAYLOAD no se dibuja como una celda sin dato', () => {
  it('una fila corta no produce un contorno que diga «sin dato»', () => {
    // **Es la distinción que el contrato protege**: «si faltan filas o columnas
    // respecto de las etiquetas, el cuerpo no puede dibujarla y lo dice». Un
    // `celdas[r]?.[c] ?? null` dibuja un tablero prolijo donde el contorno
    // afirma «no hay dato cargado» cuando lo que hay es un payload roto.
    //
    // La guardia que lo DECLARA con su razón es del cuerpo —`MatrixBody`, que
    // todavía no existe—; lo que se afirma acá es que el plot no miente mientras
    // tanto.
    const { container } = render(
      <PlotHeatmap
        value={matriz(['A', 'B'], ['c1', 'c2'], [[10], [20, 30]])}
        family="demanda"
        format={number}
      />,
    )

    expect(rects(container)).toHaveLength(3)
    expect(container.textContent).not.toContain('sin dato')
    expect(container.textContent).not.toContain('CONTORNO SIN RELLENO')
  })
})

/* ══ El `GAP` y el radio ═════════════════════════════════════════════════════ */

describe('el `GAP` y el radio del frame llegan al SVG', () => {
  it('4 píxeles entre vecinas en los dos ejes, y `rx` 2 en todas', () => {
    const { container } = render(
      <PlotHeatmap value={matriz(DIAS, HORAS, GRADIENTE)} family="demanda" format={number} />,
    )

    const todas = rects(container)
    const a = todas[0] as Element
    const b = todas[1] as Element
    const abajo = todas[HORAS.length] as Element

    // Es el agujero que el treemap ya pagó: su prueba de `gap` llamaba a la
    // primitiva con un 3 literal, así que verificaba la primitiva y no el
    // cableado, y `GAP = 0` seguía en verde. Acá se mide sobre el SVG rendido.
    expect(num(b, 'x') - (num(a, 'x') + num(a, 'width'))).toBeCloseTo(4, 6)
    expect(num(abajo, 'y') - (num(a, 'y') + num(a, 'height'))).toBeCloseTo(4, 6)
    for (const r of todas) expect(r.getAttribute('rx')).toBe('2')
  })
})

/* ══ El contrato de label, con rótulos como los manda el backend ══════════════ */

describe('los rótulos de eje van en MAYÚSCULAS aunque lleguen en minúscula', () => {
  it('«lunes» y «06 h» se pintan «LUNES» y «06 H»', () => {
    // Todos los fixtures de arriba copian el frame, que YA los escribe en
    // mayúscula, así que con ellos quitar el `.toUpperCase()` no se nota: la
    // mutación sobrevivía en verde. El catálogo no promete la caja del rótulo y
    // §2.3 pide label en mayúsculas — es la mitad del contrato que faltaba fijar.
    const { container } = render(
      <PlotHeatmap
        value={matriz(['lunes', 'martes'], ['06 h', '21 h'], [
          [10, 20],
          [30, 40],
        ])}
        family="demanda"
        format={number}
      />,
    )

    expect(rotulos(container).map((t) => t.textContent)).toEqual([
      '06 H',
      '21 H',
      'LUNES',
      'MARTES',
    ])
  })
})

/* ══ El mínimo de ALTO de la cifra ═══════════════════════════════════════════ */

describe('cada eje se recorta con SU PROPIO presupuesto · arreglado el 2026-09-30', () => {
  /** Rótulos de fila largos y de columna medianos, que es lo que desacopla los
   *  dos presupuestos. Ningún fixture del frame lo hacía —sus catorce rótulos
   *  miden tres o cuatro caracteres— y por eso la mutación del `cap` compartido
   *  SOBREVIVIÓ a las diez pruebas que había. */
  const FILAS_LARGAS = ['PLATAFORMA DE VIDEO PROGRAMATICO', 'PLATAFORMA DE BUSQUEDA PAGADA']
  const COLUMNAS_MEDIANAS = [
    'OCTUBRE DOS MIL VEINTIC',
    'NOVIEMBRE DOS MIL VEINT',
    'DICIEMBRE DOS MIL VEINT',
    'ENERO DOS MIL VEINTISEI',
    'FEBRERO DOS MIL VEINTIS',
    'MARZO DOS MIL VEINTISEI',
    'ABRIL DOS MIL VEINTISEI',
  ]

  const conAmbos = () =>
    render(
      <PlotHeatmap
        value={matriz(
          FILAS_LARGAS,
          COLUMNAS_MEDIANAS,
          FILAS_LARGAS.map((_, r) => COLUMNAS_MEDIANAS.map((__, c) => 100 * (c + 1) + r)),
        )}
        family="medios"
        format={number}
      />,
    )

  it('el rótulo de COLUMNA se recorta contra su celda, no contra la canaleta de filas', () => {
    // **La cuenta, porque es la que explica el defecto.** La canaleta llega a su
    // techo —un tercio de 600, o sea 200— así que el tope de las FILAS es
    // `charsThatFit(188, 9)` = 29 caracteres. Las columnas miden 23, de modo que
    // con el tope compartido pasaban ENTERAS: 23 caracteres son 149px de texto
    // sobre celdas de ~52, y se solapaban casi tres columnas.
    //
    // Con su propio presupuesto el tope baja a `charsThatFit(~52, 9)` = 8.
    const { container } = conAmbos()
    // Los rótulos de columna son los que están ARRIBA de la rejilla: la cabecera
    // mide 20, así que su `y` es menor que el de cualquier fila.
    const deColumna = rotulos(container).filter((t) => num(t, 'y') < HEADER)
    const celda = num(rects(container)[0] as Element, 'width')

    expect(deColumna).toHaveLength(COLUMNAS_MEDIANAS.length)
    expect(deColumna[0]?.textContent).toMatch(/…$/)
    // **El ancho medido, no sólo el `…`**: un recorte a 20 caracteres también
    // termina en puntos suspensivos y se sigue solapando. Los SIETE tienen que
    // entrar en la celda que rotulan.
    for (const t of deColumna) {
      expect((t.textContent?.length ?? 0) * 9 * MONO_ADVANCE).toBeLessThanOrEqual(celda)
    }
  })

  it('y el rótulo de FILA sigue usando la canaleta · no se recorta al ancho de celda', () => {
    // La otra mitad, y la que impide «arreglarlo» pasando el tope de columnas a
    // los dos: con `charsThatFit(52, 9)` = 8 las filas se recortarían a siete
    // caracteres teniendo 188px de canaleta disponibles. Miden 31 y 29, así que
    // se recortan a 29 — no a 8.
    const { container } = conAmbos()
    const fila = rotulos(container).find((t) => (t.textContent ?? '').startsWith('PLATAFORMA DE V'))

    expect(fila?.textContent).toMatch(/…$/)
    expect(fila?.textContent?.length).toBeGreaterThan(20)
  })
})

describe('la cifra desaparece también cuando la celda es muy BAJA', () => {
  it('con veinte filas no se imprime ninguna, aunque a lo ancho entren de sobra', () => {
    const veinte = Array.from({ length: 20 }, (_, r) => `D${r}`)
    const cuatro = ['c1', 'c2', 'c3', 'c4']
    const { container } = render(
      <PlotHeatmap
        value={matriz(veinte, cuatro, veinte.map((_, r) => cuatro.map((__, c) => 1000 * (c + 1) + r)))}
        family="demanda"
        format={number}
      />,
    )

    // La prueba de 24 columnas ejercita sólo el ANCHO: ahí la celda mide 18px de
    // lado y las dos condiciones se caen juntas, así que `CIFRA_MIN_H = 0`
    // sobrevivía. Acá la celda es ancha y baja, y el único freno es el alto.
    const primera = rects(container)[0] as Element
    expect(num(primera, 'width')).toBeGreaterThan(40)
    expect(num(primera, 'height')).toBeLessThan(CIFRA_MIN_H_ESPERADO)
    expect(cifras(container)).toHaveLength(0)
    // Y sigue habiendo celdas del nivel más caliente: lo que falta es la cifra,
    // no el color.
    expect(rects(container).map(par)).toContain('var(--color-fam-demanda-2)/1')
  })
})

/* ══ El tope del aire de banda ═══════════════════════════════════════════════ */

describe('con muchísimas filas la celda se achica pero no se invierte', () => {
  it('ochenta filas: ningún `rect` de alto negativo', () => {
    const ochenta = Array.from({ length: 80 }, (_, r) => `${r}`)
    const dos = ['c1', 'c2']
    const { container } = render(
      <PlotHeatmap
        value={matriz(ochenta, dos, ochenta.map((_, r) => dos.map((__, c) => 100 * (c + 1) + r)))}
        family="demanda"
        format={number}
      />,
    )

    // `bandScale` toma el aire como FRACCIÓN del paso, así que un `GAP` absoluto
    // de 4 sobre pasos de 3,25 pide más aire que paso y el `bandwidth` se va a
    // negativo: el `rect` desaparece del SVG **sin ningún error**, que es el modo
    // de falla que el componente dice atajar con su tope de 0.9.
    expect(rects(container)).toHaveLength(160)
    for (const r of rects(container)) expect(num(r, 'height')).toBeGreaterThanOrEqual(0)
  })
})
