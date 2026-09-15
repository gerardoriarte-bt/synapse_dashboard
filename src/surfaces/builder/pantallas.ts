/** Las seis pantallas del builder · §7.2 de `design.md` · F4.6
 *
 *  **Aparte del chrome porque son un dato, no un render** — la misma razón que en
 *  `admin/pantallas.ts`: §4 regla 3 pide un componente por archivo y
 *  `design-lint` lo hace cumplir.
 *
 *  ── LO QUE NO ES UNIFORME ACÁ ES EL ANCHO ───────────────────────────────────
 *
 *  En administración lo que cambia con la pantalla es el **alcance**; acá cambia
 *  el **ancho mínimo**, y por una razón que §4 escribe entera:
 *
 *  > «Builder · 1600 mínimo **1600**. El lienzo del cliente se renderiza **1:1 a
 *  > 1200px** más 300 de biblioteca: a otra escala las unidades de arrastre
 *  > mentirían. **La excepción es B5, que va a 1440** porque muestra la consola
 *  > del cliente a su ancho real.»
 *
 *  Son dos motivos distintos y conviene no fundirlos. En B1–B4 y B6 el 1600 es
 *  **el lienzo más la biblioteca**: si el lienzo se escala, un panel de `colSpan`
 *  4 deja de medir cuatro columnas en pantalla y el arrastre pierde su unidad.
 *  En B5 el 1440 es **la consola del cliente a su ancho real**: la vista previa
 *  no es una maqueta del builder, es la pantalla que el rol va a ver, y
 *  mostrarla a 1600 la mostraría a un ancho que ningún usuario tiene.
 *
 *  **Y ninguno de los dos colapsa.** §4 gobierna el grid de paneles —la consola
 *  del cliente— y estas dos superficies «no son grids y declaran ancho mínimo en
 *  vez de colapso». Abajo del mínimo hay scroll, que es visible; un colapso
 *  perdería la correspondencia 1:1 sin decirlo.
 */
export const PANTALLAS = [
  {
    id: 'contexto',
    ruta: '/builder',
    nombre: 'Contexto de edición',
    /** §4: 1600 = 1200 de lienzo 1:1 + 300 de biblioteca. */
    ancho: 1600,
  },
  { id: 'canvas', ruta: '/builder/canvas', nombre: 'Canvas', ancho: 1600 },
  { id: 'grafico', ruta: '/builder/grafico', nombre: 'Selector de gráfico', ancho: 1600 },
  { id: 'metrica', ruta: '/builder/metrica', nombre: 'Binder de métrica', ancho: 1600 },
  {
    id: 'preview',
    ruta: '/builder/preview',
    nombre: 'Vista previa por rol',
    /** La excepción de §4: la consola del cliente a su ancho real. */
    ancho: 1440,
  },
  { id: 'historial', ruta: '/builder/historial', nombre: 'Historial de versiones', ancho: 1600 },
] as const

export type PantallaId = (typeof PANTALLAS)[number]['id']
