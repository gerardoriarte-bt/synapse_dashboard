/** Editor de pestañas · F4.8
 *
 *  §7.2 le pide cuatro campos: **nombre, pregunta operativa, orden y
 *  sugerencias**. El cable sostiene tres.
 *
 *  ── LA PREGUNTA OPERATIVA NO ES UN SUBTÍTULO ────────────────────────────────
 *
 *  «**Una pestaña que no contesta una pregunta no se compone.**» Lo dicen igual
 *  §7.2 y la descripción de `Pestana` en el contrato, y **el cable la deja pasar
 *  como cadena vacía** —`OperationalQuestion` no es requerido—. La diferencia
 *  entre lo que el servicio acepta y lo que el producto permite se sostiene acá:
 *  la pestaña inválida se marca, se cuenta y bloquea la composición. No se
 *  esconde en un `title` ni en un borde rojo — §2 prohíbe el rojo semántico, y de
 *  todas formas un color no dice qué hacer.
 *
 *  ── LAS SUGERENCIAS NO ESTÁN, Y SON DE C3 ───────────────────────────────────
 *
 *  `chatSugerencias[]` está en el modelo de §2 y en el contrato, y es lo que C3
 *  pinta como «chips de consulta sugerida por pestaña». `LayoutTab` no lo trae y
 *  `TabInput` no lo acepta: no hay dónde escribirlas ni de dónde leerlas. Se
 *  declara. Lo mismo `icono` y `heredadaDe`.
 *
 *  ── Y LO QUE EL EDITOR NO MUESTRA, IGUAL VIAJA ──────────────────────────────
 *
 *  Roles y paneles. El PUT es un reemplazo completo, así que un cuerpo armado
 *  solo con lo que esta pantalla edita **borraría los dos**. El borrador los
 *  arrastra · ver `borrador.ts`.
 */
import { Label } from '../../render/primitives/Label'
import type { TabParaGuardar } from '../../api/admin'
import type { ProblemaLocal } from './validar'

const FALTANTES = [
  'Sugerencias de chat · chatSugerencias[] está en el contrato y en §2, y el cable no lo trae ni lo acepta',
  'Icono de pestaña · mismo caso',
  'De qué plantilla hereda · heredadaDe no existe en el cable',
] as const

type Props = {
  tabs: readonly TabParaGuardar[]
  onEditar: (indice: number, campo: 'nombre' | 'pregunta', valor: string) => void
  onAgregar: () => void
  onQuitar: (indice: number) => void
  onMover: (indice: number, direccion: -1 | 1) => void
  /** Elegir un panel para configurarlo · F4.10. El configurador no va adentro
   *  de acá: necesita la tabla de bloques y el catálogo, que son del
   *  contenedor. */
  onPanel: (indiceTab: number, indicePanel: number) => void
  onAgregarPanel: (indiceTab: number) => void
  seleccion: { tab: number; panel: number } | null
  /** **Ya calculados, no se recalculan acá** · F4.11. Tres lugares de la pantalla
   *  muestran problemas de composición —la pestaña, el botón del panel y el
   *  resumen— y con tres cálculos podrían discrepar. `validarBorrador` corre una
   *  vez en el contenedor y los tres leen de ahí. */
  problemas: readonly ProblemaLocal[]
  /** Si el borrador difiere de lo que el servidor devolvió. */
  sucio: boolean
}

export function TabEditor({
  tabs,
  onEditar,
  onAgregar,
  onQuitar,
  onMover,
  onPanel,
  onAgregarPanel,
  seleccion,
  problemas,
  sucio,
}: Props) {
  const invalidas = new Set(problemas.map((p) => p.tab)).size

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Label as="div">{`Pestañas · ${String(tabs.length)}`}</Label>
        {/* **El estado del borrador, dicho.** §7.2 B2 pide «guardado explícito,
            con indicador de cambios sin guardar». Guardar es F4.13; el indicador
            es de ahora, porque sin él se edita creyendo que se guardó. */}
        <Label as="div">{sucio ? 'Sin guardar' : 'Sin cambios'}</Label>
        {invalidas > 0 && (
          <Label as="div">{`${String(invalidas)} pestaña(s) con problemas de composición`}</Label>
        )}
      </div>

      <ul className="flex flex-col gap-3 m-0 p-0 list-none">
        {tabs.map((t, i) => {
          // Las de la PESTAÑA · las de sus paneles se marcan en cada botón.
          const fallas = problemas.filter((p) => p.tab === i && p.panel === null)
          return (
            <li key={t.id ?? `nueva-${String(i)}`} className="flex flex-col gap-2 rounded-sm bg-w2 p-3">
              <div className="flex items-center gap-3">
                <Label>{`Orden ${String(t.orden)}`}</Label>
                {/* **Un botón deshabilitado en el extremo**, y la función que
                    mueve además se defiende: las dos mitades, porque una sola
                    deja el primer elemento a merced de un `splice` negativo. */}
                <button
                  type="button"
                  onClick={() => onMover(i, -1)}
                  disabled={i === 0}
                  aria-label={`Subir ${t.nombre}`}
                  className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-dim hover:bg-w3 disabled:opacity-40"
                >
                  Subir
                </button>
                <button
                  type="button"
                  onClick={() => onMover(i, 1)}
                  disabled={i === tabs.length - 1}
                  aria-label={`Bajar ${t.nombre}`}
                  className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-dim hover:bg-w3 disabled:opacity-40"
                >
                  Bajar
                </button>
                <button
                  type="button"
                  onClick={() => onQuitar(i)}
                  aria-label={`Quitar ${t.nombre}`}
                  className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-acc hover:bg-w3 ml-auto"
                >
                  Quitar
                </button>
              </div>

              <label className="flex flex-col gap-1">
                <Label as="div">Nombre</Label>
                <input
                  type="text"
                  value={t.nombre}
                  onChange={(e) => onEditar(i, 'nombre', e.target.value)}
                  className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
                />
              </label>

              <label className="flex flex-col gap-1">
                <Label as="div">Pregunta operativa</Label>
                <input
                  type="text"
                  value={t.pregunta}
                  onChange={(e) => onEditar(i, 'pregunta', e.target.value)}
                  aria-invalid={t.pregunta.trim() === '' ? 'true' : undefined}
                  className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
                />
              </label>

              {/* **Lo que el editor no toca y sí viaja.** Decirlo evita la
                  lectura de que quitar la pestaña de la lista es lo único que
                  borra algo: renombrarla manda el layout entero. */}
              <Label as="div">
                {`${String(t.panels.length)} panel(es) · ${t.roles.length === 0 ? 'todos los roles' : `${String(t.roles.length)} rol(es)`} · se conservan al guardar`}
              </Label>

              {/* Los paneles de la pestaña · F4.10. Sin canvas todavía, así que
                  se listan en el orden en que están y se configuran uno a uno. */}
              <div className="flex flex-wrap items-center gap-2">
                {t.panels.map((pan, j) => (
                  <button
                    key={pan.id ?? `nuevo-${String(j)}`}
                    type="button"
                    onClick={() => onPanel(i, j)}
                    aria-pressed={seleccion?.tab === i && seleccion.panel === j}
                    className={
                      'text-label tracking-rotulo uppercase px-2 py-1 rounded-sm ' +
                      (seleccion?.tab === i && seleccion.panel === j
                        ? 'bg-w3 text-ink'
                        : 'text-dim hover:bg-w3')
                    }
                  >
                    {/* El tipo y no el nombre de la métrica: el nombre vive en el
                        catálogo y esta lista no lo tiene. Un id crudo sería
                        plomería. */}
                    {pan.tipo}
                    {pan.metricId === '' ? ' · sin métrica' : ''}
                    {/* El panel con problemas se marca en su botón. El detalle
                        está en el resumen y en el configurador: acá alcanza con
                        que se vea cuál, sin abrir los doce. */}
                    {problemas.some((pr) => pr.tab === i && pr.panel === j) ? ' ·' : ''}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onAgregarPanel(i)}
                  aria-label={`Agregar panel a ${t.nombre}`}
                  className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm border border-w4 text-ink hover:bg-w3"
                >
                  Agregar panel
                </button>
              </div>

              {t.id === undefined && (
                // Sin `id` el servicio la CREA. No es un detalle de implementación:
                // es la diferencia entre editar y duplicar.
                <Label as="div">Nueva · se crea al guardar</Label>
              )}

              {fallas.map((f) => (
                <Label key={f.campo + f.mensaje} as="div">
                  {f.mensaje}
                </Label>
              ))}
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={onAgregar}
        className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
      >
        Agregar pestaña
      </button>

      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        <Label as="div">{`Faltan ${String(FALTANTES.length)} campos que el modelo declara`}</Label>
        {FALTANTES.map((f) => (
          <Label key={f} as="div">
            {f}
          </Label>
        ))}
        <Label as="div">Guardar es F4.13 · este borrador vive solo en la pantalla</Label>
      </div>
    </div>
  )
}
