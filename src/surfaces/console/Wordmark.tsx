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
 *  ── EL ARTE ES EL REAL · 2026-10-06 ──────────────────────────────────────────
 *
 *  Hasta acá la máscara era una grotesca portada de `synapse_v2` y el degradado
 *  se armaba con los tres tokens `brand-*`: una aproximación del logotipo, no el
 *  logotipo. Los dos archivos salen ahora del arte entregado
 *  —`design/SYNAPSE BT COLORS - LIGHT BKG (3).png`—, recortado a la palabra:
 *  **la bajada «A LICENSED SOLUTION BY LO.BUENO GROUP» queda afuera** porque va
 *  en azul marino, desaparece en tema oscuro y a 20px no se lee.
 *
 *  - `wordmark.png` · la palabra en blanco puro, para la máscara de `mono`.
 *  - `wordmark-marca.png` · la palabra con su degradado real, que es en dos
 *    ejes —el naranja se aclara hacia abajo— y no se reproduce con un
 *    `linear-gradient` de tres paradas.
 *
 *  ── EL DEGRADADO ENTRA AL CHROME · decisión de marca, 2026-10-06 ────────────
 *
 *  El capítulo `Identidad` del `.pen` dice «NUNCA EN DATOS NI EN CHROME DE
 *  PANEL» y reservaba el degradado a superficies sin datos. **El humano decidió
 *  el 2026-10-06 llevarlo también a los tres navbars.** Es una decisión que
 *  contradice el `.pen` y por eso queda escrita en
 *  `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` · §3, para que diseño
 *  actualice `Identidad`. El agente no edita el `.pen`.
 *
 *  `mono` sigue existiendo para lo que el `.pen` todavía pide monocromo —el
 *  pie—, y se invierte con el tema porque pinta con `--color-ink`.
 *
 *  ── POR QUÉ EL ANCHO EN PÍXELES ─────────────────────────────────────────────
 *
 *  **Una máscara con `contain` sobre una caja de ancho automático colapsa a
 *  cero**: no hay contenido que la estire. Los 90px salen de la relación real
 *  del arte —4,48— contra los 20 de alto que declara la anatomía del navbar.
 *  El alto sí es token: `h-5` son 5 × 4px.
 *
 *  **La URL va en un `style` y no en una utilidad** porque tiene que pasar por
 *  el empaquetador: escrita como valor arbitrario de Tailwind, Vite no la
 *  reescribe y el archivo no se encuentra en producción.
 */
import wordmark from '../../assets/images/wordmark.png'
import wordmarkMarca from '../../assets/images/wordmark-marca.png'

type Props = {
  /** `marca` va en los navbars y el login desde el 2026-10-06; `mono` queda
   *  para lo que el `.pen` sigue pidiendo monocromo. */
  variante?: 'mono' | 'marca'
  /** Alto en unidades de la escala de espaciado · `5` son 20px, la anatomía del
   *  navbar. El ancho se deriva: una máscara con `contain` sobre una caja de
   *  ancho automático **colapsa a cero**, porque no hay contenido que la
   *  estire. */
  alto?: 5 | 8 | 10
}

/** El ancho sale de la relación real del arte —4,48— contra cada alto. Se
 *  tabula en vez de calcularse en el JSX para que Tailwind vea las clases
 *  escritas: una utilidad armada en runtime no la genera. */
const MEDIDAS = {
  5: 'h-5 w-[90px]',
  8: 'h-8 w-[143px]',
  10: 'h-10 w-[179px]',
} as const

export function Wordmark({ variante = 'mono', alto = 5 }: Props) {
  if (variante === 'marca')
    return <img src={wordmarkMarca} alt="Synapse" className={`block flex-none ${MEDIDAS[alto]}`} />
  return (
    <span
      // `role="img"` con nombre: sin esto es una caja vacía en el árbol de
      // accesibilidad, porque el glifo vive en una máscara y no en el texto.
      role="img"
      aria-label="Synapse"
      className={`block flex-none bg-ink ${MEDIDAS[alto]}`}
      style={{
        maskImage: `url(${wordmark})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'left center',
      }}
    />
  )
}
