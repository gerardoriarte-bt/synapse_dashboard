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
 *  ── UNA LISTA PARA ELEGIR, NO UNA TABLA · 2026-10-09 ───────────────────────
 *
 *  **Decisión humana (P1 de `AUDITORIA-2026-10-08-admin-clientes-y-usuarios.md`):
 *  la lista va a la izquierda y la ficha del elegido a la derecha**, en la misma
 *  pantalla. Antes eran dos pestañas con dos formas de elegir cliente que no se
 *  hablaban. Una tabla de cinco columnas no entra en 360 px, así que cada
 *  cliente es una fila elegible con tres líneas: nombre, cómo se lo distingue,
 *  y su estado operativo —usuarios, feed, publicación—.
 *
 *  **Se distingue por la forma corta, o por el id si no tiene.** En la base
 *  local hay dos «Under Armour México» —uno es el de la versión anterior de
 *  Synapse— y la fila no decía cuál era cuál. El dibujo pone el id bajo el
 *  nombre por eso mismo.
 *
 *  **§PEN:A1** · A1 · «Clientes y plataforma».
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Opcion } from '../../render/primitives/Opcion'
import type { Formatter } from '../../render/format'
import type { Tenant } from '../../api/admin'
import { distintivo } from './distintivo'

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
  /** Del locale de quien mira · F1.13b. */
  format: Formatter
  /** El cliente cuya ficha está a la derecha. */
  seleccionado: string | null
  /** Elegir un cliente · su ficha se abre al lado. */
  onElegir: (id: string) => void
  /** Mientras la lista vuela. */
  cargando?: boolean
}

export function TenantList({ format, tenants, seleccionado, onElegir, cargando = false }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const q = busqueda.trim().toLowerCase()
  const visibles = tenants.filter(
    (t) =>
      q === '' ||
      t.nombre.toLowerCase().includes(q) ||
      t.formaCorta.toLowerCase().includes(q) ||
      t.id.toLowerCase().startsWith(q),
  )

  return (
    <section className="flex flex-col gap-3" aria-label="Clientes" aria-busy={cargando}>
      {/* El conteo dice CARGANDO y no una cifra: «3 clientes» mientras carga es
          afirmar algo que todavía no llegó. */}
      <Label as="div">
        {cargando ? 'Clientes · cargando' : `Clientes · ${String(tenants.length)}`}
      </Label>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar cliente"
        placeholder="BUSCAR CLIENTE"
        className="font-mono text-label leading-rotulo tracking-rotulo uppercase text-ink bg-transparent border border-w3 rounded-md px-2 py-1"
      />

      {/* **Esqueleto y nunca spinner** · la nota de `A1 · Clientes · cargando`:
          la lista ya sabe qué forma va a llegar y la promete. Cuatro filas, como
          el dibujo, sin animación, y barras de anchos distintos para que se lean
          como texto que viene y no como un patrón. */}
      {cargando && (
        <ul className="flex flex-col gap-2 list-none m-0 p-0">
          {[0, 1, 2, 3].map((f) => (
            <li key={f} aria-hidden="true" className="flex flex-col gap-2 rounded-md border border-w3 px-3 py-2">
              <div className="bg-w2 rounded-xs h-3 w-3/4" />
              <div className="bg-w2 rounded-xs h-3 w-1/3" />
              <div className="bg-w2 rounded-xs h-3 w-2/3" />
            </li>
          ))}
        </ul>
      )}

      {/* **Los vacíos dicen qué pasó y qué hacer** · §8. Sin clientes es de
          alta; con clientes y sin coincidencias es de filtro. */}
      {!cargando && tenants.length === 0 && (
        <div className="flex flex-col gap-1">
          <Ayuda>Ningún cliente dado de alta todavía.</Ayuda>
          <Ayuda>Un cliente aparece acá cuando se lo da de alta; después se elige su plantilla.</Ayuda>
        </div>
      )}
      {tenants.length > 0 && visibles.length === 0 && (
        <Ayuda>Ningún cliente coincide con la búsqueda.</Ayuda>
      )}

      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {visibles.map((t) => (
          <li key={t.id}>
            <Opcion
              forma="fila"
              elegida={t.id === seleccionado}
              onClick={() => onElegir(t.id)}
              etiqueta={`${t.nombre} · ${distintivo(t)}`}
            >
              <span className="flex flex-col gap-1 min-w-0">
                <span className="text-ink text-celda">{t.nombre}</span>
                <Label as="span">{distintivo(t)}</Label>
                {/* Usuarios, feed y publicación en una línea: son el estado
                    operativo, que es lo que decide a cuál entrar. «Nunca» y no
                    un guion: que un cliente jamás haya publicado es un hecho. */}
                <Label as="span">
                  {`${String(t.usuarios)} ${t.usuarios === 1 ? 'usuario' : 'usuarios'} · feed ${frescura(t.peorFuenteHoras, t.peorFuente)} · ${t.publicadoEn === null ? 'nunca publicó' : `publicó ${format.calendar(t.publicadoEn)}`}`}
                </Label>
              </span>
            </Opcion>
          </li>
        ))}
      </ul>
    </section>
  )
}
