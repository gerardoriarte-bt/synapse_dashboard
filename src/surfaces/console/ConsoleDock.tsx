/** La barra inferior de la consola · §PEN:C1 · F3.15
 *
 *  **Es la PRESENCIA del chat**, que es lo que se pidió el 2026-09-22: *«el chat
 *  debe tener presencia, es una funcionalidad importante para el uso de Synapse,
 *  no un complemento»*. La persiana ya existía —`ChatOverlay`—; lo que faltaba
 *  era esto.
 *
 *  ── ESCRITO DESDE EL FRAME, NO DESDE LA NOTA ───────────────────────────────
 *
 *  La regla del repositorio es abrir el dibujo antes de escribir la primera
 *  línea, y leer el **frame** antes que la nota: los frames tienen los números.
 *  Leído el 2026-09-26 sobre las dieciséis pantallas de consola del `.pen`.
 *
 *  **Hay TRES composiciones, no una**, y sólo se ven comparando los frames:
 *
 *  | | 1440 | 768 | 360 |
 *  |---|---|---|---|
 *  | alto | 56 | **52** | **52** |
 *  | padding lateral | 24 | **20** | **20** |
 *  | fondo | `$dock` | **ninguno** | **ninguno** |
 *  | botón | 32 alto, `$r-lg`, borde `$w3`, **con** icono | 28, `$r-md`, `$elev`, **sin** icono | igual que 768 |
 *  | texto del botón | mono 10 `$ink` | **mono 9 `$dim`** | igual que 768 |
 *  | derecha | punto + línea de contexto | línea corta, **sin punto** | **un botón `DECISIONES`** |
 *  | tamaño de esa línea | mono 10 · `Label` | **mono 9 · `Note`** | — |
 *
 *  El plan resumía «banda de 56» y eso es cierto sólo en escritorio.
 *
 *  ── LO QUE NO SE CONSTRUYE, Y POR QUÉ ──────────────────────────────────────
 *
 *  **El `DECISIONES` de 360 no se pinta.** `/config/decisiones` no existe en el
 *  servicio —el cable lo declara en «lo que no está»— así que sería un CTA que
 *  devuelve 404. Regla del CTA muerto: un botón que se aprieta y no lleva a
 *  ningún lado es peor que su ausencia. A 360 la barra queda con el botón de
 *  preguntar y nada a la derecha, que es lo que la nota del `.pen` ya describe:
 *  «el pie suelta el contexto».
 *
 *  ── LA LÍNEA DE CONTEXTO DECLARA LO QUE VIAJA ──────────────────────────────
 *
 *  `CONTEXTO · {TENANT} · {PESTAÑA} · {PERÍODO} · {N} PANELES`, literal del
 *  frame. **Y `N` es el número de paneles que el usuario ve**, no el del layout:
 *  `GET /config/tabs/{tabId}` ya viene filtrado por `roles.hidden_metric_ids`
 *  —medido el 2026-09-26: el mismo tab da 12 paneles a `admin` y **9** a
 *  `planner`— y el contexto que el servicio arma usa el mismo filtro,
 *  `FindByTab(tab.ID, hidden)`.
 *
 *  Así que lo que la barra declara es exactamente lo que viaja, que es el
 *  criterio de F3.15. No es una coincidencia feliz: es la misma lista.
 */
import { Label } from '../../render/primitives/Label'
import { Note } from '../../render/primitives/Note'

type Props = {
  /** El nombre corto del cliente · la primera parte de la línea. */
  tenant: string
  /** El nombre de la pestaña activa. */
  pestana: string
  /** Ya formateado para mostrar · el dock no formatea períodos. */
  periodo: string
  /** **Los paneles VISIBLES**, que son los que viajan. Ver el encabezado. */
  paneles: number
  /** **Sin manejador no hay botón** · regla del CTA muerto. */
  onPreguntar?: (() => void) | undefined
}

export function ConsoleDock({ tenant, pestana, periodo, paneles, onPreguntar }: Props) {
  return (
    <div
      // **Los cortes son los de la GRILLA, no unos nuevos.** `COLUMNS_BY_WIDTH`
      // dice ≤767 una columna, ≤1279 seis, arriba doce — y el `.pen` dibuja
      // exactamente tres docks, uno por escalón. `md` es 768 y `xl` es 1280, así
      // que caen encima sin inventar nada.
      //
      // `h-13` son 52 y `h-14` son 56 · `--spacing: 4px`.
      className="flex h-13 w-full items-center gap-2.5 border-t border-w2 px-5 xl:h-14 xl:bg-dock xl:px-6"
    >
      {onPreguntar !== undefined && (
        <button
          type="button"
          onClick={onPreguntar}
          // Dos apariencias, una por frame: abajo de 1280 es la
          // chica —`$elev`, radio medio, sin borde— y arriba la de escritorio.
          className="flex h-7 cursor-pointer items-center gap-1.75 rounded-md border-0 bg-elev px-2.5 text-nota leading-rotulo tracking-rotulo font-mono uppercase text-dim xl:h-8 xl:gap-2 xl:rounded-lg xl:border xl:border-w3 xl:bg-transparent xl:px-3 xl:text-label xl:text-ink"
        >
          {/* El `sparkles` del frame · sólo en escritorio, donde el dibujo lo
              pone. Los dos frames responsive no lo llevan. */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hidden size-3.5 shrink-0 xl:block"
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          Preguntar a Synapse
        </button>
      )}

      {/* El `Spacer` del frame. */}
      <div className="flex-1" />

      {/* **A 360 el pie SUELTA el contexto**, que es lo que dice la nota del
          `.pen` a ese ancho y lo que su frame dibuja. No se encoge el texto:
          una línea de contexto ilegible declara igual de mal que ninguna. */}
      <div className="hidden items-center gap-2 md:flex">
        {/* El punto de 7 · sólo a doce columnas. El frame de 768 no lo lleva. */}
        <span
          aria-hidden
          className="hidden size-1.75 shrink-0 rounded-full bg-fam-medios-1 xl:block"
        />
        {/* ── DOS PRIMITIVOS, PORQUE SON DOS TAMAÑOS ──────────────────────────
            **A 768 la línea es NOTA y a 1440 es LABEL**, y no es un matiz: son
            dos de los cuatro roles mono que §2.3 declara y cierra. Censado sobre
            los dieciséis frames de consola el 2026-09-28 — las trece pantallas
            de escritorio la ponen en **10 `$ink`/`$dim`** y el frame de 768 en
            **9 `$dim`**, igual que el texto de su botón.

            **Acá estaba con `Label` en los tres anchos**, así que a seis
            columnas se pintaba un punto más grande que el dibujo. F3.15 se cerró
            diciendo que las dos composiciones responsive **no se habían podido
            VER** —la ventana estaba maximizada— y esto es lo que aparece al
            mirarlas: la que se vio estaba bien y la que no, no. */}
        {/* **El color lo pone quien usa `Note`**, que no fija ninguno a
            propósito —el `.pen` la dibuja en `$dim` acá y en `$acc` dentro del
            badge de degradado—. El frame de 768 la pone en `$dim`. */}
        <span className="text-dim xl:hidden">
          <Note as="span">{`${tenant} · ${periodo}`}</Note>
        </span>
        <span className="hidden xl:inline">
          <Label as="span">
            {`Contexto · ${tenant} · ${pestana} · ${periodo} · ${String(paneles)} ${paneles === 1 ? 'panel' : 'paneles'}`}
          </Label>
        </span>
      </div>
    </div>
  )
}
