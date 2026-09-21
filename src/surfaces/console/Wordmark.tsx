/** El logotipo de Synapse · portado del repositorio archivado · 2026-09-21
 *
 *  **El `.pen` lo pone primero en los TRES chromes** —C1, A1 y B2 empiezan con
 *  «Synapse»— y no estaba en ninguno: el arte y el componente existían en
 *  `synapse_v2` y nunca se portaron. Es un hueco del traslado, no una decisión.
 *
 *  **El logotipo NO tiene símbolo: es solo la palabra.** Lo decidió el humano el
 *  2026-08-20 y el capítulo `Identidad` del `.pen` lo repite. Un cuadrado al
 *  lado sería una invención.
 *
 *  ── POR QUÉ MÁSCARA Y NO IMAGEN ─────────────────────────────────────────────
 *
 *  **El arte es blanco puro sobre transparente**, así que como `<img>` sobre
 *  fondo claro desaparece. Usar su alfa como máscara y pintar el fondo con un
 *  token resuelve dos cosas de una: el color sale de `--color-ink`, o sea que
 *  **el logotipo se invierte con el tema sin un segundo archivo**, y no hace
 *  falta el SVG —la máscara viene a 4x y esto mide 20px de alto—.
 *
 *  **`ink` y no `acc`.** El capítulo `Identidad` manda «wordmark blanco» para el
 *  navbar y el pie, e `ink` ES el blanco en tema oscuro. La versión en degradado
 *  que esa misma regla pide para superficie clara **está prohibida sobre
 *  superficies con datos**: su azul y su violeta chocan con las familias
 *  `demanda` e `inventario`. La monocroma sirve en los dos temas y es la que va
 *  acá. Queda como propuesta de spec, igual que en v2.
 *
 *  ── POR QUÉ EL ANCHO EN PÍXELES ─────────────────────────────────────────────
 *
 *  **Una máscara con `contain` sobre una caja de ancho automático colapsa a
 *  cero**: no hay contenido que la estire. Los 90px salen de la relación real
 *  del arte —4,475— contra los 20 de alto que declara la anatomía del navbar.
 *  El alto sí es token: `h-5` son 5 × 4px.
 *
 *  **La URL va en un `style` y no en una utilidad** porque tiene que pasar por
 *  el empaquetador: escrita como valor arbitrario de Tailwind, Vite no la
 *  reescribe y el archivo no se encuentra en producción. El color, que es lo
 *  que la regla de tokens gobierna, sigue saliendo de una utilidad.
 */
import wordmark from '../../assets/images/wordmark.png'

export function Wordmark() {
  return (
    <span
      // `role="img"` con nombre: sin esto es una caja vacía en el árbol de
      // accesibilidad, porque el glifo vive en una máscara y no en el texto.
      role="img"
      aria-label="Synapse"
      className="block h-5 w-[90px] flex-none bg-ink"
      style={{
        maskImage: `url(${wordmark})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'left center',
      }}
    />
  )
}
