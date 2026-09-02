/** Los siete estados · §8 de `parametros-front.md` · F1.13d
 *
 *  **Un estado reemplaza el CUERPO, nunca el shell.** Título, BASE y procedencia
 *  siguen visibles mientras el panel carga, falla o está bloqueado. Por eso esto
 *  no sabe nada del shell: se monta adentro.
 *
 *  Los cinco con marca comparten `StateBody`, y que compartan componente es lo
 *  que impide que cada pantalla invente su propia gramática de degradación — que
 *  es exactamente lo que §8 existe para evitar.
 */
import type { ReactNode } from 'react'
import { Label } from '../primitives/Label'

/** Mismo recorte que en `Value`: 1px y no 0, porque una caja de altura cero sale
 *  del árbol de accesibilidad, que es lo contrario de lo que se busca acá. */
const SCREEN_READER_ONLY =
  'absolute w-px h-px p-0 -m-px overflow-hidden [clip-path:inset(50%)] whitespace-nowrap border-0'

const BUTTON =
  'font-mono text-[10px] tracking-[0.12em] uppercase rounded-md px-4 py-2 ' +
  'cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2'

/** El bloqueado es el único con CTA en acento: es LA acción que desbloquea el
 *  panel, no una acción más. El acento es de acción, nunca de dato — regla dura
 *  1, y por eso este es el único lugar de `states/` donde aparece. */
const BUTTON_PRIMARY =
  'font-mono text-[10px] tracking-[0.12em] uppercase rounded-md px-4 py-2 ' +
  'cursor-pointer border border-acc bg-acc text-on-acc hover:bg-acc-hover hover:border-acc-hover'

type Exit = { text: string; onClick?: () => void; primary?: boolean }

type BaseProps = {
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

/** La gramática común de §8: qué pasa, por qué, y qué se puede hacer.
 *  **Un estado sin salida es una queja.** */
function StateBody({ name, mark, phrase, detail, exit }: BaseProps) {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {name !== undefined && <span className={SCREEN_READER_ONLY}>{name}</span>}
      <div className="flex items-center gap-2 text-dim">{mark}</div>
      <p className="font-body text-[13px] leading-normal text-ink m-0">{phrase}</p>
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

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden
  >
    {children}
  </svg>
)

/** Esqueleto con la forma del panel final. **Nunca un spinner:** los paneles
 *  cargan en paralelo y aparecen a medida que llegan, así que un spinner por
 *  panel sería una pantalla de ruletas girando a destiempo. */
export function LoadingState() {
  return (
    <div className="flex flex-col gap-3 h-full" aria-busy="true" aria-label="Cargando">
      <div className="bg-w2 rounded-xs h-3 w-2/5" />
      <div className="bg-w1 rounded-sm flex-1 min-h-0" />
      <div className="bg-w2 rounded-xs h-3 w-1/4" />
    </div>
  )
}

/** Invitación a actuar, no un error. Dice qué falta y cómo conseguirlo. */
export function EmptyState({ phrase, detail, exit }: Omit<BaseProps, 'mark' | 'name'>) {
  return (
    <StateBody
      name="Sin datos"
      mark={
        <Icon>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 13h5l1 2h6l1-2h5" />
        </Icon>
      }
      phrase={phrase}
      {...(detail === undefined ? {} : { detail })}
      {...(exit === undefined ? {} : { exit })}
    />
  )
}

/** Sin número. Razón, qué lo desbloquea y CTA · §8.
 *
 *  La marca dice SIN VALOR APROXIMADO porque **la ausencia de cifra es la
 *  información**, no una carencia de la pantalla: si un feed está vencido, un
 *  número aproximado sería peor que ninguno. */
export function BlockedState({
  reason,
  unblockedBy,
  onUnblock,
}: {
  reason: string
  unblockedBy: string
  onUnblock?: () => void
}) {
  return (
    <StateBody
      // Sin `name`: su marca ya es texto visible que dice «Bloqueado».
      mark={<Label>Bloqueado · sin valor aproximado</Label>}
      phrase={reason}
      detail={`Qué lo desbloquea · ${unblockedBy}`}
      exit={{
        text: 'Resolver',
        primary: true,
        ...(onUnblock === undefined ? {} : { onClick: onUnblock }),
      }}
    />
  )
}

/** Qué se pidió, por qué no llega a este rol, y a quién solicitarlo. */
export function ForbiddenState({
  requestTo,
  onRequest,
}: {
  requestTo: string
  onRequest?: () => void
}) {
  return (
    <StateBody
      name="Sin permiso"
      mark={
        <Icon>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </Icon>
      }
      phrase="Esta métrica no está disponible para tu rol."
      detail={`Quién lo decide · ${requestTo}`}
      exit={{ text: 'Solicitar acceso', ...(onRequest === undefined ? {} : { onClick: onRequest }) }}
    />
  )
}

/** Qué falló y qué hacer. **Reintento por panel, nunca de página:** el resto de
 *  los paneles cargó bien y recargar los tiraría también. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <StateBody
      name="Error"
      mark={
        <Icon>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6" />
          <circle cx="12" cy="16.5" r=".5" fill="currentColor" />
        </Icon>
      }
      phrase={message}
      detail="El resto de los paneles cargó normalmente"
      exit={{
        text: 'Reintentar este panel',
        ...(onRetry === undefined ? {} : { onClick: onRetry }),
      }}
    />
  )
}
