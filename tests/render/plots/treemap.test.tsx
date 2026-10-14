// @vitest-environment jsdom

/** El mosaico · `treemap` · §PEN:Plot/TREEMAP · 2026-09-29
 *
 *  **Lo único que un treemap promete es el área**, así que la primera prueba es
 *  aritmética pura sobre `squarify` y no un render: un mosaico se ve igual de
 *  bien repartiendo por `Math.sqrt(v)` que por `v`, y el ojo no distingue los
 *  dos. Lo mismo con el solape — nueve rectángulos encimados se leen como una
 *  hoja grande de color.
 *
 *  Las que sí montan el SVG miran lo que el frame fija y `design.md` exige: el
 *  color sale de la familia que llegó por prop, la hoja más grande es la más
 *  transparente, y ningún rectángulo queda sin rótulo salvo que no entre.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BarsBody } from '@/render/bodies/BarsBody'
import { PlotTreemap, squarify } from '@/render/plots/PlotTreemap'
import { createFormat } from '@/render/format'
import type { Value } from '@/api/types'

const format = createFormat('es-MX')
const number = (v: number) => format.number(v, { abbreviate: true })

/** El doble de `ResizeObserver` de `tests/setup.ts` informa 600 × 300, así que
 *  la caja útil de todo render de acá es 580 × 280 · `PAD` = 10. */
const BOX = { w: 580, h: 280 }

const categorica = (items: readonly { etiqueta: string; v: number }[]) =>
  ({ forma: 'categorica', items }) as Extract<Value, { forma: 'categorica' }>

const rects = (container: HTMLElement) => Array.from(container.querySelectorAll('rect'))

/* ══ El reparto, sin montar un SVG ═══════════════════════════════════════════ */

/** Las nueve hojas del frame, con las cuotas que sus rótulos declaran:
 *  FOOTWEAR 22+13+8+5, APPAREL 17+13+10, ACCESS. 7+5. */
const NUEVE = [22, 17, 13, 13, 10, 8, 7, 5, 5]

describe('`squarify` · el área es proporcional al valor', () => {
  it('cada rectángulo ocupa su fracción exacta de la caja', () => {
    // **Es la única promesa que hace un treemap.** Sin esta aserción el dibujo
    // se ve perfecto mintiendo: repartir por `Math.sqrt(v)`, en partes iguales
    // o sin normalizar por la suma produce un mosaico igual de prolijo.
    const tiles = squarify(NUEVE, BOX, 0)
    const total = NUEVE.reduce((a, b) => a + b, 0)
    const area = BOX.w * BOX.h

    tiles.forEach((t, i) => {
      const esperado = (NUEVE[i] as number) / total
      expect((t.w * t.h) / area).toBeCloseTo(esperado, 9)
    })
  })

  it('no se solapan y ninguno se sale de la caja', () => {
    const tiles = squarify(NUEVE, BOX, 0)
    const E = 1e-9

    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(-E)
      expect(t.y).toBeGreaterThanOrEqual(-E)
      expect(t.x + t.w).toBeLessThanOrEqual(BOX.w + E)
      expect(t.y + t.h).toBeLessThanOrEqual(BOX.h + E)
    }

    for (let a = 0; a < tiles.length; a++) {
      for (let b = a + 1; b < tiles.length; b++) {
        const p = tiles[a] as { x: number; y: number; w: number; h: number }
        const q = tiles[b] as { x: number; y: number; w: number; h: number }
        const overlapX = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)
        const overlapY = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)
        expect(Math.max(0, overlapX) * Math.max(0, overlapY)).toBeLessThan(E)
      }
    }
  })

  it('el `gap` se le resta a CADA rectángulo y nunca produce un lado negativo', () => {
    // Un ancho negativo hace desaparecer el `rect` del SVG **sin ningún error**,
    // que es el defecto que `PlotComposition` ya documenta. El 0.01 es la hoja
    // que lo dispara: su lado sin piso queda por debajo del `gap`.
    const conGap = squarify([99, 99, 0.01], BOX, 3)
    for (const t of conGap) {
      expect(t.w).toBeGreaterThanOrEqual(0)
      expect(t.h).toBeGreaterThanOrEqual(0)
    }

    // Y la separación es exactamente la pedida: el hueco entre dos vecinas es el
    // `gap` entero y no la mitad repartida.
    const sinGap = squarify([50, 50], BOX, 0)
    const [a, b] = [sinGap[0] as { x: number; w: number }, sinGap[1] as { x: number }]
    const cortadas = squarify([50, 50], BOX, 3)
    const [c, d] = [cortadas[0] as { x: number; w: number }, cortadas[1] as { x: number }]
    expect(b.x - (a.x + a.w)).toBeCloseTo(0, 9)
    expect(d.x - (c.x + c.w)).toBeCloseTo(3, 9)
  })
})

/* ══ El dibujo ═══════════════════════════════════════════════════════════════ */

describe('el color es de DATOS y sale de la familia que llegó por prop', () => {
  it('todo relleno es un escalón de la familia · ni `acc`, ni ámbar, ni un hex', () => {
    const { container } = render(
      <PlotTreemap
        value={categorica(NUEVE.map((v, i) => ({ etiqueta: `c${i}`, v })))}
        family="inventario"
        format={number}
      />,
    )

    const fills = rects(container).map((r) => r.getAttribute('fill'))
    expect(fills).toHaveLength(NUEVE.length)
    for (const fill of fills) {
      expect(fill).toMatch(/^var\(--color-fam-inventario-[0-4]\)$/)
    }
    expect(container.innerHTML).not.toContain('--color-acc')
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

describe('la opacidad desciende con el tamaño dentro de la columna', () => {
  it('la hoja más grande es la más transparente, columna por columna', () => {
    // Dieciséis hojas es lo que hace falta para que `squarify` arme columnas de
    // tres en una caja apaisada: con cuatro valores el algoritmo las deja de a
    // una y los escalones 0.7 y 0.8 nunca se ejercitarían.
    const valores = Array.from({ length: 16 }, (_, i) => 100 - i * 2)
    const { container } = render(
      <PlotTreemap
        value={categorica(valores.map((v, i) => ({ etiqueta: `c${i}`, v })))}
        family="demanda"
        format={number}
      />,
    )

    // La columna se lee del reparto, **no del relleno**: `RAMPA` cicla cada
    // cinco, así que con ocho columnas dos de ellas comparten color y agruparlas
    // por `fill` juntaría hojas que en pantalla no se tocan. `squarify` ya está
    // verificado arriba, así que acá sirve de referencia y no de sujeto.
    const tiles = squarify(valores, BOX, 3)
    const marcas = rects(container)
    expect(marcas).toHaveLength(tiles.length)

    const columnas = new Map<number, { area: number; opacity: number }[]>()
    marcas.forEach((r, i) => {
      const area = Number(r.getAttribute('width')) * Number(r.getAttribute('height'))
      const opacity = Number(r.getAttribute('fill-opacity'))
      const grupo = (tiles[i] as { group: number }).group
      const columna = columnas.get(grupo)
      if (columna === undefined) columnas.set(grupo, [{ area, opacity }])
      else columna.push({ area, opacity })
    })

    const ESCALONES = [0.3, 0.5, 0.7, 0.8]
    let conVarias = 0
    for (const hojas of columnas.values()) {
      if (hojas.length > 1) conVarias += 1
      const porArea = [...hojas].sort((a, b) => b.area - a.area)
      porArea.forEach((hoja, rango) => {
        expect(hoja.opacity).toBe(ESCALONES[Math.min(rango, ESCALONES.length - 1)])
      })
    }
    // Sin al menos una columna de varias hojas la aserción de arriba no afirma
    // nada: todas serían 0.3 y un arreglo invertido pasaría igual.
    expect(conVarias).toBeGreaterThan(0)
  })
})

describe('ningún número desnudo · cada hoja con espacio lleva nombre Y cuota', () => {
  const DOS = categorica([
    { etiqueta: 'Norte', v: 75 },
    { etiqueta: 'Sur', v: 25 },
  ])

  it('el nombre va en cuerpo 12 sin mayúsculas y la cuota en el contrato de label', () => {
    render(<PlotTreemap value={DOS} family="demanda" format={number} />)

    // Sentence case: el frame escribe «Running», «Tops», «Bags» — no `AxisText`,
    // que sube todo a mayúsculas.
    const nombre = screen.getByText('Norte')
    expect(nombre.style.fontFamily).toBe('var(--font-body)')
    expect(nombre.style.fontSize).toBe('12px')

    // §2.3 y el frame: mono 10, 1.2px de tracking sobre un cuerpo de 10 = 0.12em.
    const cuota = screen.getByText('75%')
    expect(cuota.style.fontFamily).toBe('var(--font-mono)')
    expect(cuota.style.fontSize).toBe('10px')
    expect(cuota.style.letterSpacing).toBe('0.12em')
  })

  it('la cuota sale de la SUMA, no del conteo', () => {
    // Con dos ítems iguales `v / Σv` y `1 / n` dan lo mismo y la aserción no
    // distinguiría nada; 75 y 25 es lo que separa las dos lecturas.
    render(<PlotTreemap value={DOS} family="demanda" format={number} />)

    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.queryByText('50%')).toBeNull()
  })
})

describe('un rótulo que no entra no se pinta', () => {
  it('sin alto para las dos líneas queda el nombre solo; sin ancho, nada', () => {
    // El frame mismo se pasa acá —«Golf» y su «5%» caen fuera de un rectángulo
    // de 16,8 de alto— y la implementación no copia el desborde.
    const { container } = render(
      <PlotTreemap
        value={categorica([
          { etiqueta: 'Grande', v: 89 },
          { etiqueta: 'Media', v: 5 },
          { etiqueta: 'Chica', v: 3 },
          { etiqueta: 'Intermedia', v: 2 },
          { etiqueta: 'Fina', v: 1 },
        ])}
        family="demanda"
        format={number}
      />,
    )

    // 513 × 277: las dos líneas.
    expect(screen.getByText('Grande')).toBeInTheDocument()
    expect(screen.getByText('89%')).toBeInTheDocument()

    // 61 × 22: entra el nombre y no la cuota.
    expect(screen.getByText('Fina')).toBeInTheDocument()
    expect(container.textContent).not.toContain('1%')

    // Y el recorte sale del ancho disponible, no de un tope fijo en caracteres:
    // a 61px de columna entran cinco de cuerpo 12.
    expect(screen.getByText('Inte…')).toBeInTheDocument()
  })

  it('una hoja demasiado angosta no lleva ni nombre ni cuota', () => {
    render(
      <PlotTreemap
        value={categorica([
          { etiqueta: 'Grande', v: 96 },
          { etiqueta: 'Angosta', v: 2 },
          { etiqueta: 'Filito', v: 1 },
          { etiqueta: 'Hilo', v: 1 },
        ])}
        family="demanda"
        format={number}
      />,
    )

    expect(screen.getByText('Grande')).toBeInTheDocument()
    expect(screen.getByText('96%')).toBeInTheDocument()
    // 20px de ancho: no entran tres caracteres de cuerpo 12 más los dos insets.
    expect(screen.queryByText('Angosta')).toBeNull()
    expect(screen.queryByText('2%')).toBeNull()
  })
})

describe('el mosaico se nombra distinto de las barras', () => {
  it('el `aria-label` dice «en mosaico» · es lo que hace afirmable cuál se montó', () => {
    render(
      <PlotTreemap
        value={categorica([
          { etiqueta: 'Norte', v: 75 },
          { etiqueta: 'Sur', v: 25 },
        ])}
        family="demanda"
        format={number}
      />,
    )

    expect(screen.getByRole('img', { name: '2 categorías en mosaico' })).toBeInTheDocument()
    // El de `PlotBars` es `${n} categorías` a secas. Sin la diferencia, una
    // prueba de despacho no puede fallar nunca.
    expect(screen.queryByRole('img', { name: /^\d+ categorías$/ })).toBeNull()
  })
})

/* ══ Lo que §5 NO le da al mosaico ═══════════════════════════════════════════ */

describe('`treemap` sobre `ranking` se DECLARA, no se dibuja', () => {
  it('un ranking pedido como mosaico cae a `UnknownPlotState`', () => {
    // §5 le da `treemap` a `categorica` y a `composicion`; a `ranking` le da
    // bars, lollipop, bump, list y table. Un ranking servido como mosaico pierde
    // justamente el orden, que es lo único que un ranking afirma.
    render(
      <BarsBody
        value={
          {
            forma: 'ranking',
            items: [
              { etiqueta: 'Norte', v: 75, posicion: 1 },
              { etiqueta: 'Sur', v: 25, posicion: 2 },
            ],
          } as Extract<Value, { forma: 'ranking' }>
        }
        params={{}}
        span={{ colStart: 1, colSpan: 5, rowSpan: 4 }}
        family="demanda"
        metric="Ventas por región"
        format={format}
        grafico="treemap"
      />,
    )

    expect(screen.getByText(/treemap/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })
})

/* ══ Lo que la mutación encontró sin cubrir · QA 2026-09-29 ══════════════════
 *
 *  Las de arriba dejaban pasar nueve mutaciones fieles. Cada `describe` de acá
 *  nace de una que SOBREVIVIÓ, y el comentario dice cuál: sin eso el bloque se
 *  lee como una prueba más y el día que alguien lo borre no se sabe qué tapaba.
 */

describe('el `PAD` y el `GAP` del frame llegan al SVG', () => {
  it('el mosaico va corrido 10px y las hojas separadas 3 · `PAD = 0` y `GAP = 0` pasaban', () => {
    // **Las dos constantes están medidas nodo por nodo sobre el frame y ninguna
    // prueba las ataba al render.** La del `gap` de arriba llama a `squarify`
    // con un 3 literal, así que verifica la primitiva y no el cableado: con
    // `GAP = 0` las nueve hojas se tocaban y con `PAD = 0` el mosaico salía
    // pegado al borde, y las once pruebas seguían en verde.
    const { container } = render(
      <PlotTreemap
        value={categorica(NUEVE.map((v, i) => ({ etiqueta: `c${i}`, v })))}
        family="demanda"
        format={number}
      />,
    )

    expect(container.querySelector('g')?.getAttribute('transform')).toBe('translate(10,10)')

    // La caja útil es 580 × 280 —600 × 300 menos `PAD` a los dos lados— y la
    // separación es 3. Si cualquiera de las dos cambia, las coordenadas no dan.
    const tiles = squarify(NUEVE, BOX, 3)
    const marcas = rects(container)
    expect(marcas).toHaveLength(tiles.length)
    marcas.forEach((r, i) => {
      const t = tiles[i] as { x: number; y: number; w: number; h: number }
      expect(Number(r.getAttribute('x'))).toBeCloseTo(t.x, 6)
      expect(Number(r.getAttribute('y'))).toBeCloseTo(t.y, 6)
      expect(Number(r.getAttribute('width'))).toBeCloseTo(t.w, 6)
      expect(Number(r.getAttribute('height'))).toBeCloseTo(t.h, 6)
    })

    // Y el radio de la hoja es el `r-xs` de §2, que tampoco estaba atado.
    for (const r of marcas) expect(r.getAttribute('rx')).toBe('2')
  })
})

describe('la rampa de familia no es plana · cada columna su escalón', () => {
  it('la primera columna es `fam-1` y la segunda `fam-0`, como el frame · plana pasaba', () => {
    // **Mandar todas las columnas al escalón 1 no rompía nada**: la prueba de
    // color de arriba acepta cualquier `[0-4]`, así que afirmaba «sale de la
    // familia» y no «cada columna se distingue de la de al lado». El orden de
    // arranque —1 y después 0— es del frame, no una elección del componente.
    const valores = Array.from({ length: 16 }, (_, i) => 100 - i * 2)
    const { container } = render(
      <PlotTreemap
        value={categorica(valores.map((v, i) => ({ etiqueta: `c${i}`, v })))}
        family="demanda"
        format={number}
      />,
    )

    const tiles = squarify(valores, BOX, 3)
    const marcas = rects(container)
    const porColumna = new Map<number, Set<string>>()
    marcas.forEach((r, i) => {
      const grupo = (tiles[i] as { group: number }).group
      const fill = r.getAttribute('fill') ?? ''
      const vistos = porColumna.get(grupo)
      if (vistos === undefined) porColumna.set(grupo, new Set([fill]))
      else vistos.add(fill)
    })
    const fillDe = (grupo: number) => {
      const vistos = porColumna.get(grupo)
      // Dentro de una columna el relleno es UNO: lo que varía es la opacidad.
      expect(vistos?.size).toBe(1)
      return [...(vistos ?? [])][0]
    }

    expect(fillDe(0)).toBe('var(--color-fam-demanda-1)')
    expect(fillDe(1)).toBe('var(--color-fam-demanda-0)')
    // Las cinco primeras columnas no repiten color, que es lo que una rampa
    // plana rompe y ninguna aserción veía.
    expect(new Set([0, 1, 2, 3, 4].map(fillDe)).size).toBe(5)
    // Y cicla cada cinco: la sexta vuelve al arranque.
    expect(fillDe(5)).toBe(fillDe(0))
  })
})

describe('la opacidad se lee del ÁREA y no del orden de llegada', () => {
  it('con la lista sin ordenar la hoja mayor sigue siendo la más transparente', () => {
    // **La cabecera dice «por área y no por posición, para que la regla siga
    // valiendo con `orden: natural`» y quitar el `sort` no rompía nada**: la
    // prueba de arriba usa dieciséis valores DESCENDENTES, donde las dos
    // lecturas coinciden. Estos seis están alternados a propósito: en las dos
    // primeras columnas la hoja que llega primero es la chica.
    const valores = [5, 40, 3, 30, 2, 20]
    const { container } = render(
      <PlotTreemap
        value={categorica(valores.map((v, i) => ({ etiqueta: `c${i}`, v })))}
        family="demanda"
        format={number}
      />,
    )

    const tiles = squarify(valores, BOX, 3)
    const marcas = rects(container)
    const columnas = new Map<number, { area: number; orden: number; opacity: number }[]>()
    marcas.forEach((r, i) => {
      const area = Number(r.getAttribute('width')) * Number(r.getAttribute('height'))
      const fila = {
        area,
        orden: i,
        opacity: Number(r.getAttribute('fill-opacity')),
      }
      const grupo = (tiles[i] as { group: number }).group
      const columna = columnas.get(grupo)
      if (columna === undefined) columnas.set(grupo, [fila])
      else columna.push(fila)
    })

    // Que el fixture DISCRIMINE: si el orden de llegada coincidiera con el de
    // área, la aserción de abajo pasaría con el `sort` borrado.
    let discriminan = 0
    for (const hojas of columnas.values()) {
      if (hojas.length > 1 && hojas.some((h, k) => k > 0 && h.area > (hojas[k - 1] as { area: number }).area))
        discriminan += 1
    }
    expect(discriminan).toBeGreaterThan(0)

    const ESCALONES = [0.3, 0.5, 0.7, 0.8]
    for (const hojas of columnas.values()) {
      const porArea = [...hojas].sort((a, b) => b.area - a.area)
      porArea.forEach((hoja, rango) => {
        expect(hoja.opacity).toBe(ESCALONES[Math.min(rango, ESCALONES.length - 1)])
      })
    }
  })
})

describe('el `gap` tampoco produce un ALTO negativo', () => {
  it('en caja alta y angosta el reparto sale en FILAS y el piso es el del alto', () => {
    // **Quitar el piso del ALTO no rompía nada** y quitar el del ANCHO sí: el
    // fixture de arriba es apaisado, donde la hoja que se queda corta lo hace
    // de ancho. `colSpan` 4 con `rowSpan` 5 es la caja que la cabecera declara
    // como el caso vertical, y ahí el lado corto es el otro.
    const alta = squarify([99, 99, 0.01], { w: 100, h: 600 }, 3)
    for (const t of alta) {
      expect(t.w).toBeGreaterThanOrEqual(0)
      expect(t.h).toBeGreaterThanOrEqual(0)
    }
    // Y la separación vertical es el `gap` entero, igual que la horizontal.
    const sinGap = squarify([50, 50], { w: 100, h: 600 }, 0)
    const conGap = squarify([50, 50], { w: 100, h: 600 }, 3)
    const [a, b] = [sinGap[0] as { y: number; h: number }, sinGap[1] as { y: number }]
    const [c, d] = [conGap[0] as { y: number; h: number }, conGap[1] as { y: number }]
    expect(b.y - (a.y + a.h)).toBeCloseTo(0, 9)
    expect(d.y - (c.y + c.h)).toBeCloseTo(3, 9)
  })
})

describe('una hoja sin área no consume un escalón ni un `gap`', () => {
  it('el ítem en cero se filtra antes de repartir · no filtrarlo pasaba', () => {
    // El contrato declara `v: number` sin mínimo, así que el cero llega. Sin el
    // filtro se dibuja un `rect` de 0 × 0 —invisible, y el SVG no se queja—,
    // se come un escalón de la rampa y desplaza el color de las que siguen. El
    // `aria-label` es lo que lo hace afirmable.
    const { container } = render(
      <PlotTreemap
        value={categorica([
          { etiqueta: 'Norte', v: 75 },
          { etiqueta: 'Vacía', v: 0 },
          { etiqueta: 'Sur', v: 25 },
        ])}
        family="demanda"
        format={number}
      />,
    )

    expect(rects(container)).toHaveLength(2)
    expect(screen.getByRole('img', { name: '2 categorías en mosaico' })).toBeInTheDocument()
    expect(screen.queryByText('Vacía')).toBeNull()
    // Y la cuota se saca de la suma de las que quedaron, no de la de origen.
    expect(screen.getByText('75%')).toBeInTheDocument()
  })
})

describe('la cuota derivada se redondea a entero', () => {
  it('con una suma que no es 100 la cuota no sale con decimales · sin redondeo pasaba', () => {
    // **Los cinco fixtures de arriba suman exactamente 100**, así que `v / Σv`
    // ya daba entero y borrar el `Math.round` no rompía nada. La cabecera
    // declara justamente lo contrario —que por redondear las cuotas en pantalla
    // pueden sumar 99% o 101%—, y eso no tenía quien lo atestiguara.
    const { container } = render(
      <PlotTreemap
        value={categorica([
          { etiqueta: 'Norte', v: 2 },
          { etiqueta: 'Sur', v: 1 },
        ])}
        family="demanda"
        format={number}
      />,
    )

    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('33%')).toBeInTheDocument()
    // Ninguna cuota con parte decimal, en ningún separador.
    expect(container.textContent).not.toMatch(/\d[.,]\d+%/)
  })

  it('y por eso las cuotas pueden no sumar 100 · queda escrito en una aserción', () => {
    // Es la divergencia declarada de la cabecera. Escrita acá, el día que
    // alguien la arregle la prueba avisa en vez de que el cambio pase callado.
    const { container } = render(
      <PlotTreemap
        value={categorica([
          { etiqueta: 'Una', v: 1 },
          { etiqueta: 'Otra', v: 1 },
          { etiqueta: 'Tercera', v: 1 },
        ])}
        family="demanda"
        format={number}
      />,
    )

    const cuotas = Array.from(container.querySelectorAll('text'))
      .map((t) => t.textContent ?? '')
      .filter((t) => t.endsWith('%'))
      .map((t) => Number(t.slice(0, -1)))
    expect(cuotas).toEqual([33, 33, 33])
    expect(cuotas.reduce((a, b) => a + b, 0)).toBe(99)
  })
})

describe('una hoja ANCHA pero BAJA tampoco lleva nombre', () => {
  it('el mínimo de alto del nombre es una guarda propia · bajarlo a 0 pasaba', () => {
    // Los dos fixtures de arriba pierden el rótulo por ANCHO, así que
    // `NOMBRE_MIN_H` quedaba sin quien lo ejercitara: con el mínimo en cero se
    // pintaba un nombre de cuerpo 12 dentro de un rectángulo de 4,9 de alto,
    // que es exactamente el desborde del frame que la cabecera dice no copiar.
    const { container } = render(
      <PlotTreemap
        value={categorica([
          { etiqueta: 'Mayor', v: 50 },
          { etiqueta: 'Media', v: 25 },
          { etiqueta: 'Tercia', v: 12 },
          { etiqueta: 'Cuarta', v: 12 },
          { etiqueta: 'Laminita', v: 0.7 },
        ])}
        family="demanda"
        format={number}
      />,
    )

    // 140,7 × 133: ancha y alta, lleva las dos líneas.
    expect(screen.getByText('Tercia')).toBeInTheDocument()
    // 140,7 × 4,9: ancho de sobra y sin alto para una línea de cuerpo 12.
    expect(screen.queryByText('Laminita')).toBeNull()
    expect(container.textContent).not.toContain('1%')
  })
})
