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
 *  ── LOS DOS TAMAÑOS CONVERGIERON · 2026-09-28 ───────────────────────────────
 *
 *  Acá decía que el `.pen` ponía el nombre del rol en **17** y el de la pestaña
 *  en **12.5**, que la escala no emitía ninguno de los dos, y que se usaban los
 *  tokens vecinos «porque la autoridad del `.pen` no obliga a copiar un valor
 *  que el propio `.pen` no puede emitir». Quedaba como propuesta de spec.
 *
 *  **El dibujo se movió al código, no al revés**: el nombre del rol pasó a **15**
 *  —`text-titulo`— y el de la pestaña a **12** —`text-celda`—, que son
 *  exactamente los dos tokens que este archivo ya usaba. Los 12.5 eran un
 *  descuido repetido 134 veces, no un rol tipográfico.
 *
 *  Así que **no queda divergencia y §2 de
 *  `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` se puede cerrar**. No
 *  hubo que cambiar una línea acá — se verificó, que es distinto de suponerlo.
 *
 *  ── Y LA CIFRA DESTACADA ES `titulo-lg`, QUE PASÓ DE 20 A 26 ────────────────
 *
 *  El token medía mal: valía 20 con dos nodos en el `.pen`, contra 36 que
 *  convergen en 26. **No hay que tocar nada acá**: la clase es la misma y el
 *  valor llega con el token. Es lo que `token-drift` garantiza.
 */
import { useId, useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import type { Rol } from '../../api/admin'

/** Una pestaña del layout publicado, con lo que hace falta para desglosarla. */
export type PestanaDeRol = {
  id: string
  /** **Con lo que el rol la restringe** · estable entre versiones, a diferencia
   *  del `id`. Ver el filtro de abajo. */
  clave: string
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
  /** **Plegada por defecto** · 2026-10-20. Medido en QA: seis tarjetas abiertas
   *  repetían la misma pestaña y la misma explicación una debajo de la otra. La
   *  fila dice lo que decide —usuarios, alcance, paneles— y el detalle se abre. */
  const [abierta, setAbierta] = useState(false)
  const detalle = useId()
  // **Acá vive la regla.** Vacío = todas.
  // **Se compara por CLAVE, no por id** · 2026-09-29. `rol.pestanas` pasó a
  // guardar `tab_keys`, que sobreviven a publicar; el `id` se recrea en cada
  // versión. Comparar por id acá dejaba la ficha en blanco después de la primera
  // publicación real, con el rol correctamente restringido por detrás.
  const suyas =
    rol.pestanas.length === 0 ? pestanas : pestanas.filter((t) => rol.pestanas.includes(t.clave))
  const paneles = suyas.reduce((n, t) => n + t.paneles, 0)

  return (
    <li className="flex flex-col rounded-xl border border-w3 bg-panel list-none">
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          aria-controls={detalle}
          className="flex min-w-0 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-dim hover:text-ink transition-colors duration-rapida ease-salida"
        >
          {/* `chevron-right` de línea, que gira al abrir · hereda el color. Gira
              en `duration-base` y no de golpe · 2026-10-27, punto 4 de la
              propuesta de microinteracciones. */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-base ease-salida ${abierta ? 'rotate-90' : ''}`}
            aria-hidden
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-display text-titulo leading-titulo tracking-titulo text-ink">{rol.nombre}</span>
            {/* **El conteo antes del botón** · con un usuario o más, borrar da 409. */}
            <Label as="span">{rol.usuarios === 0 ? 'Sin usuarios' : `${String(rol.usuarios)} usuario(s)`}</Label>
          </span>
        </button>

        {/* La regla —vacío es TODAS— dicha una vez arriba, en el editor; acá
            queda la marca. Es la mitad del dato que se lee al revés si falta: la
            cifra de la derecha ya sumó todas. */}
        {rol.pestanas.length === 0 && <span className={CHIP}>Todas las pestañas</span>}
        {rol.metricasOcultas.length > 0 && (
          <span className={CHIP}>{`No recibe · ${String(rol.metricasOcultas.length)} métrica(s)`}</span>
        )}

        {/* La cifra y su rótulo, que es lo que impide que quede desnuda. */}
        <span className="ml-auto flex shrink-0 items-baseline gap-2">
          <span className="font-display text-titulo leading-titulo tracking-titulo text-ink">{paneles}</span>
          <span className={`${NOTA} text-dim`}>{`Paneles · ${String(suyas.length)} pestaña(s)`}</span>
        </span>

        <Accion tamano="compacta" onClick={onEditar}>
          Editar
        </Accion>
        {/* **Ausente con usuarios**: qué lo impide y qué lo desbloquea está dicho
            una vez en la cabecera de la sección. **`peligro` y no `acc`** ·
            2026-10-06: el naranja es «adelante» y esto borra. */}
        {rol.usuarios === 0 && (
          <Accion tamano="compacta" variante="peligro" onClick={onBorrar} etiqueta={`Borrar ${rol.nombre}`}>
            Borrar
          </Accion>
        )}
      </div>

      {/* **El detalle entra con un fundido, y la altura cambia en seco**: animarla
          movería todo lo que está debajo · 2026-10-27, punto 4. */}
      {abierta && (
        <div id={detalle} className="flex flex-col gap-4 border-t border-w2 px-5 py-4 transition-opacity duration-base ease-salida starting:opacity-0">
          {suyas.length === 0 ? (
            <Ayuda>Este cliente todavía no tiene pestañas publicadas.</Ayuda>
          ) : (
            <ul className="flex flex-col m-0 p-0 list-none">
              {suyas.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-body text-celda leading-cuerpo text-ink truncate">{t.nombre}</span>
                    <span className={`${NOTA} text-dim`}>{t.pregunta}</span>
                  </div>
                  <span className={`${NOTA} text-ink ml-auto shrink-0`}>{`${String(t.paneles)} paneles`}</span>
                </li>
              ))}
            </ul>
          )}

          {rol.metricasOcultas.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border border-w3 px-4 py-3.5">
              <span className={`${NOTA} text-ink`}>{`No recibe · ${String(rol.metricasOcultas.length)} métrica(s)`}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {rol.metricasOcultas.map((id) => (
                  <span key={id} className={CHIP}>
                    {nombreDeMetrica(id)}
                  </span>
                ))}
                {onVerCatalogo !== undefined && (
                  // **Una acción, no un chip más** · 2026-10-06.
                  <Accion tamano="compacta" onClick={onVerCatalogo}>
                    Ver en el catálogo
                  </Accion>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
