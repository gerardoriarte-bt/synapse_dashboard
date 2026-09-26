/** A1 · la banda de clientes · F4.2
 *
 *  ── LO QUE §7.3 PIDE Y LO QUE EL CABLE TRAE ─────────────────────────────────
 *
 *  `design.md` describe esta banda con seis columnas: **nombre, estado,
 *  vertical, cantidad de usuarios, frescura del feed más atrasado y última
 *  publicación**.
 *
 *  ── **B4.1 LLEGÓ** · 2026-09-26, medido contra `8633b10` ───────────────────
 *
 *  Acá decía que `GET /admin/tenants` devuelve **dos** campos —`id` y `name`,
 *  `ports.TenantPublicOption`, «public option» porque nació para llenar un
 *  selector— y que las otras cinco columnas se declaraban ausentes.
 *
 *  **Llegaron tres**: usuarios, frescura del feed más atrasado y última
 *  publicación. Las escribimos en el fork y las implementaron ellos.
 *
 *  **Las dos que quedan son una pregunta NUESTRA, no un hueco suyo.** `status` y
 *  `vertical` vienen en `null` porque el campo existe y nadie definió sus
 *  valores; lo dicen en su respuesta del 2026-09-25. Por eso el aviso del pie
 *  cambió de razón y no sólo de número: «se desbloquea con B4.1» habría quedado
 *  esperando algo que ya pasó.
 *
 *  Lo que sigue valiendo es por qué se declaran: omitirlas daría una tabla que
 *  parece completa y no lo es. Se declaran ausentes con la gramática de §8
 *  —estado, razón y qué lo desbloquea—, la misma que el producto usa para un
 *  feed vencido.
 *
 *  ── Y LO QUE NO SE MUESTRA AUNQUE SE PUDIERA ────────────────────────────────
 *
 *  Nada de infraestructura · §7.3. El tenant tiene en la base su cuenta de
 *  Snowflake, su rol técnico y su llave privada, y **ninguna de las tres aparece
 *  acá ni va a aparecer**: esa capa la opera el equipo interno.
 *
 *  **§PEN:A1** · A1 · «Clientes y plataforma».
 */
import { Label } from '../../render/primitives/Label'
import { EmptyRow } from './EmptyRow'
import { SkeletonRows } from './SkeletonRows'
import type { Formatter } from '../../render/format'
import type { Tenant } from '../../api/admin'

/** Lo que §7.3 pide y el cable no trae. Se declara acá y no en un comentario
 *  para que la pantalla lo diga: una columna que falta y nadie nombra es una
 *  columna que nadie pide. */
const COLUMNAS_QUE_FALTAN = ['estado', 'vertical'] as const


/** `null` es «nunca cargó» y `0` es «recién». No se colapsan. */
function frescura(horas: number | null, estado: string): string {
  if (horas === null) return estado === 'unknown' ? 'Nunca cargó' : '—'
  if (horas < 1) return 'Recién'
  return `${String(Math.round(horas))} h`
}

type Props = {
  tenants: readonly Tenant[]
  /** Del locale del tenant · F1.13b. Antes acá había un `Intl` con `'es-MX'`. */
  format: Formatter
  /** Abrir la ficha del cliente · A2. */
  onAbrir: (id: string) => void
  /** Mientras la lista vuela. **La tabla se pinta igual**: encabezado completo y
   *  filas de esqueleto · `SkeletonRows`. */
  cargando?: boolean
}

export function TenantList({ format, tenants, onAbrir, cargando = false }: Props) {
  // **Nunca se sale de la tabla.** El vacío es una FILA, no un reemplazo: «las
  // columnas siguen diciendo qué habría acá» · las tres notas del `.pen`. Una
  // pantalla que se vacía entera pierde lo único que explicaba qué falta.
  const vacio = tenants.length === 0 && !cargando

  return (
    <div className="flex flex-col gap-4">
      {/* El conteo dice CARGANDO y no una cifra: «3 clientes» mientras carga es
          afirmar algo que todavía no llegó. */}
      <Label as="div">
        {cargando ? 'Clientes · cargando' : `Clientes · ${String(tenants.length)}`}
      </Label>

      <table className="w-full border-collapse" aria-busy={cargando}>
        <thead>
          <tr className="border-b border-w4">
            <th className="text-left py-2">
              <Label>Cliente</Label>
            </th>
            <th className="text-left py-2">
              <Label>Usuarios</Label>
            </th>
            <th className="text-left py-2">
              <Label>Feed más atrasado</Label>
            </th>
            <th className="text-left py-2">
              <Label>Última publicación</Label>
            </th>
            <th className="text-right py-2">
              <Label>Acción</Label>
            </th>
          </tr>
        </thead>
        <tbody>
          {cargando && <SkeletonRows columnas={5} />}
          {vacio && (
            <EmptyRow
              clase="sistema"
              columnas={5}
              razon="Ningún cliente dado de alta todavía"
              salida="Se crean con POST /admin/tenants · crear uno exige elegir plantilla de vertical"
            />
          )}
          {tenants.map((t) => (
            <tr key={t.id} className="border-b border-w3">
              <td className="py-3 text-ink text-celda">{t.nombre}</td>
              <td className="py-3 text-ink text-celda">{t.usuarios}</td>
              <td className="py-3">
                {/* Dos datos en una celda porque son uno: cuánto hace y de qué
                    fuente. La hora sola no dice si está bien — eso depende de la
                    cadencia, que el servicio ya consideró al reducir. */}
                <div className="flex flex-col gap-1">
                  <span className="text-ink text-celda">
                    {frescura(t.peorFuenteHoras, t.peorFuente)}
                  </span>
                  <Label as="div">{t.peorFuente}</Label>
                </div>
              </td>
              <td className="py-3 text-ink text-celda">
                {/* «Nunca» y no un guion: que un cliente jamás haya publicado es
                    un hecho operativo, no un dato ausente. */}
                {t.publicadoEn === null ? 'Nunca' : format.calendar(t.publicadoEn)}
              </td>
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
        {/* **La razón cambió de dueño** · 2026-09-26. Acá decía «GET
            /admin/tenants devuelve solo id y nombre · se desbloquea con B4.1», y
            B4.1 llegó: las dos que faltan vienen en `null` esperando que
            NOSOTROS definamos sus valores. Dejar la razón vieja habría hecho que
            la pantalla siguiera esperando a otro equipo. */}
        <Label as="div">
          El campo llega vacío · falta que definamos qué valores toma cada una
        </Label>
      </div>
    </div>
  )
}
