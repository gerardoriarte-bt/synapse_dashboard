/** La composición de un rol, desglosada · A2 §9 · §PEN:A2
 *
 *  **Lo que el `.pen` dibuja y no estaba.** `Sección · Roles` de `A2 · Ficha de
 *  cliente` no es una lista de nombres: es una tarjeta por rol con **cuántos
 *  paneles ve y en qué pestañas**, y debajo una fila por pestaña con su pregunta
 *  operativa. Hasta el 2026-09-22 la pantalla decía «Pestañas · A · B · C», que
 *  es el mismo dato sin la pregunta que lo hace legible.
 *
 *  Leído del **frame**, no de la nota — es la regla que ya cobró dos veces:
 *
 *   · Tarjeta: `$panel`, `$r-xl`, borde `$w3`, padding 24, gap 16.
 *   · Cabecera: nombre a la izquierda; a la derecha la cifra y, debajo,
 *     `PANELES · N PESTAÑAS`.
 *   · Una línea `$w2` separa la cabecera de las pestañas.
 *   · Fila de pestaña: nombre y pregunta a la izquierda; `N PANELES` a la
 *     derecha, en `$ink`.
 *
 *  ── VACÍO SIGNIFICA «TODAS», Y ACÁ SE VE ────────────────────────────────────
 *
 *  `rol.pestanas` vacío es **«ve todas»**, no «no ve ninguna» — la distinción que
 *  `RoleEditor` ya explicaba en prosa. En un desglose eso deja de ser una nota y
 *  pasa a ser aritmética: un rol sin pestañas elegidas **suma los paneles de
 *  todas**. Pintarlo como «0 paneles · 0 pestañas» diría exactamente lo
 *  contrario de lo que pasa, y se vería bien.
 *
 *  ── TRES COSAS DEL DIBUJO QUE EL CABLE NO MANDA ─────────────────────────────
 *
 *  No se inventan, y su ausencia está probada en vez de olvidada:
 *
 *   · **«11 HEREDADOS DE PLANTILLA»** y el `HEREDADOS`/`PROPIOS` por pestaña. No
 *     hay noción de plantilla en el cable. **El resumen se corta antes**, sin
 *     dejar el separador colgando — que es el defecto que le señalamos al
 *     backend en la línea de BASE y sería feo repetirlo acá.
 *   · **La descripción del rol** —«Ve el negocio completo, incluida la inversión
 *     de medios.»—. `synapse-api.yaml` declara `descripcion` en `Rol`; el cable
 *     no la trae.
 *   · **La razón en prosa** de las métricas que no recibe. Lo que sí es nuestro
 *     es la nota dura de §3.3, que es una regla y no un dato.
 *
 *  ── DOS TAMAÑOS QUE LA ESCALA NO PUEDE EMITIR ───────────────────────────────
 *
 *  El `.pen` pone el nombre del rol en **17** y el de la pestaña en **12.5**, y
 *  la escala que el propio `.pen` emite no tiene ninguno de los dos: va de 15
 *  —`text-titulo`— a 20, y de 12 —`text-celda`— a 13. Se usan los tokens
 *  vecinos. Es el mismo caso que el radio 16 de la hoja del chat: **la autoridad
 *  del `.pen` no obliga a copiar un valor que el propio `.pen` no puede
 *  emitir**. Queda como propuesta de spec — `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` · §2, que es evidencia para
 *  la pregunta 9 de B0.9 y no una pregunta nueva.
 */
import { Label } from '../../render/primitives/Label'
import type { Rol } from '../../api/admin'

/** Una pestaña del layout publicado, con lo que hace falta para desglosarla. */
export type PestanaDeRol = {
  id: string
  nombre: string
  /** La pregunta operativa · es lo que vuelve legible el nombre. */
  pregunta: string
  paneles: number
}

type Props = {
  rol: Rol
  /** **Todas** las del layout, no las del rol: acá se resuelve cuáles le tocan,
   *  porque la regla de «vacío = todas» vive en esa resolución. */
  pestanas: readonly PestanaDeRol[]
  /** Para nombrar una métrica oculta en vez de pintar su UUID. */
  nombreDeMetrica: (id: string) => string
  onEditar: () => void
  onBorrar: () => void
  /** Sin manejador el enlace al catálogo **no se pinta**: un botón que promete
   *  un viaje que no existe es peor que su ausencia. */
  onVerCatalogo?: () => void
}

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase m-0'
const CHIP = 'rounded-xs border border-w4 px-2 py-0.5 ' + NOTA + ' text-ink'

export function RoleCard({
  rol,
  pestanas,
  nombreDeMetrica,
  onEditar,
  onBorrar,
  onVerCatalogo,
}: Props) {
  // **Acá vive la regla.** Vacío = todas.
  const suyas = rol.pestanas.length === 0 ? pestanas : pestanas.filter((t) => rol.pestanas.includes(t.id))
  const paneles = suyas.reduce((n, t) => n + t.paneles, 0)

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-w3 bg-panel p-6 list-none">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-display text-titulo leading-titulo tracking-titulo text-ink">
            {rol.nombre}
          </span>
          {/* **El conteo antes del botón** · con un usuario o más, borrar da 409. */}
          <Label as="div">
            {rol.usuarios === 0 ? 'Sin usuarios' : `${String(rol.usuarios)} usuario(s)`}
          </Label>
        </div>

        {/* La cifra y su rótulo, que es lo que impide que quede desnuda: el
            «PANELES · N PESTAÑAS» de abajo es su label, igual que en el `.pen`. */}
        <div className="flex flex-col items-end gap-1 ml-auto shrink-0">
          <span className="font-display text-titulo-lg leading-titulo tracking-titulo text-ink">
            {paneles}
          </span>
          <span className={`${NOTA} text-dim`}>
            {`Paneles · ${String(suyas.length)} pestaña(s)`}
          </span>
        </div>
      </div>

      {rol.pestanas.length === 0 && (
        // La mitad del dato que se lee al revés si falta, y acá importa más que
        // en una lista: la cifra de arriba ya sumó todas.
        <Label as="div">Ve TODAS las pestañas · vacío no es «ninguna»</Label>
      )}

      <div className="h-px bg-w2" />

      {suyas.length === 0 ? (
        <Label as="div">Este cliente no tiene pestañas publicadas</Label>
      ) : (
        <ul className="flex flex-col m-0 p-0 list-none">
          {suyas.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2.5">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-body text-celda leading-cuerpo text-ink truncate">
                  {t.nombre}
                </span>
                <span className={`${NOTA} text-dim`}>{t.pregunta}</span>
              </div>
              <span className={`${NOTA} text-ink ml-auto shrink-0`}>
                {`${String(t.paneles)} paneles`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {rol.metricasOcultas.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-w3 px-4 py-3.5">
          <span className={`${NOTA} text-ink`}>
            {`No recibe · ${String(rol.metricasOcultas.length)} métrica(s)`}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {rol.metricasOcultas.map((id) => (
              <span key={id} className={CHIP}>
                {nombreDeMetrica(id)}
              </span>
            ))}
            {onVerCatalogo !== undefined && (
              <button type="button" onClick={onVerCatalogo} className={`${CHIP} cursor-pointer bg-transparent hover:bg-w2`}>
                Ver en el catálogo
              </button>
            )}
          </div>
          {/* **La nota dura, literal del `.pen`.** No es un dato: es §3.3, y por
              eso se escribe acá en vez de esperar a que el cable la mande. */}
          <span className={`${NOTA} text-dim leading-cuerpo`}>
            El backend no envía el payload · ocultar no es permitir (§3.3)
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onEditar}
          className="font-mono text-label leading-rotulo tracking-rotulo uppercase px-2 py-1 rounded-sm cursor-pointer border-0 bg-transparent text-dim hover:bg-w3"
        >
          Editar
        </button>
        {rol.usuarios === 0 ? (
          <button
            type="button"
            onClick={onBorrar}
            aria-label={`Borrar ${rol.nombre}`}
            className="font-mono text-label leading-rotulo tracking-rotulo uppercase px-2 py-1 rounded-sm cursor-pointer border-0 bg-transparent text-acc hover:bg-w3"
          >
            Borrar
          </button>
        ) : (
          // **Ausente, no deshabilitado con silencio**: se dice qué lo impide y
          // qué lo desbloquea.
          <Label>No se borra con usuarios asignados · reasignalos primero</Label>
        )}
      </div>
    </li>
  )
}
