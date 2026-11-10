/** Las columnas del editor que quedan a la vista mientras el lienzo se recorre
 *  · 2026-11-10
 *
 *  **Fijas bajo la cabecera REAL, con su propio scroll si no entran.** La
 *  cabecera del builder es `sticky` y mide lo que mida —navbar, barra del
 *  cliente y la de guardar: 177 px medidos ese día—, y `BuilderChrome` publica
 *  su alto en `--alto-cabecera-builder`.
 *
 *  **Eran tres reglas y dos estaban mal**, y lo encontró el humano usándolo: «no
 *  puedo ver el principio del scroll izquierdo». La biblioteca se pegaba a
 *  `top-6`, o sea 24 px, **debajo** de la cabecera: sus primeros 153 px no se
 *  veían nunca, con 1414 de contenido en 799 de alto. Los ajustes de la pestaña
 *  se pegaban bien pero sin alto máximo: más altos que la pantalla, su final no
 *  se alcanzaba. Sólo el configurador de panel lo hacía bien, y ésta es su
 *  regla, puesta en un solo lugar para que no vuelvan a separarse.
 */
export const COLUMNA_FIJA =
  'sticky top-[calc(var(--alto-cabecera-builder,0px)+16px)] max-h-[calc(100vh-var(--alto-cabecera-builder,0px)-32px)] overflow-y-auto'
