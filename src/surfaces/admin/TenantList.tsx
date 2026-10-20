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
 *  ── CARDS · 2026-10-20 ────────────────────────────────────────────────────
 *
 *  **La lista lado a lado con la ficha se reabrió** por decisión humana del
 *  2026-10-20 —«un scroll muy grande, se puede organizar la mayoría de la info
 *  en cards»—: Clientes es una grilla de cards y la ficha, una página propia ·
 *  §5 de `docs/PROPUESTA-2026-10-20-identidad-del-cliente-y-ficha.md`. Cada card
 *  lleva la identidad —placa, nombre y forma corta— y el estado operativo, y
 *  la card entera abre la ficha. La del cliente activo dice «En uso».
 *
 *  ── UNA LISTA PARA ELEGIR, NO UNA TABLA · 2026-10-09 · reemplazado ────────
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
import type { Formatter } from '../../render/format'
import type { Tenant } from '../../api/admin'
import { PlacaDeCliente } from '../PlacaDeCliente'
import { distintivo } from './distintivo'

/** La frescura del feed más atrasado, en palabras. **`null` es «nunca» y `0`
 *  es «recién»**: confundirlas pinta una fuente muerta como sana. */
function frescura(horas: number | null, estado: string): string {
  if (horas === null) return estado === 'unknown' ? 'Nunca cargó' : '—'
  if (horas < 1) return 'Recién'
  return `Hace ${String(Math.round(horas))} h`
}

type Props = {
  tenants: readonly Tenant[]
  /** Del locale de quien mira · F1.13b. */
  format: Formatter
  /** El cliente activo · su card dice «En uso». */
  seleccionado: string | null
  /** Abrir la ficha de un cliente, que lo vuelve el activo. */
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
      distintivo(t).toLowerCase().includes(q) ||
      t.id.toLowerCase().startsWith(q),
  )

  return (
    <section className="flex flex-col gap-4" aria-label="Clientes" aria-busy={cargando}>
      <div className="flex items-center justify-between gap-4">
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
          placeholder="Buscar cliente"
          className="h-8 w-64 rounded-md border-0 bg-elev px-3 font-body text-celda text-ink placeholder:text-dim"
        />
      </div>

      {/* **Esqueleto y nunca spinner** · la nota de `A1 · Clientes · cargando`:
          la grilla ya sabe qué forma va a llegar y la promete. Barras de anchos
          distintos para que se lean como texto que viene y no como un patrón. */}
      {cargando && (
        <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0">
          {[0, 1, 2].map((f) => (
            <li key={f} aria-hidden="true" className="flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-5">
              <div className="h-3 w-3/4 rounded-xs bg-w2" />
              <div className="h-3 w-1/3 rounded-xs bg-w2" />
              <div className="h-3 w-2/3 rounded-xs bg-w2" />
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
      {tenants.length > 0 && visibles.length === 0 && <Ayuda>Ningún cliente coincide con la búsqueda.</Ayuda>}

      <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0">
        {visibles.map((t) => {
          const enUso = t.id === seleccionado
          return (
            <li key={t.id} className="flex">
              <button
                type="button"
                onClick={() => onElegir(t.id)}
                aria-pressed={enUso}
                aria-label={`${t.nombre} · ${distintivo(t)}`}
                className={
                  'flex w-full cursor-pointer flex-col gap-4 rounded-xl border bg-panel p-5 text-left hover:bg-w1 ' +
                  (enUso ? 'border-acc' : 'border-w3')
                }
              >
                <span className="flex w-full items-center gap-3">
                  <PlacaDeCliente nombre={t.nombre} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
                      {t.nombre}
                    </span>
                    <Label as="span">{distintivo(t)}</Label>
                  </span>
                  {enUso && (
                    <span className="shrink-0 rounded-sm border border-acc px-2 py-0.5 font-mono text-nota leading-rotulo tracking-rotulo uppercase text-ink">
                      En uso
                    </span>
                  )}
                </span>

                <span aria-hidden className="h-px w-full bg-w3" />

                {/* Usuarios, feed y publicación: el estado operativo, que es lo
                    que decide a cuál entrar. «Nunca» y no un guion: que un
                    cliente jamás haya publicado es un hecho. */}
                <span className="grid w-full grid-cols-[auto_1fr_auto] gap-6">
                  <span className="flex flex-col gap-1">
                    <Label as="span">Usuarios</Label>
                    <span className="font-body text-cuerpo text-ink">{t.usuarios}</span>
                  </span>
                  <span className="flex flex-col gap-1">
                    <Label as="span">Feed más atrasado</Label>
                    <span className="font-body text-cuerpo text-ink">{frescura(t.peorFuenteHoras, t.peorFuente)}</span>
                  </span>
                  <span className="flex flex-col gap-1">
                    <Label as="span">Última publicación</Label>
                    <span className="font-body text-cuerpo text-ink">
                      {t.publicadoEn === null ? 'Nunca' : format.calendar(t.publicadoEn)}
                    </span>
                  </span>
                </span>

                <span className="flex w-full items-center justify-end gap-1.5 font-mono text-nota leading-rotulo tracking-rotulo uppercase text-ink">
                  Abrir ficha
                  {/* `arrow-right` de línea · hereda el color. */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
