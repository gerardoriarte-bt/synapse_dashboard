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
 */
import { Label } from '../../render/primitives/Label'
import type { Agente } from '../../api/admin'

const CELDA = 'font-body text-cuerpo leading-cuerpo text-ink px-3 py-2 align-top'

export function AgentConfig({ agentes }: { agentes: readonly Agente[] }) {
  return (
    <section className="flex flex-col gap-2">
      <Label as="div">Agente de datos</Label>

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
              <th className="px-3 py-2">
                <Label as="span">Agente</Label>
              </th>
              <th className="px-3 py-2">
                <Label as="span">Rol que atiende</Label>
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
                <td className={CELDA}>
                  {a.nombre}
                  <span className="block">
                    <Label as="span">
                      {a.vistas === 1 ? '1 conjunto de datos' : `${a.vistas} conjuntos de datos`}
                    </Label>
                  </span>
                </td>
                <td className={CELDA}>{a.rol}</td>
                <td className={CELDA}>
                  {/* «Activo» y «Inactivo», no «vigente». Es lo que el campo
                      dice: si alguien lo dio de baja. */}
                  <Label as="span">{a.activo ? 'Activo' : 'Inactivo'}</Label>
                </td>
                <td className={CELDA}>
                  <Label as="span">Sin verificar</Label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* **La declaración va debajo de la tabla y siempre**, también cuando no
          hay agentes: el hueco es del cable, no de este cliente. */}
      <div className="flex flex-col gap-1 border-t border-w2 pt-2">
        <Label as="div">Pendiente · el estado del acceso</Label>
        <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
          Ninguna ruta declara si el acceso del agente sigue vigente ni cuándo se
          verificó por última vez. «Activo» solo dice que nadie lo dio de baja:
          un agente activo con la credencial vencida se ve igual que uno que
          funciona.
        </p>
        <Label as="div">Se desbloquea con · una verificación de acceso en el cable</Label>
      </div>
    </section>
  )
}
