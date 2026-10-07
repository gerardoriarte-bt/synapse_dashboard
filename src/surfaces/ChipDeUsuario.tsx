/** El usuario en el navbar, con presencia · decisión humana del 2026-10-07
 *
 *  «Darle un poco más de presencia al usuario, no se diferencia con el resto de
 *  información.» Era el nombre en mono de 10, mayúsculas y gris —el traje del
 *  rótulo— en la consola, y una nota de 9 en administración y el builder: se
 *  leía como un dato más de la barra, no como la persona ni como algo que se
 *  aprieta.
 *
 *  Ahora es un control: un círculo con las iniciales y el nombre en Inter, en
 *  `ink`, dentro de un borde. **Es el contenido del botón, no el botón**: cada
 *  menú conserva su propio disparador, su nombre accesible y su panel.
 *
 *  El círculo va en `w3`, neutro: el acento es de estado activo y CTA, y el
 *  usuario no es ninguna de las dos.
 */
import { Note } from '../render/primitives/Note'
import { iniciales } from './usuario'

export function ChipDeUsuario({ nombre, rol }: { nombre: string; rol?: string }) {
  return (
    <>
      <span
        aria-hidden
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-w3 font-body text-label font-semibold text-ink"
      >
        {iniciales(nombre)}
      </span>
      <span className="font-body text-celda font-medium text-ink">{nombre}</span>
      {rol !== undefined && <Note as="span">{rol}</Note>}
      {/* `chevrons-up-down` de 13 en `$dim` · dice que abre algo. */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-dim"
        aria-hidden
      >
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    </>
  )
}
