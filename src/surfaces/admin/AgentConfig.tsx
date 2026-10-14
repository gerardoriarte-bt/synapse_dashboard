/** El agente del cliente · A2 · F4.4
 *
 *  **Lo que esta pantalla NO muestra es la decisión, no lo que muestra.** §7.3
 *  de `design.md`: «no se muestra vocabulario de infraestructura — ni base, ni
 *  rol técnico, ni grants, ni warehouse. Se declara la consecuencia, no la
 *  plomería».
 *
 *  El cable manda `snowflake_db`, `snowflake_schema`, `warehouse` y los nombres
 *  de las vistas semánticas. **Ninguno llega hasta acá**: los recorta
 *  `adaptAgent`, para que taparlos no sea una decisión que cada pantalla pueda
 *  olvidarse. Lo único que sobrevive de las vistas es **cuántas son**, que
 *  contesta «¿tiene datos asignados?» sin nombrar ninguno.
 *
 *  ── LO QUE §7.3 PIDE Y EL CABLE NO MANDA ────────────────────────────────────
 *
 *  «Acceso vigente, última verificación». **No existe, y se declara pendiente
 *  en vez de deducirse.**
 *
 *  Hay dos campos que se parecen y no lo son, y confundirlos sería el defecto:
 *
 *  · **`is_active` es una baja lógica.** Alguien apretó un interruptor. Un
 *    agente activo con la credencial vencida sigue diciendo `true`.
 *  · **`updated_at` dice cuándo se editó la fila**, no cuándo alguien comprobó
 *    que el acceso funciona.
 *
 *  Leer cualquiera de los dos como «acceso vigente» es exactamente lo que §7.3
 *  prohíbe: declarar una consecuencia que nadie verificó. Está pedido en
 *  `docs/PARA-BACKEND.md`.
 *
 *  ── LA RAMA `BLOQUEADO` · §PEN:A2 · F5.20, 2026-09-30 ───────────────────────
 *
 *  `A2 · Ficha · tenant en alta` dibuja este mismo bloque de otra forma: un chip
 *  `BLOQUEADO`, la razón, y qué lo desbloquea. **Y la condición es tener CERO
 *  ROLES, no cero agentes**, que es la parte que se puede equivocar viéndose
 *  bien.
 *
 *  El dibujo y su nota dicen por qué: «sin rol no hay a quién otorgarle lectura».
 *  El número de agentes contesta otra pregunta —si alguien ya configuró el
 *  acceso— y con un cliente recién dado de alta las dos dan cero, así que un
 *  fixture obvio no las distingue. Con roles, sigue la tabla.
 *
 *  **Reemplaza el cuerpo y no se suma a él** · §5.2: un estado reemplaza el
 *  cuerpo, nunca el shell. El rótulo del bloque sigue arriba; lo que cambia es
 *  todo lo de abajo, incluida la declaración de lo que falta — que en este estado
 *  hablaría de un acceso que todavía no se pidió.
 *
 *  ── LA VERIFICACIÓN LLEGÓ · 2026-10-14 ──────────────────────────────────────
 *
 *  El «pendiente» de arriba se desbloqueó con `schema-check`, que el servicio ya
 *  tenía. Es lo que el dibujo pide: **«ÚLTIMA VERIFICACIÓN · VERIFICAR AHORA»**.
 *  Va a pedido porque tarda segundos y consulta los datos del cliente, y el
 *  resultado vale para la sesión: el servicio no lo guarda todavía.
 *
 *  **El estado es del CLIENTE, no del rol**: medido, `role` no cambia el
 *  resultado. Por eso todas las filas dicen lo mismo y la verificación es una.
 *  Cómo se lee la respuesta está en `estadoDelAcceso.ts`.
 *
 *  **§PEN:A2** · A2 · el bloque «ACCESO A DATOS» · DIVERGE en forma · misma auditoría, §8.
 */
import { Label } from '../../render/primitives/Label'
import { Note } from '../../render/primitives/Note'
import { Ayuda } from '../../render/primitives/Ayuda'
import { StatusChip } from './StatusChip'
import { Accion } from '../../render/primitives/Accion'
import type { Agente } from '../../api/admin'
import type { Formatter } from '../../render/format'
import type { EstadoDelAcceso } from './estadoDelAcceso'

/** Lo que dice la columna «Acceso» de cada fila, por estado. */
const EN_LA_FILA: Record<EstadoDelAcceso['estado'], string> = {
  'sin-verificar': 'Sin verificar',
  verificando: 'Verificando…',
  vigente: 'Vigente',
  'faltan-datos': 'Faltan datos',
  'sin-acceso': 'Sin acceso',
  'sin-configurar': 'Sin configurar',
  error: 'Sin verificar',
}

const CELDA = 'font-body text-cuerpo leading-cuerpo text-ink px-3 py-2 align-top'

type Props = {
  agentes: readonly Agente[]
  /** **Cero roles, no cero agentes** · ver el comentario de arriba. Obligatoria y
   *  no opcional a propósito: con el spread condicional de JSX una prop mal
   *  escrita compila, y una opcional mal escrita se lee como «false». */
  sinRoles: boolean
  /** El resultado de la verificación · ver `estadoDelAcceso.ts`. Obligatoria
   *  por la misma razón que `sinRoles`. */
  acceso: EstadoDelAcceso
  /** Las claves del catálogo llegan como claves; se muestran con su nombre. */
  nombreDeMetrica: (clave: string) => string
  format: Formatter
  now: Date
  /** «Verificar ahora» · **sin manejador no se pinta**. */
  onVerificar?: () => void
}

export function AgentConfig({ agentes, sinRoles, acceso, nombreDeMetrica, format, now, onVerificar }: Props) {
  if (sinRoles) {
    return (
      <section className="flex flex-col gap-3" aria-label="Acceso a datos">
        <Label as="div">Acceso a datos</Label>
        <div className="rounded-xl border border-w3 bg-panel p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <StatusChip tono="accion">Bloqueado</StatusChip>
            <div className="text-dim">
              <Note as="div">Todavía no configurado</Note>
            </div>
          </div>
          <p className="font-body text-celda leading-cuerpo text-ink m-0">
            El acceso a datos se configura al confirmar el primer rol: sin rol no hay a quién
            otorgárselo.
          </p>
          {/* **Razón y desbloqueo**, que es la gramática que §8 le pide a
              cualquier estado apagado. Sin la segunda mitad esto sería un cartel
              que dice «no» y deja al super-admin sin siguiente paso. */}
          <div className="text-dim">
            <Note as="div">Lo desbloquea · definir el primer rol</Note>
          </div>
        </div>
      </section>
    )
  }

  return (
    // **Con nombre accesible** · 2026-10-09: la ficha ya tiene otra tabla —la de
    // sus usuarios— y «la tabla del acceso» deja de ser la única.
    <section className="flex flex-col gap-2" aria-label="Acceso a datos">
      {/* **Se llama `ACCESO A DATOS`** · §PEN:A2, que es como el dibujo nombra
          este bloque. «Agente de datos» era nuestro y describía la plomería:
          al super-admin no le importa que haya un agente, le importa si el rol
          ve el dato. */}
      <Label as="div">Acceso a datos</Label>

      {agentes.length === 0 ? (
        <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
          Este cliente todavía no tiene un agente configurado.
        </p>
      ) : (
        // **Tabla y no grilla** · §4 del `.pen`: «las tablas no son grillas», y
        // con grilla perdían contenido en silencio. El ancho mínimo de esta
        // superficie es 1280 y no hay colapso; si no entra, hay scroll, que se
        // ve.
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-w3 text-left">
              {/* **El rol va PRIMERO** · §PEN:A2 organiza el bloque por rol —
                  `ROL · CEO`, `ROL · PLANNER`—, no por agente. La pregunta que
                  contesta la pantalla es «¿qué ve cada rol?», que es la misma
                  que encabeza la ficha. */}
              <th className="px-3 py-2">
                <Label as="span">Rol</Label>
              </th>
              <th className="px-3 py-2">
                <Label as="span">Lo atiende</Label>
              </th>
              <th className="px-3 py-2">
                <Label as="span">Estado</Label>
              </th>
              <th className="px-3 py-2">
                <Label as="span">Acceso</Label>
              </th>
            </tr>
          </thead>
          <tbody>
            {agentes.map((a) => (
              <tr key={a.id} className="border-b border-w2">
                <td className={CELDA}>{a.rol}</td>
                <td className={CELDA}>
                  {a.nombre}
                  <span className="block">
                    <Label as="span">
                      {a.vistas === 1 ? '1 conjunto de datos' : `${a.vistas} conjuntos de datos`}
                    </Label>
                  </span>
                </td>
                <td className={CELDA}>
                  {/* «Activo» y «Inactivo», no «vigente». Es lo que el campo
                      dice: si alguien lo dio de baja. */}
                  <Label as="span">{a.activo ? 'Activo' : 'Inactivo'}</Label>
                </td>
                <td className={CELDA}>
                  {/* **El del cliente**, no el de esta fila: la verificación es
                      una. Un agente dado de baja no está verificado aunque el
                      cliente sí. */}
                  <Label as="span">{a.activo ? EN_LA_FILA[acceso.estado] : 'Sin verificar'}</Label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── LA VERIFICACIÓN · §PEN:A2 ────────────────────────────────────────
          «ÚLTIMA VERIFICACIÓN · Hoy · 09:40 · VERIFICAR AHORA». Sin agente no
          hay nada que verificar, y el CTA no se pinta. */}
      {agentes.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-w2 pt-3">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <Label as="div">Última verificación</Label>
              <span className="font-body text-celda text-ink">
                {acceso.estado === 'vigente' || acceso.estado === 'faltan-datos'
                  ? format.threadStamp(acceso.verificadoEn, now)
                  : acceso.estado === 'verificando'
                    ? 'Verificando…'
                    : 'Sin verificar en esta sesión'}
              </span>
            </div>
            {onVerificar !== undefined && (
              <Accion tamano="compacta" deshabilitada={acceso.estado === 'verificando'} onClick={onVerificar}>
                Verificar ahora
              </Accion>
            )}
          </div>

          {acceso.estado === 'vigente' && (
            <Ayuda>Los datos de este cliente responden y está todo lo que el producto lee.</Ayuda>
          )}
          {acceso.estado === 'faltan-datos' && (
            <Ayuda>
              {acceso.afectadas.length === 0
                ? 'Los datos responden, pero falta parte de lo que el producto lee. Lo resuelve el equipo interno.'
                : `Los datos responden, pero faltan para ${String(acceso.afectadas.length)} ${acceso.afectadas.length === 1 ? 'métrica' : 'métricas'}: ${acceso.afectadas.map(nombreDeMetrica).join(', ')}. Lo resuelve el equipo interno.`}
            </Ayuda>
          )}
          {/* **No es un problema de acceso, y se dice aparte**: el dato está y
              lo que falta es cómo calcular la métrica. Es lo que hacía que la
              verificación del servicio diera `ok: false` en UA. */}
          {(acceso.estado === 'vigente' || acceso.estado === 'faltan-datos') && acceso.sinCalculo.length > 0 && (
            <Ayuda>
              {`${String(acceso.sinCalculo.length)} ${acceso.sinCalculo.length === 1 ? 'métrica del catálogo todavía no tiene' : 'métricas del catálogo todavía no tienen'} cálculo: ${acceso.sinCalculo.map(nombreDeMetrica).join(', ')}.`}
            </Ayuda>
          )}
          {acceso.estado === 'sin-acceso' && (
            <Ayuda>{`${acceso.razon} Lo resuelve el equipo interno.`}</Ayuda>
          )}
          {acceso.estado === 'sin-configurar' && (
            <Ayuda>Este cliente no tiene un agente activo: no hay acceso que verificar.</Ayuda>
          )}
          {acceso.estado === 'error' && <Ayuda>{acceso.razon}</Ayuda>}
          {acceso.estado === 'sin-verificar' && (
            <Ayuda>
              «Activo» solo dice que nadie lo dio de baja. Si el acceso funciona lo dice la
              verificación, que vale hasta recargar la página.
            </Ayuda>
          )}
        </div>
      )}

      {/* **La nota dura del permiso** · §PEN:A2 la escribe al pie del bloque, y
          es la que más enseña de esta pantalla: se puede componer un panel que
          un rol no va a poder ver, y eso no es un error de composición. Es la
          misma regla que `RoleEditor` ya declara para las métricas ocultas,
          dicha para el acceso. */}
      <Ayuda>
        El permiso se aplica al servir el dato, no al componer: un rol sin acceso no ve el
        dato aunque el panel exista.
      </Ayuda>
    </section>
  )
}
