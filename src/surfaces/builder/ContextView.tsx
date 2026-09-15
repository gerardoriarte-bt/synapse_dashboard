/** B1 · Selector de contexto de edición · F4.7
 *
 *  §7.2: «Elegir **tenant y rol**. Muestra qué pestañas existen, cuáles heredan
 *  de la **plantilla de vertical** y cuáles tienen **override**. Punto de entrada
 *  de todo el builder.»
 *
 *  Son cuatro cosas y el cable sostiene dos: **el tenant y las pestañas**.
 *
 *  ── POR QUÉ NO HAY SELECTOR DE ROL, QUE PARECE QUE SÍ SE PODRÍA ─────────────
 *
 *  Sí se podría: `LayoutDetail` trae `RoleIDs` por pestaña, así que la unión de
 *  todas da una lista de roles y un `select` se llena solo. **Y sería la lista
 *  equivocada, por dos razones distintas.**
 *
 *  1. **Son IDs, no nombres.** `RoleIDs` es un arreglo de UUID y no hay ruta que
 *     los resuelva a un nombre. Un selector de roles que ofrece
 *     `a3f1…-…-9c2e` no es un selector, es plomería en pantalla — lo mismo que
 *     §7.3 prohíbe mostrar del lado de administración.
 *  2. **Y le faltaría justo el rol que importa.** La unión de los roles que las
 *     pestañas nombran deja afuera a **todo rol que todavía no tiene pestaña**, y
 *     ése es precisamente el rol para el que uno abre el builder. Un selector que
 *     esconde el caso de uso se ve igual que uno completo.
 *
 *  Los roles del tenant salen de B4.8, que escribimos nosotros. Hasta entonces se
 *  declara, no se aproxima.
 *
 *  ── Y LA HERENCIA DE PLANTILLA NO EXISTE EN NINGÚN LADO ─────────────────────
 *
 *  «Cuáles heredan de la plantilla de vertical y cuáles tienen override» supone
 *  tres cosas que el cable no tiene: que el tenant declare una **vertical** —no
 *  está ni en `TenantOption` ni en la ficha—, que exista una **plantilla** por
 *  vertical, y que una pestaña sepa si es **propia o heredada**. Sin las tres, la
 *  distinción no se puede pintar; con dos de tres, se pintaría mal.
 */
import { Label } from '../../render/primitives/Label'
import type { LayoutDetalle, LayoutVersion, Tenant } from '../../api/admin'

const FALTANTES = [
  'Elegir ROL · RoleIDs son UUID sin nombre, y la unión de los roles de las pestañas deja afuera al rol que todavía no tiene ninguna · B4.8',
  'Qué pestañas HEREDAN de la plantilla de vertical · el tenant no declara vertical y no hay plantillas',
  'Cuáles tienen OVERRIDE · una pestaña no sabe si es propia o heredada',
] as const

type Props = {
  tenants: readonly Tenant[]
  tenantActivo: string | null
  onTenant: (id: string) => void
  versiones: readonly LayoutVersion[]
  versionActiva: string | null
  onVersion: (id: string) => void
  /** `undefined` mientras vuela o cuando no hay versión elegida. */
  detalle: LayoutDetalle | undefined
}

export function ContextView({
  tenants,
  tenantActivo,
  onTenant,
  versiones,
  versionActiva,
  onVersion,
  detalle,
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

      {detalle !== undefined && (
        <div className="flex flex-col gap-2">
          <Label as="div">{`Pestañas · ${String(detalle.tabs.length)}`}</Label>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-w4">
                {['Orden', 'Pestaña', 'Pregunta operativa', 'Paneles', 'Alcance'].map((h) => (
                  <th key={h} className="text-left py-2">
                    <Label>{h}</Label>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...detalle.tabs]
                .sort((a, b) => a.tab.orden - b.tab.orden)
                .map(({ tab, panels }) => (
                  <tr key={tab.id} className="border-b border-w3">
                    <td className="py-2 text-dim text-celda">{tab.orden}</td>
                    <td className="py-2 text-ink text-celda">{tab.nombre}</td>
                    {/* **Una pestaña sin pregunta se declara, no se disimula.**
                        §7.2 F4.8: «una pestaña que no contesta una pregunta no se
                        compone». Una celda vacía se leería como un dato que
                        falta; el hueco dicho se lee como lo que es. */}
                    <td className="py-2 text-celda">
                      {tab.pregunta === '' ? (
                        <Label>Sin pregunta · no se debería poder componer</Label>
                      ) : (
                        <span className="text-ink">{tab.pregunta}</span>
                      )}
                    </td>
                    <td className="py-2 text-dim text-celda">{panels.length}</td>
                    {/* Cuántos roles, no cuáles: los IDs no tienen nombre. Y el
                        vacío significa «la ven todos», que no es lo mismo que
                        «ninguno» — decirlo es la mitad del dato. */}
                    <td className="py-2 text-celda">
                      {tab.roles.length === 0 ? (
                        <Label>Todos los roles</Label>
                      ) : (
                        <Label>{`${String(tab.roles.length)} rol(es) · sin nombre · B4.8`}</Label>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

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
