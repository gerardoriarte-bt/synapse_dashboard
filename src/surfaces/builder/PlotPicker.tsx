/** El selector de gráfico · §PEN:B3 · F4.21
 *
 *  ── LEÍDO DEL DIBUJO, Y SUS DOS NOTAS ───────────────────────────────────────
 *
 *  `B3 · Selector de gráfico` y `B3 · Selector · gráfico deshabilitado por tope`,
 *  abiertos el 2026-09-29. La hoja mide **1280 × 940** sobre `$panel`, con
 *  cabecera, cuerpo agrupado **por forma** y un pie de 64 en `$dock`.
 *
 *  Los literales son los del frame, no una paráfrasis:
 *
 *  | Dónde | Texto |
 *  |---|---|
 *  | Título · 19 `$ink` | `Elegir gráfico` |
 *  | Contrato · 9 | `TIPO {tipo}` · `ACEPTA` · las formas |
 *  | Conteo · 9 `$dim` | `N GRÁFICOS DE LOS 43 DEL REPERTORIO` |
 *  | Aviso · 9 `$dim` | `EL PREVIEW ES EL ESPÉCIMEN DE LA LIBRERÍA, NO UNA MINIATURA APARTE` |
 *  | Cada grupo | la forma en 10 `$ink`, y `N DE M MOSTRADOS` en 9 `$dim` |
 *  | Pie | `ELEGIDO EL GRÁFICO, EL BINDER FILTRA LAS MÉTRICAS QUE PUEDE RENDERIZAR` |
 *  | Botones | `VOLVER` y `ELEGIR MÉTRICA` |
 *
 *  ── TRES COSAS DEL DIBUJO QUE NO SE CONSTRUYEN, CADA UNA CON SU RAZÓN ───────
 *
 *  **1 · El preview.** La nota es explícita: «el preview es el espécimen de la
 *  librería, no una miniatura aparte: un Plot no escala al fijar el tamaño de la
 *  instancia, así que dibujar miniaturas habría creado una segunda fuente que se
 *  desincroniza». Tiene razón, y por eso **no se dibuja una miniatura**. Lo que
 *  falta para montar el plot real es el **espécimen**: un valor de muestra por
 *  forma, que no lo declara ni el contrato ni `/config/plots`. Inventarlo acá
 *  sería meter cifras fabricadas en el producto. Queda como propuesta de spec.
 *
 *  **2 · La opción DESHABILITADA por tope.** El dibujo la muestra sin preview y
 *  con la razón del tope donde iba la descripción —«la razón va donde estaba la
 *  descripción, que es donde el ojo ya estaba mirando»—. **Para saber si un tope
 *  se excede hace falta el DATO**, y el builder no lo tiene: F4.12 decidió que el
 *  preview por rol va sin payloads, con su razón escrita. Acá el tope se
 *  **declara** en vez de evaluarse, que es exactamente lo que pide el criterio de
 *  F4.21 —«para que quien compone sepa **antes de publicar** que el gráfico va a
 *  quedar vacío en un tenant chico»—.
 *
 *  **3 · La descripción de una línea** —`UNA CATEGORÍA, UNA MEDIDA` en el frame—.
 *  El repertorio no la lleva: `Grafico` declara `id`, `nombre`, `formas`,
 *  `soportaBanda`, `minimos` y `tope`, y nada más. Es copy de producto y
 *  escribirla acá sería inventarla. Propuesta de spec, con las otras dos.
 *
 *  ── Y UNA QUE SÍ CAMBIA RESPECTO DEL DIBUJO ────────────────────────────────
 *
 *  **El flujo.** La nota dice «se abre al soltar un tipo», y en este builder el
 *  gráfico se elige desde el configurador del panel, con la métrica ya puesta.
 *  Mover el selector al drop reordena el flujo entero —gráfico antes que
 *  métrica— y eso es F4.10, no esta tarea. Queda anotado.
 */
import { useMemo } from 'react'
import { Label } from '../../render/primitives/Label'
import { Accion } from '../../render/primitives/Accion'
import { nombreDeForma, nombreDeTipo } from './rotulos'
import { Note } from '../../render/primitives/Note'
import type { ChartId, Plot, Shape } from '../../catalog/types'

type Props = {
  /** El tipo de panel ya elegido · lo pinta la línea de contrato. */
  tipo: string
  /** Las que ese tipo acepta, de `/config/blocks`. **Gobiernan la lista**: un
   *  gráfico que no sirve ninguna de estas no se muestra, ni deshabilitado. */
  formasDelTipo: readonly Shape[]
  /** El repertorio entero, de `/config/plots`. */
  plots: readonly Plot[]
  /** El elegido hoy, si hay. Ausente es válido y significa «el de por defecto
   *  del tipo» — el criterio lo pide explícitamente. */
  actual?: ChartId | undefined
  onElegir: (id: ChartId) => void
  onVolver: () => void
}

/** Cuántos gráficos dibuja el `.pen`. **No es `plots.length`**: son 43 dibujados
 *  de 49 declarados, y el literal del frame dice «DE LOS 43». Sale de
 *  `pen-graficos`, que los cuenta. */
const DIBUJADOS_EN_EL_PEN = 43

export function PlotPicker({ tipo, formasDelTipo, plots, actual, onElegir, onVolver }: Props) {
  /** Agrupado **por forma**, que es como el dibujo lo ordena: un gráfico que
   *  sirve dos formas aparece en los dos grupos, porque su mínimo cambia con la
   *  forma y quien compone tiene que ver el que le toca. */
  const grupos = useMemo(
    () =>
      formasDelTipo.map((forma) => ({
        forma,
        // `todos` es el denominador de «N DE M MOSTRADOS»: cuántos del
        // repertorio sirven esta forma, mostrados o no.
        todos: plots.filter((p) => p.formas.includes(forma)),
      })),
    [formasDelTipo, plots],
  )

  const mostrados = new Set(grupos.flatMap((g) => g.todos.map((p) => p.id)))

  return (
    <div className="flex flex-col h-full min-h-0 bg-panel rounded-xl border border-w3">
      {/* ── CABECERA · el borde inferior es `$w3`, del frame ─────────────── */}
      <div className="flex flex-col gap-2 border-b border-w3 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* **El `.pen` lo dibuja en 19 y la escala no emite 19.** Tercera vez que
              pasa —ya estaba con 17 y con 12.5, registradas en la propuesta de
              divergencias— y se resuelve igual: el más cercano de la escala, que
              acá es `titulo-lg` (20). Inventar un tamaño nuevo es lo que §2.3
              existe para impedir; el caso queda sumado como evidencia para la
              pregunta 9 de B0.9. */}
          <h2 className="font-display text-titulo-lg text-ink">Elegir gráfico</h2>
          <Label as="div">{`${String(mostrados.size)} gráficos de los ${String(DIBUJADOS_EN_EL_PEN)} del repertorio`}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label as="div">{nombreDeTipo(tipo)}</Label>
          <Note as="span">acepta</Note>
          {formasDelTipo.map((f) => (
            <Note key={f} as="span">
              {nombreDeForma(f)}
            </Note>
          ))}
        </div>
        {/* Literal del frame. Dice por qué el día que haya espécimen el preview
            monta el plot de verdad y no una miniatura. */}
        <Note as="div">El preview es el espécimen de la librería, no una miniatura aparte</Note>
      </div>

      {/* ── CUERPO · un bloque por forma ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-4 px-6 py-4">
        {grupos.map(({ forma, todos }) => (
          <div key={forma} className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2">
              <Label as="div">{nombreDeForma(forma)}</Label>
              {/* **El frame dice «2 DE 6 MOSTRADOS» y acá va sólo el conteo.**
                  Ese literal existe porque el MOCKUP trunca la lista para que
                  entre en la hoja; la pantalla real las muestra todas, así que
                  copiarlo daría siempre «6 de 6», que es ruido con forma de
                  dato. Se conserva lo que el literal informa —cuántas hay— y se
                  descarta lo que describía una limitación del dibujo. */}
              <Note as="span">{`${String(todos.length)} ${todos.length === 1 ? 'gráfico' : 'gráficos'}`}</Note>
            </div>

            {todos.length === 0 ? (
              // **No se deja un hueco mudo.** Una forma sin gráficos es una
              // pregunta legítima —«¿y esta forma?»— y sin esto el grupo
              // desaparecería sin decir nada.
              <Note as="div">Ningún gráfico del repertorio sirve esta forma</Note>
            ) : (
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {todos.map((p) => (
                  <li key={`${forma}-${p.id}`}>
                    <Opcion
                      plot={p}
                      forma={forma}
                      elegido={actual === p.id}
                      onElegir={() => onElegir(p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* ── PIE · 64 de alto sobre `$dock`, con su literal ───────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-t border-w3 bg-dock px-6">
        <Note as="div">
          Elegido el gráfico, el binder filtra las métricas que puede renderizar
        </Note>
        <div className="flex-1" />
        <Accion onClick={onVolver}>Volver</Accion>
      </div>
    </div>
  )
}

/** Una opción · `Selector/Opción` del `.pen`: 604 de ancho, `$elev`, `$r-lg`,
 *  borde `$w3`, con el nombre en `font-body` 13 y la forma a la derecha. */
function Opcion({
  plot,
  forma,
  elegido,
  onElegir,
}: {
  plot: Plot
  forma: Shape
  elegido: boolean
  onElegir: () => void
}) {
  // **El mínimo es el de ESTA forma**, no el primero de la lista. Nueve de los
  // 49 sirven dos formas con umbrales distintos, y mostrar el que no es le diría
  // a quien compone que necesita dos categorías donde necesita tres.
  const minimo = (plot.minimos ?? []).find((m) => m.forma === forma)

  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={elegido}
      className={
        'flex w-full cursor-pointer flex-col gap-1 rounded-lg bg-elev px-3.5 py-3 text-left ' +
        (elegido ? 'border border-acc' : 'border border-w3')
      }
    >
      <div className="flex w-full items-start gap-2.5">
        <span className="flex-1 font-body text-cuerpo text-ink">{plot.nombre}</span>
        <Note as="span">{forma}</Note>
      </div>

      {/* ── LO QUE EL CRITERIO PIDE QUE CADA OPCIÓN DECLARE ──────────────
          «Cada opción declara su mínimo y su tope, para que quien compone sepa
          ANTES DE PUBLICAR que el gráfico va a quedar vacío en un tenant
          chico». Se declara, no se evalúa: acá no hay dato contra qué. */}
      <span className="text-dim">
        <Note as="div">
          {minimo === undefined
            ? 'Sin mínimo · cualquier cantidad de dato lo dibuja'
            : `Mínimo · ${minimo.cuando} · ${minimo.razon}`}
        </Note>
      </span>
      {plot.tope != null && (
        // ── EL TOPE VA EN `$dim`, Y ESTUVO EN `$acc` CON UNA RAZÓN FALSA ──────
        //
        // Acá decía «el tope va en `$acc`, que es donde el `.pen` lo pinta en la
        // variante deshabilitada». **Se leyó el dibujo el 2026-09-30 y es
        // falso.** El frame `B3 · Selector · gráfico deshabilitado por tope`
        // sustituye la descripción de la opción por la razón del tope y **la
        // deja en `$dim`**, el mismo tono que ya tenía ese renglón; lo que sí
        // cambia es el NOMBRE, que baja de `$ink` a `$dim`, y el preview, que
        // se apaga (`enabled: false`).
        //
        // Nadie lo había comprobado y **ninguna prueba lo ataba**, que es la
        // forma que la auditoría de A2 encontró cinco veces el mismo día: algo
        // declarado en prosa y sin aserción se deshace solo.
        //
        // Y el color importa por una regla dura: el naranja **no** es para
        // cualquier aviso — «solo CTAs, estado activo, enlaces y cifras
        // resaltadas en prosa». Un tope sobre una opción HABILITADA no es
        // ninguna de las cuatro.
        <Note as="div">{`Tope · ${plot.tope.cuando} · ${plot.tope.razon}`}</Note>
      )}
    </button>
  )
}
