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
 *  ── DOS VERSIONES, Y CUÁL VA DÓNDE LO DECIDE EL `.pen` ──────────────────────
 *
 *  El capítulo `Identidad` declara **tres** versiones y dice para qué superficie
 *  es cada una. Acá viven dos de las tres —la del lockup con bajada es para
 *  materiales fuera de la app— y **la regla de cuál va dónde es suya, no
 *  nuestra**:
 *
 *  > **SÍ · SUPERFICIES SIN DATOS** · «Navbar y pie de la consola — wordmark
 *  > monocromo» · «Login y pantallas de sesión» · «Portada de exportación» ·
 *  > «C5 · sin permiso, y estados vacíos de pantalla completa».
 *  >
 *  > **NO · NUNCA EN DATOS NI EN CHROME DE PANEL.** «El azul #4842FA y el
 *  > violeta #846DC5 caen sobre las familias demanda e inventario. Usarlos como
 *  > chrome rompería la **persistencia cromática**, que es el mecanismo de
 *  > asociación entre vistas.»
 *
 *  **`mono` · el chrome.** `ink` y no `acc`: el capítulo manda «wordmark
 *  blanco», e `ink` ES el blanco en tema oscuro, así que **se invierte con el
 *  tema sin un segundo archivo**.
 *
 *  **`marca` · las superficies sin datos.** «Naranja a violeta a azul», dice el
 *  `.pen`, y esos tres son tokens: el degradado se arma con
 *  `--color-brand-naranja`, `--color-brand-violeta` y `--color-brand-azul` sobre
 *  **la misma máscara**. Un solo archivo de arte para las dos, y ningún hex.
 *
 *  **Por qué el degradado no entra al navbar aunque la distancia de matiz lo
 *  permita** · medido el 2026-09-22: el azul de marca está a 42–44° de
 *  `demanda`, o sea que **no se confunden a la vista**. El argumento del `.pen`
 *  no es de matiz sino de **sistema**: en Synapse un color significa una
 *  familia, y meter un cuarto azul en el chrome enseña que a veces no significa
 *  nada. Por eso la medición no alcanza para mover esta regla — ver
 *  `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` · §3.
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

type Props = {
  /** `mono` es el defecto **a propósito**: el chrome es el uso frecuente, y el
   *  que se equivoca por omisión tiene que equivocarse del lado permitido. */
  variante?: 'mono' | 'marca'
  /** Alto en unidades de la escala de espaciado · `5` son 20px, la anatomía del
   *  navbar. El ancho se deriva: una máscara con `contain` sobre una caja de
   *  ancho automático **colapsa a cero**, porque no hay contenido que la
   *  estire. */
  alto?: 5 | 8 | 10
}

/** El ancho sale de la relación real del arte —4,475— contra cada alto. Se
 *  tabula en vez de calcularse en el JSX para que Tailwind vea las clases
 *  escritas: una utilidad armada en runtime no la genera. */
const MEDIDAS = {
  5: 'h-5 w-[90px]',
  8: 'h-8 w-[143px]',
  10: 'h-10 w-[179px]',
} as const

/** «Naranja a violeta a azul» · el orden lo declara el `.pen` y los tres son
 *  tokens. El ángulo sigue el arte: el naranja arranca arriba a la izquierda. */
const MARCA =
  'linear-gradient(105deg, var(--color-brand-naranja) 0%, ' +
  'var(--color-brand-violeta) 52%, var(--color-brand-azul) 100%)'

export function Wordmark({ variante = 'mono', alto = 5 }: Props) {
  return (
    <span
      // `role="img"` con nombre: sin esto es una caja vacía en el árbol de
      // accesibilidad, porque el glifo vive en una máscara y no en el texto.
      role="img"
      aria-label="Synapse"
      className={`block flex-none ${MEDIDAS[alto]} ${variante === 'mono' ? 'bg-ink' : ''}`}
      style={{
        maskImage: `url(${wordmark})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'left center',
        ...(variante === 'marca' ? { backgroundImage: MARCA } : {}),
      }}
    />
  )
}
