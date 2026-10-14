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
 *
 *  ── Y EL CHROME TAMPOCO ES UNIFORME · corregido el 2026-09-15 ───────────────
 *
 *  **Sale del `.pen`, que tiene las seis pantallas dibujadas.** La primera
 *  versión de esta tabla no lo sabía y puso el contexto y las acciones en barras
 *  dentro del cuerpo; el diseño las tiene en la cabecera, y persistentes. Cuatro
 *  formas, y cada una dice algo distinto:
 *
 *  | | Qué lleva | Por qué |
 *  |---|---|---|
 *  | `identidad` | Marca y quién sos | **B1 elige el contexto**, así que no puede mostrarlo ya elegido |
 *  | `composicion` | Contexto · cambios sin guardar · vista previa · publicar | Se compone, y hay algo que perder |
 *  | `contexto` | Contexto · volver a editar | Se mira, no se toca |
 *  | `ninguno` | Nada | **B5 pinta la consola del cliente**: «SIN CHROME DE EDICIÓN · DATOS REALES · ASÍ SE PUBLICA» |
 *
 *  **Que el contexto sea persistente es la mitad de para qué existe.** Al salir
 *  de B1 con el chrome viejo se perdía de vista sobre qué cliente y qué rol se
 *  estaba componiendo; y «3 cambios sin guardar» en una barra del cuerpo
 *  desaparece al cambiar de pantalla, que es justo cuando hace falta.
 */

export type FormaDeChrome = 'identidad' | 'composicion' | 'contexto' | 'ninguno'
export const PANTALLAS = [
  {
    id: 'contexto',
    ruta: '/builder',
    /** **«Dashboards» desde el 2026-10-07** · era «Contexto de edición». Es el
     *  primer nivel de Cliente → Dashboard → Editor
     *  (`docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`, D1). */
    nombre: 'Dashboards',
    /** §4: 1600 = 1200 de lienzo 1:1 + 300 de biblioteca. */
    ancho: 1600,
    /** **Debería ser `identidad` y es `composicion`, temporalmente.**
     *
     *  En el `.pen` B1 solo elige el contexto —«¿Sobre qué se va a componer?»— y
     *  la composición ocurre en B2. Acá B1 hospeda además el editor de pestañas
     *  y el configurador de panel, porque **B2 todavía no existe**: es F4.9, que
     *  espera la decisión de diseño del arrastre.
     *
     *  Mientras haga las dos cosas necesita el chrome de las dos: sin el
     *  contador y el botón de guardar, la pantalla donde se edita no tiene cómo
     *  guardar. **El día que F4.9 mueva la composición a B2, esto vuelve a
     *  `identidad`** y el cambio es esta línea.
     *
     *  **2026-10-06: la composición se mudó, y la línea sigue igual.** El
     *  configurador de panel ya vive en el inspector del canvas, pero B1 todavía
     *  edita lo que es de la pestaña —nombre, pregunta, quién la ve— y eso hay
     *  que poder guardarlo sin ir a otra pantalla. Lo que sí cambió: el chrome no
     *  repite acá el cliente y el rol, que son los controles del cuerpo. */
    chrome: 'composicion',
    enNav: true,
  },
  {
    id: 'canvas',
    ruta: '/builder/canvas',
    /** **«Editor» desde el 2026-10-07** · D5: «Canvas» era una palabra nuestra,
     *  no del producto. */
    nombre: 'Editor',
    ancho: 1600,
    chrome: 'composicion',
    enNav: true,
  },
  {
    id: 'grafico',
    ruta: '/builder/grafico',
    nombre: 'Selector de gráfico',
    ancho: 1600,
    chrome: 'composicion',
    /** **D3 de la auditoría del 2026-10-06: fuera de la navegación.** Llevaba a
     *  un texto que decía que la pantalla estaba en otra. Sigue declarada —
     *  `pen-pantallas` pide que B3 tenga quien la implemente, y desde el
     *  2026-10-07 la implementa la columna «Cómo se ve» de `PanelConfigurator`—
     *  pero declarar una pantalla no obliga a ofrecerle una pestaña. */
    enNav: false,
  },
  {
    id: 'metrica',
    ruta: '/builder/metrica',
    nombre: 'Binder de métrica',
    ancho: 1600,
    chrome: 'composicion',
    /** Igual que el selector de gráfico: vive en el inspector del canvas. */
    enNav: false,
  },
  {
    id: 'preview',
    ruta: '/builder/preview',
    nombre: 'Vista previa por rol',
    /** La excepción de §4: la consola del cliente a su ancho real. */
    ancho: 1440,
    chrome: 'ninguno',
    /** Repetía el botón `Vista previa` del chrome, a 40px. Se llega por el botón. */
    enNav: false,
  },
  {
    id: 'historial',
    ruta: '/builder/historial',
    nombre: 'Historial de versiones',
    ancho: 1600,
    chrome: 'contexto',
    enNav: true,
  },
] as const satisfies readonly {
  id: string
  ruta: string
  nombre: string
  ancho: 1600 | 1440
  chrome: FormaDeChrome
  /** Si lleva pestaña en la navegación · ver D3 arriba. */
  enNav: boolean
}[]

export type PantallaId = (typeof PANTALLAS)[number]['id']
