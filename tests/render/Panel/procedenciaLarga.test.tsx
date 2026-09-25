// @vitest-environment jsdom

/** La procedencia de un catálogo REAL no cabe en una palabra · 2026-09-25
 *
 *  **El defecto que cierra.** `Provenance` envolvía la fuente en un
 *  `<span className="truncate">`, y eso **no recortaba nada**: `truncate` es
 *  `nowrap` + `overflow:hidden`, y sobre un `<span>` inline dentro de otro span
 *  no hay caja con ancho que clipear. Quedaba el `nowrap` solo, así que la
 *  fuente se salía del panel.
 *
 *  Medido en el navegador el 2026-09-25, con el catálogo que datos curó:
 *  **360px fuera del panel en ROAS, 317 en Unidades, 310 en Órdenes, y 292px de
 *  scroll horizontal en la página entera** — que §3.1 prohíbe.
 *
 *  **Por qué no se vio antes**: la semilla traía `ERP` y `Ads API`. El catálogo
 *  real trae frases de una línea y media. Es el mismo modo de falla que el
 *  título del panel el 2026-09-24 —el fixture copiaba el dibujo, y el dibujo
 *  usa textos de ejemplo cortos—, y la tercera vez que aparece: **una cota que
 *  nadie declaró porque el dato de prueba nunca la tensó.**
 *
 *  ── LO QUE ESTA PRUEBA PUEDE Y NO PUEDE HACER ──────────────────────────────
 *
 *  **No puede ver el desbordamiento.** jsdom no tiene motor de maquetado: todo
 *  mide cero y `getBoundingClientRect` devuelve ceros, así que la aserción
 *  «se sale del panel» es imposible acá. Eso lo encontró abrir la aplicación, y
 *  la medición quedó escrita arriba en vez de en la memoria de alguien.
 *
 *  **Lo que sí fija** es lo que hacía imposible envolver: que la procedencia no
 *  vuelva a declararse `nowrap`, y que la fuente larga llegue ENTERA al DOM —
 *  si alguien la recorta en JS, §1.3 deja de cumplirse y esto falla.
 */
import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Provenance } from '@/render/Panel/Provenance'
import { createFormat } from '@/render/format'

const format = createFormat('es-MX')
const now = new Date('2026-09-25T12:00:00Z')

/** Copiada del catálogo real, no inventada · `roas`, tal como la devuelve
 *  `/config/catalog` después de `sync-catalog`. Un fixture corto acá volvería a
 *  esconder el defecto, que es exactamente lo que pasó. */
const FUENTE_REAL =
  'Reporte diario de ecommerce del cliente · venta de Adobe Analytics e inversión bruta de medios'

describe('la fuente curada llega entera', () => {
  it('se pinta completa · §1.3 hace la procedencia obligatoria', () => {
    const { container } = render(
      <Provenance
        capa="GOLD"
        fuente={FUENTE_REAL}
        frescura="2026-09-25T06:00:00Z"
        format={format}
        now={now}
      />,
    )
    // Entera: ni cortada en JS ni reemplazada por un resumen. Un ellipsis
    // esconde parte de la procedencia, y la procedencia es obligatoria.
    expect(container.textContent).toContain(FUENTE_REAL)
    expect(container.textContent).not.toContain('…')
  })

  it('la capa sigue legible y no se parte · es lo primero que se lee', () => {
    // BRONZE/SILVER/GOLD cambia cómo se interpreta el número, así que va en su
    // propia caja: la frase de al lado es la que cede el ancho, no ella.
    render(
      <Provenance
        capa="GOLD"
        fuente={FUENTE_REAL}
        frescura="2026-09-25T06:00:00Z"
        format={format}
        now={now}
      />,
    )
    expect(screen.getByText('GOLD')).toBeInTheDocument()
  })

  it('y la frescura no se pierde detrás de la frase larga', () => {
    const { container } = render(
      <Provenance
        capa="GOLD"
        fuente={FUENTE_REAL}
        frescura="2026-09-25T06:00:00Z"
        format={format}
        now={now}
      />,
    )
    expect(container.textContent).toMatch(/HACE 6 H/i)
  })
})

describe('la procedencia NO se declara `nowrap`', () => {
  /** Aserción estática, del mismo tipo que `tests/tokens/escala.test.ts`: mira
   *  el texto del archivo porque el efecto —envolver o no— no existe en jsdom.
   *
   *  Es la que se le escapó al compilador, al lint y a la puerta durante meses:
   *  `truncate` compila, pasa el lint y se ve bien mientras el dato sea corto. */
  it('ni `truncate` ni `whitespace-nowrap` en `Provenance.tsx`', () => {
    const fuente = readFileSync('src/render/Panel/Provenance.tsx', 'utf-8')
    // Sin los comentarios: el de este archivo explica el defecto y NOMBRA la
    // utilidad, así que un grep crudo se marcaría a sí mismo.
    const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(codigo).not.toMatch(/\btruncate\b/)
    expect(codigo).not.toMatch(/\bwhitespace-nowrap\b/)
    // Y lo que SÍ tiene que estar, en el lugar exacto: **el `<span>` que
    // envuelve la FUENTE**. Buscar `min-w-0` en cualquier parte del archivo no
    // alcanza —el contenedor de afuera también lo lleva— y una mutación que se
    // lo quitaba al de adentro sobrevivía.
    expect(codigo).toMatch(/min-w-0[^]{0,80}<Label>[^]{0,60}\{fuente\}/)
  })
})
