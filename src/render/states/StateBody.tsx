/** La gramática común de los estados · §8 · F1.13d
 *
 *  Qué pasa, por qué, y qué se puede hacer. **Un estado sin salida es una
 *  queja.**
 *
 *  Que los cinco estados con marca compartan este componente es lo que impide
 *  que cada pantalla invente su propia gramática de degradación — que es
 *  exactamente lo que §8 existe para evitar.
 */
import type { ReactNode } from 'react'
import { Label } from '../primitives/Label'

/** Mismo recorte que en `Value`: 1px y no 0, porque una caja de altura cero sale
 *  del árbol de accesibilidad, que es lo contrario de lo que se busca acá. */
const SCREEN_READER_ONLY =
  'absolute w-px h-px p-0 -m-px overflow-hidden [clip-path:inset(50%)] whitespace-nowrap border-0'

const BUTTON =
  'font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 ' +
  'cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2'

/** El bloqueado es el único con CTA en acento: es LA acción que desbloquea el
 *  panel, no una acción más. El acento es de acción, nunca de dato — regla dura
 *  1, y por eso este es el único lugar de `states/` donde aparece. */
const BUTTON_PRIMARY =
  'font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 ' +
  'cursor-pointer border border-acc bg-acc text-on-acc hover:bg-acc-hover hover:border-acc-hover'

export type Exit = { text: string; onClick?: () => void; primary?: boolean }

export type BaseProps = {
  /** Cómo se llama este estado, para quien no ve la marca · §1.4.
   *
   *  Las marcas son iconos con `aria-hidden`, así que el significado que cargan
   *  —candado, alerta— no llega al árbol de accesibilidad. La prosa de casi
   *  todos se explica sola («No hay datos de ventas en este período»), pero la
   *  del error es el mensaje del backend: un lector decía «Fallo al resolver»
   *  sin decir que eso era un error.
   *
   *  Ausente donde la marca ya es texto visible que lo nombra, para no decirlo
   *  dos veces. */
  name?: string
  mark: ReactNode
  phrase: string
  /** Lo que el usuario necesita para decidir. Va en mono, como todo metadato. */
  detail?: string
  exit?: Exit
}

export function StateBody({ name, mark, phrase, detail, exit }: BaseProps) {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {name !== undefined && <span className={SCREEN_READER_ONLY}>{name}</span>}
      <div className="flex items-center gap-2 text-dim">{mark}</div>
      <p className="font-body text-cuerpo leading-cuerpo text-ink m-0">{phrase}</p>
      {detail !== undefined && (
        <div className="flex flex-col gap-1">
          <Label>{detail}</Label>
        </div>
      )}
      {exit !== undefined && (
        <div className="mt-auto self-start">
          <button
            type="button"
            className={exit.primary === true ? BUTTON_PRIMARY : BUTTON}
            {...(exit.onClick === undefined ? {} : { onClick: exit.onClick })}
          >
            {exit.text}
          </button>
        </div>
      )}
    </div>
  )
}
