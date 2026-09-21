/** B1 · Selector de contexto de edición · F4.7
 *
 *  §7.2: «Elegir **tenant y rol**. Muestra qué pestañas existen, cuáles heredan
 *  de la **plantilla de vertical** y cuáles tienen **override**. Punto de entrada
 *  de todo el builder.»
 *
 *  Son cuatro cosas y el cable sostiene dos: **el tenant y las pestañas**. La
 *  lista de pestañas la pinta el editor de F4.8, que cuelga de acá como
 *  `children`: B1 muestra qué pestañas existen y desde el 2026-09-15 además deja
 *  editarlas, que es el único lugar de §7.2 donde eso cabe sin inventar una
 *  séptima pantalla.
 *
 *  ── EL SELECTOR DE ROL, QUE ANTES NO SE PODÍA Y AHORA SÍ ───────────────────
 *
 *  **F4.7 lo declaró imposible y tenía razón entonces.** El único origen de roles
 *  era `RoleIDs` de `LayoutDetail`: UUID sin nombre, y la unión de los que las
 *  pestañas nombran **deja afuera a todo rol que todavía no tiene pestaña** — que
 *  es justo el rol para el que uno abre el builder.
 *
 *  **B4.8 lo desbloqueó**: `GET /admin/tenants/:id/roles` devuelve los roles del
 *  cliente con su nombre, todos, tengan pestaña o no. Así que el selector se
 *  arma con la lista correcta y no con una aproximación.
 *
 *  Y el `.pen` confirma que va acá: «EL TENANT DEFINE EL CATÁLOGO Y LA PLANTILLA
 *  · EL ROL DEFINE QUÉ PESTAÑAS SE EDITAN».
 *
 *  ── Y LA HERENCIA DE PLANTILLA NO EXISTE EN NINGÚN LADO ─────────────────────
 *
 *  «Cuáles heredan de la plantilla de vertical y cuáles tienen override» supone
 *  tres cosas que el cable no tiene: que el tenant declare una **vertical** —no
 *  está ni en `TenantOption` ni en la ficha—, que exista una **plantilla** por
 *  vertical, y que una pestaña sepa si es **propia o heredada**. Sin las tres, la
 *  distinción no se puede pintar; con dos de tres, se pintaría mal.
 *
 *  **§PEN:B1** · B1 · «Selector de contexto».
 */
import { Label } from '../../render/primitives/Label'
import type { LayoutVersion, Tenant } from '../../api/admin'

const FALTANTES = [
  'Cuántos paneles de cada pestaña son HEREDADOS y cuántos propios · el `.pen` pide la proporción real y el cable no tiene herencia',
  'De qué plantilla de vertical hereda · el tenant no declara vertical y no hay plantillas',
  'Cuáles pestañas tienen OVERRIDE · una pestaña no sabe si es propia o heredada',
] as const

type Props = {
  tenants: readonly Tenant[]
  tenantActivo: string | null
  onTenant: (id: string) => void
  roles: readonly { id: string; nombre: string }[]
  rolActivo: string | null
  onRol: (id: string) => void
  versiones: readonly LayoutVersion[]
  versionActiva: string | null
  onVersion: (id: string) => void
  /** Las pestañas de la versión elegida · el editor de F4.8. Va como `children`
   *  y no como prop de datos: B1 es dueña del contexto —cliente y versión— y el
   *  borrador de pestañas es del contenedor, que es quien lo va a guardar. */
  children?: React.ReactNode
}

export function ContextView({
  tenants,
  tenantActivo,
  onTenant,
  roles,
  rolActivo,
  onRol,
  versiones,
  versionActiva,
  onVersion,
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Label id="builder-cliente">Cliente</Label>
        <select
          aria-labelledby="builder-cliente"
          className="bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
          value={tenantActivo ?? ''}
          onChange={(e) => onTenant(e.target.value)}
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <Label id="builder-rol">Rol</Label>
        {roles.length === 0 ? (
          // No es un error: es un cliente al que todavía no le definieron roles,
          // y la salida está en otra pantalla.
          <Label as="div">Sin roles definidos · se definen en la ficha de cliente · F4.3</Label>
        ) : (
          <select
            aria-labelledby="builder-rol"
            className="bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
            value={rolActivo ?? ''}
            onChange={(e) => onRol(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label as="div">Versiones de este cliente</Label>
        {versiones.length === 0 ? (
          // §8: el vacío invita a actuar. Y acá la salida es concreta.
          <Label as="div">
            Ninguna todavía · se crea un borrador con POST /admin/tenants/:id/layouts · F4.13
          </Label>
        ) : (
          <ul className="flex flex-col gap-1 m-0 p-0 list-none">
            {versiones.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => onVersion(v.id)}
                  aria-current={v.id === versionActiva ? 'true' : undefined}
                  className={
                    'w-full text-left text-celda px-3 py-2 rounded-sm ' +
                    (v.id === versionActiva ? 'bg-w3 text-ink' : 'text-dim hover:bg-w2')
                  }
                >
                  {/* **El estado va primero y sin color.** §2: prohibido el verde
                      y el rojo semánticos; lo que distingue un borrador de una
                      versión publicada es la palabra, no el tono. */}
                  <Label>{v.estado}</Label> {v.versionId}
                  {v.publicadoEn === null ? (
                    // Un borrador no tiene fecha de publicación, y poner la de
                    // creación diría que se publicó cuando no.
                    <Label> sin publicar</Label>
                  ) : (
                    <Label> {v.publicadoEn}</Label>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {children}

      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        <Label as="div">{`Faltan ${String(FALTANTES.length)} cosas que §7.2 pide de esta pantalla`}</Label>
        {FALTANTES.map((f) => (
          <Label key={f} as="div">
            {f}
          </Label>
        ))}
      </div>
    </div>
  )
}
