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
import { Accion } from '../../render/primitives/Accion'
import { EmptyRow } from './EmptyRow'
import { SkeletonRows } from './SkeletonRows'
import type { Formatter } from '../../render/format'
import type { Tenant } from '../../api/admin'

/** **Las dos columnas de A1 que el diseño pide y no se pintan** · el aviso
 *  salió de la pantalla el 2026-10-06 (decisión humana: «si no suman para el
 *  uso, quitar»). Quedan acá:
 *
 *  · Estado: los valores ya están decididos —activo, piloto y suspendido—;
 *    falta que el servicio lo envíe (`status`, «reservado … nil en v1»).
 *  · Vertical: son dos campos, la vertical y su plantilla de origen; falta que
 *    la plantilla entre en alcance (`vertical`, también nil en v1).
 */


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
              /* **Decía `POST /admin/tenants`** · 2026-09-30. Esa ruta existe y exige
                 siete credenciales de infraestructura que §7.3 prohíbe pedir en
                 pantalla, así que el alta la hace el equipo interno y acá se
                 ADOPTA — es D1, decidida ese día. Nombrar el endpoint además
                 prometía una acción que esta pantalla no tiene. */
              salida="Un cliente aparece acá cuando se lo da de alta; después se elige su plantilla."
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
                <Accion tamano="compacta" onClick={() => onAbrir(t.id)} etiqueta={`Ver ficha de ${t.nombre}`}>
                  Ver ficha
                </Accion>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}
