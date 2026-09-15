/** A1 · la banda de clientes · F4.2
 *
 *  ── LO QUE §7.3 PIDE Y LO QUE EL CABLE TRAE ─────────────────────────────────
 *
 *  `design.md` describe esta banda con seis columnas: **nombre, estado,
 *  vertical, cantidad de usuarios, frescura del feed más atrasado y última
 *  publicación**.
 *
 *  `GET /admin/tenants` devuelve **dos**: `id` y `name`. Es
 *  `ports.TenantPublicOption`, que se llama «public option» porque nació para
 *  llenar un selector, no para sostener una tabla de administración.
 *
 *  **Las cuatro que faltan no se inventan ni se omiten en silencio.** Omitirlas
 *  daría una tabla que parece completa y no lo es: quien la mire va a concluir
 *  que no hay nada que saber del estado de un cliente. Se declaran ausentes, con
 *  la gramática de §8 — estado, razón y qué lo desbloquea — que es la misma que
 *  el producto usa para un feed vencido.
 *
 *  Está pedido en B4.1 de `docs/PARA-BACKEND.md`.
 *
 *  ── Y LO QUE NO SE MUESTRA AUNQUE SE PUDIERA ────────────────────────────────
 *
 *  Nada de infraestructura · §7.3. El tenant tiene en la base su cuenta de
 *  Snowflake, su rol técnico y su llave privada, y **ninguna de las tres aparece
 *  acá ni va a aparecer**: esa capa la opera el equipo interno.
 */
import { Label } from '../../render/primitives/Label'
import type { Tenant } from '../../api/admin'

/** Lo que §7.3 pide y el cable no trae. Se declara acá y no en un comentario
 *  para que la pantalla lo diga: una columna que falta y nadie nombra es una
 *  columna que nadie pide. */
const COLUMNAS_QUE_FALTAN = [
  'estado',
  'vertical',
  'usuarios',
  'frescura del feed más atrasado',
  'última publicación',
] as const

type Props = {
  tenants: readonly Tenant[]
  /** Abrir la ficha del cliente · A2. */
  onAbrir: (id: string) => void
}

export function TenantList({ tenants, onAbrir }: Props) {
  if (tenants.length === 0) {
    // §8: el estado vacío es una invitación a actuar, no un error. Y acá la
    // causa probable es concreta.
    return (
      <div className="flex flex-col gap-2">
        <Label as="div">No hay clientes todavía</Label>
        <Label as="div">Se dan de alta con POST /admin/tenants</Label>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-w4">
            <th className="text-left py-2">
              <Label>Cliente</Label>
            </th>
            <th className="text-right py-2">
              <Label>Acción</Label>
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b border-w3">
              <td className="py-3 text-ink text-celda">{t.nombre}</td>
              <td className="py-3 text-right">
                <button
                  type="button"
                  onClick={() => onAbrir(t.id)}
                  className="text-label tracking-rotulo uppercase text-acc px-2 py-1 rounded-sm hover:bg-w2"
                >
                  Ver ficha
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* **La tabla declara lo que NO puede mostrar.** Es la gramática de §8
          aplicada a una carencia de datos y no a un panel: estado, razón, y qué
          lo desbloquea. Sin esto la tabla se lee como completa. */}
      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        <Label as="div">Faltan {COLUMNAS_QUE_FALTAN.length} columnas que el diseño pide</Label>
        <Label as="div">{COLUMNAS_QUE_FALTAN.join(' · ')}</Label>
        <Label as="div">
          GET /admin/tenants devuelve solo id y nombre · se desbloquea con B4.1
        </Label>
      </div>
    </div>
  )
}
