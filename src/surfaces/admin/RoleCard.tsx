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
  // **Acá vive la regla.** Vacío = todas.
  // **Se compara por CLAVE, no por id** · 2026-09-29. `rol.pestanas` pasó a
  // guardar `tab_keys`, que sobreviven a publicar; el `id` se recrea en cada
  // versión. Comparar por id acá dejaba la ficha en blanco después de la primera
  // publicación real, con el rol correctamente restringido por detrás.
  const suyas =
    rol.pestanas.length === 0 ? pestanas : pestanas.filter((t) => rol.pestanas.includes(t.clave))
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
        <Ayuda>Ve TODAS las pestañas: un rol sin pestañas elegidas las ve todas, no ninguna.</Ayuda>
      )}

      <div className="h-px bg-w2" />

      {suyas.length === 0 ? (
        <Ayuda>Este cliente todavía no tiene pestañas publicadas.</Ayuda>
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
              // **Una acción, no un chip más** · 2026-10-06. Vestía la misma
              // clase que los nombres de métrica de al lado y no se distinguía
              // de ellos.
              <Accion tamano="compacta" onClick={onVerCatalogo}>
                Ver en el catálogo
              </Accion>
            )}
          </div>
          {/* **La nota dura, literal del `.pen`.** No es un dato: es §3.3, y por
              eso se escribe acá en vez de esperar a que el cable la mande. */}
          {/* Decía «El backend no envía el payload · ocultar no es permitir
              (§3.3)»: la regla en el idioma de quien la implementa. Al
              super-admin le importa la consecuencia · 2026-10-06. */}
          <Ayuda>
            Estas cifras no le llegan al rol, no sólo se esconden: ocultar no es permitir.
          </Ayuda>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Accion tamano="compacta" onClick={onEditar}>
          Editar
        </Accion>
        {rol.usuarios === 0 ? (
          // **`peligro` y no `acc`** · 2026-10-06. Iba en el naranja del CTA
          // principal, que es el color de «adelante»: una acción que borra con
          // esa señal la invierte.
          <Accion tamano="compacta" variante="peligro" onClick={onBorrar} etiqueta={`Borrar ${rol.nombre}`}>
            Borrar
          </Accion>
        ) : (
          // **Ausente, no deshabilitado con silencio**: se dice qué lo impide y
          // qué lo desbloquea.
          <Ayuda as="span">No se borra con usuarios asignados: reasignalos primero.</Ayuda>
        )}
      </div>
    </li>
  )
}
